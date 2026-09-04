import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import logger from '../config/logger';
import userRepository from '../repositories/user.repository';
import activityLogRepository from '../repositories/activityLog.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { UserRow, toUser } from '../models/user.model';
import {
  SigninDTO,
  AuthResponse,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
} from '../dtos/auth.dto';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '../errors/httpError';

const authService = {
  /**
   * Login — retorna access token + gera refresh token
   */
  async signin(
    data: SigninDTO,
    ip: string,
    userAgent: string
  ): Promise<{ auth: AuthResponse; refreshToken: string; refreshExpiresAt: Date }> {
    const user = await userRepository.findByEmail(data.email);

    if (!user || !user.is_active) {
      await userRepository.logAccess(null, data.email, false, ip, userAgent);
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const validPassword = await comparePassword(data.password, user.password_hash);
    if (!validPassword) {
      await userRepository.logAccess(user.id, data.email, false, ip, userAgent);
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Gerar tokens
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, jti, expiresAt } = generateRefreshToken(data.rememberMe);

    // Salvar hash do refresh token no banco (padrão Kaizen — SHA-256)
    const tokenHash = hashToken(refreshToken);
    await userRepository.saveRefreshToken(user.id, tokenHash, jti, expiresAt);

    // Log de acesso
    await userRepository.logAccess(user.id, data.email, true, ip, userAgent);

    return {
      auth: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
      },
      refreshToken,
      refreshExpiresAt: expiresAt,
    };
  },

  /**
   * Renovar access token via refresh token (rotation)
   * Padrão Kaizen: revoga o antigo, emite novo, marca replaced_by
   */
  async refresh(
    refreshToken: string
  ): Promise<{ accessToken: string; newRefreshToken: string; expiresAt: Date }> {
    const tokenHash = hashToken(refreshToken);

    // Decodificar para pegar o jti
    let jti: string;
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { jti: string; userId: number };
      jti = decoded.jti;
    } catch {
      throw new UnauthorizedError('Refresh token inválido ou expirado');
    }

    // Buscar no banco
    const stored = await userRepository.findRefreshTokenByJti(jti);
    if (!stored) {
      throw new UnauthorizedError('Refresh token não encontrado ou já revogado');
    }

    // Verificar hash
    if (stored.token_hash !== tokenHash) {
      // Possível roubo de token — revogar todos do usuário
      await userRepository.revokeAllUserTokens(stored.user_id);
      logger.warn('Possível roubo de refresh token detectado', { userId: stored.user_id, jti });
      throw new UnauthorizedError('Refresh token comprometido. Todos os tokens foram revogados.');
    }

    // Gerar novo par
    const user = await userRepository.findById(stored.user_id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Usuário inativo');
    }

    const accessToken = generateAccessToken(user);
    const newRT = generateRefreshToken(false);

    // Revogar antigo e salvar novo (rotation com replaced_by)
    await userRepository.revokeRefreshToken(jti, newRT.jti);
    const newTokenHash = hashToken(newRT.token);
    await userRepository.saveRefreshToken(user.id, newTokenHash, newRT.jti, newRT.expiresAt);

    return {
      accessToken,
      newRefreshToken: newRT.token,
      expiresAt: newRT.expiresAt,
    };
  },

  /**
   * Logout — revoga refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { jti: string };
      await userRepository.revokeRefreshToken(decoded.jti);
    } catch {
      // Token já expirado/inválido — ignora silenciosamente
    }
  },

  /**
   * Forgot password — gera OTP de 6 dígitos
   */
  async forgotPassword(data: ForgotPasswordDTO): Promise<void> {
    const user = await userRepository.findByEmail(data.email);

    // Não revelar se o email existe
    if (!user) return;

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await userRepository.savePasswordResetToken(user.id, code, expiresAt);

    // TODO: Enviar email com o código via EmailService
    logger.info('Código de reset gerado', { userId: user.id, code: env.isDev() ? code : '***' });
  },

  /**
   * Reset password com OTP
   */
  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    const result = await userRepository.findValidResetToken(data.email, data.code);

    if (!result) {
      throw new BadRequestError('Código inválido ou expirado');
    }

    const passwordHash = await hashPassword(data.newPassword);
    await userRepository.updatePassword(result.userId, passwordHash);
    await userRepository.markResetTokenUsed(result.userId, data.code);
    await userRepository.revokeAllUserTokens(result.userId);

    await activityLogRepository.insert({
      tableName: 'tb_users',
      recordId: result.userId,
      action: 'UPDATE',
      userId: result.userId,
      summary: 'Senha redefinida via reset',
    });
  },

  /**
   * Alterar senha (autenticado)
   */
  async changePassword(userId: number, data: ChangePasswordDTO): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const valid = await comparePassword(data.currentPassword, user.password_hash);
    if (!valid) throw new BadRequestError('Senha atual incorreta');

    const passwordHash = await hashPassword(data.newPassword);
    await userRepository.updatePassword(userId, passwordHash);
    await userRepository.revokeAllUserTokens(userId);

    await activityLogRepository.insert({
      tableName: 'tb_users',
      recordId: userId,
      action: 'UPDATE',
      userId,
      summary: 'Senha alterada pelo usuário',
    });
  },

  /**
   * Perfil do usuário autenticado
   */
  async getProfile(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return toUser(user);
  },
};

// -- Helpers internos ---

function generateAccessToken(user: UserRow): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

function generateRefreshToken(rememberMe?: boolean): {
  token: string;
  jti: string;
  expiresAt: Date;
} {
  const jti = crypto.randomUUID();
  const days = rememberMe ? env.REFRESH_TOKEN_REMEMBER_DAYS : env.REFRESH_TOKEN_EXPIRES_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    { jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${days}d` } as jwt.SignOptions
  );

  return { token, jti, expiresAt };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default authService;
