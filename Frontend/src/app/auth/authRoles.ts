/**
 * Authorization Roles
 */

const develop = 'develop';
const admin = 'admin';
const monitor = 'monitor';
const user = 'user';

export const systemRoles = [develop, admin, monitor, user];
export const managementRoles = [develop, admin, monitor];

export function canManageStudyContent(role?: string | null): boolean {
  if (!role) return false;

  return managementRoles.includes(role);
}

export function canCreatePrivateStudyContent(role?: string | null): boolean {
  if (!role) return false;

  return systemRoles.includes(role);
}

const authRoles = {
  develop: [develop],
  admin: [develop, admin],
  monitor: [develop, admin, monitor],
  user: [develop, admin, monitor, user],
  all: [...systemRoles],
  onlyGuest: [],
};

export default authRoles;
