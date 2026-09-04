/** Cria um novo package público. */
export interface CreatePackageDTO {
  name: string;
  description?: string;
  position?: number;
}

/** Atualiza um package existente. */
export interface UpdatePackageDTO {
  name?: string;
  description?: string;
  position?: number;
}
