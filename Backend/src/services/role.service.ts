import { roleRepository } from '../repositories/role.repository';
import { RoleRow } from '../models/role.model';
import { HttpError } from '../errors/httpError';

export const roleService = {
  async getRoles(): Promise<RoleRow[]> {
    return roleRepository.findAll();
  },

  async getRoleById(id: number): Promise<RoleRow> {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new HttpError(404, 'Role não encontrada');
    }
    return role;
  },
};
