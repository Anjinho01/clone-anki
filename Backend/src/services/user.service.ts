import userRepository from '../repositories/user.repository';
import activityLogRepository from '../repositories/activityLog.repository';
import { hashPassword } from '../utils/password';
import { toUser, User, RoleName } from '../models/user.model';
import { CreateUserDTO, UpdateUserDTO } from '../dtos/auth.dto';
import { comparePassword } from '../utils/password';
import { ConflictError, NotFoundError, ForbiddenError, HttpError } from '../errors/httpError';

const userService = {
  /**
   * Admin cria novo usuário (aluno, admin ou develop)
   * Develop pode criar qualquer role. Admin pode criar apenas 'admin' e 'user'.
   */
  async createUser(
    data: CreateUserDTO,
    adminId: number,
    adminRole: RoleName
  ): Promise<User> {
    // Verificar permissão de criação de role
    const targetRole = data.role || 'user';

    if (targetRole === 'develop' && adminRole !== 'develop') {
      throw new ForbiddenError('Apenas o develop pode criar outros develops');
    }

    // Verificar duplicidade de email
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email já cadastrado');
    }

    const passwordHash = await hashPassword(data.password);
    const userId = await userRepository.create(
      data.name,
      data.email,
      passwordHash,
      targetRole,
      adminId
    );

    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Erro ao criar usuário');

    await activityLogRepository.insert({
      tableName: 'tb_users',
      recordId: userId,
      action: 'CREATE',
      userId: adminId,
      summary: `Usuário criado por admin: ${data.name} (${targetRole})`,
      details: { email: data.email, role: targetRole },
    });

    return toUser(user);
  },

  /**
   * Listar usuários com filtros e paginação
   */
  async listUsers(filters?: {
    page?: number;
    limit?: number;
    status?: string;   // 'actived' | 'deactivated' | 'all'
    roles?: string;    // comma-separated role names: 'develop,admin,user'
    search?: string;
    // legacy params kept for backward compat
    role?: RoleName;
    isActive?: boolean;
    offset?: number;
  }): Promise<{ users: User[]; total: number; page: number; limit: number; totalPages: number }> {
    const page  = filters?.page  || 1;
    const limit = filters?.limit || 30;

    const rolesArray = filters?.roles
      ? filters.roles.split(',').map((r) => r.trim()).filter(Boolean) as RoleName[]
      : undefined;

    const { users, total } = await userRepository.findAll({
      ...filters,
      page,
      limit,
      roles: rolesArray,
    });

    return {
      users: users.map(toUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Buscar usuário por ID
   */
  async getUserById(id: number): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return toUser(user);
  },

  /**
   * Admin atualiza dados de um usuário
   */
  async updateUser(
    id: number,
    data: UpdateUserDTO,
    adminId: number,
    adminRole: RoleName
  ): Promise<User> {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError('Usuário não encontrado');

    // Não permitir admin editar develop (a não ser que seja develop)
    if (existing.role === 'develop' && adminRole !== 'develop') {
      throw new ForbiddenError('Apenas o develop pode alterar outros develops');
    }

    // Não permitir promover para develop a não ser que seja develop
    if (data.role === 'develop' && adminRole !== 'develop') {
      throw new ForbiddenError('Apenas o develop pode promover para develop');
    }

    // Verificar duplicidade de email no update
    if (data.email && data.email !== existing.email) {
      const dup = await userRepository.findByEmail(data.email);
      if (dup) throw new ConflictError('Email já cadastrado');
    }

    const fields: Record<string, unknown> = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.email !== undefined) fields.email = data.email;
    if (data.isActive !== undefined) fields.is_active = data.isActive;

    if (data.password) {
      fields.password_hash = await hashPassword(data.password);
    }

    if (data.role) {
      const roleId = await userRepository.getRoleId(data.role);
      fields.role_id = roleId;
    }

    if (Object.keys(fields).length > 0) {
      await userRepository.updateUser(id, fields);
    }

    const updated = await userRepository.findById(id);

    await activityLogRepository.insert({
      tableName: 'tb_users',
      recordId: id,
      action: 'UPDATE',
      userId: adminId,
      summary: `Usuário atualizado por admin: ${updated!.name}`,
      details: { changedFields: Object.keys(fields) },
    });

    return toUser(updated!);
  },

  /**
   * Usuário logado atualiza os próprios dados
   */
  async updateMe(userId: number, data: { name?: string; email?: string }): Promise<User> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('Usuário não encontrado');

    if (data.email && data.email !== existing.email) {
      const dup = await userRepository.findByEmail(data.email);
      if (dup) throw new ConflictError('Email já cadastrado');
    }

    const fields: Record<string, unknown> = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.email !== undefined) fields.email = data.email;

    if (Object.keys(fields).length > 0) {
      await userRepository.updateUser(userId, fields);
    }

    const updated = await userRepository.findById(userId);
    return toUser(updated!);
  },

  /**
   * Usuário logado troca a própria senha (verifica senha atual)
   */
  async resetPasswordMe(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('Usuário não encontrado');

    const match = await comparePassword(currentPassword, existing.password_hash);
    if (!match) throw new HttpError(401, 'Senha atual incorreta');

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, passwordHash);
    return true;
  },

  /**
   * Admin redefine a senha de um usuário sem verificar senha atual
   */
  async resetPasswordById(id: number, newPassword: string): Promise<boolean> {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError('Usuário não encontrado');

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(id, passwordHash);
    return true;
  },

  /**
   * Ativar/desativar usuário
   */
  async toggleActive(
    id: number,
    isActive: boolean,
    adminId: number,
    adminRole: RoleName
  ): Promise<User> {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError('Usuário não encontrado');

    // Não permitir desativar develop (a não ser que seja develop)
    if (existing.role === 'develop' && adminRole !== 'develop') {
      throw new ForbiddenError('Apenas o develop pode desativar outros develops');
    }

    // Não permitir desativar a si mesmo
    if (id === adminId) {
      throw new ForbiddenError('Não é possível desativar a própria conta');
    }

    await userRepository.toggleActive(id, isActive);
    const updated = await userRepository.findById(id);

    await activityLogRepository.insert({
      tableName: 'tb_users',
      recordId: id,
      action: 'UPDATE',
      userId: adminId,
      summary: `Usuário ${isActive ? 'ativado' : 'desativado'}: ${updated!.name}`,
    });

    return toUser(updated!);
  },
};

export default userService;
