/*** tipo de cada função vindo da API (antes de adicionar o `id`) ***/
export interface RoleApi {
  roleId: number;
  role: string;
}

/*** formato completo da resposta JSON ***/
export interface RolesApiResponse {
  data: RoleApi[];
}
