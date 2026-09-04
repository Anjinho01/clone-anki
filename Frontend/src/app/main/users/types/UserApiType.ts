/*** tipo de cada usuario vindo da API (antes de adicionar o `id`) ***/
export interface UserApi {
  userId: number;
  name: string;
  login: string;
  email: string;
  actived: boolean;
  roleId: number;
  role: string;
}

/*** paginação que acompanha o array de usuarios ***/
export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

/*** formato completo da resposta JSON ***/
export interface UserApiResponse {
  data: UserApi | null;
}

/*** formato completo da resposta JSON ***/
export interface UsersApiResponse {
  data: UserApi[];
  pagination: Pagination;
}
