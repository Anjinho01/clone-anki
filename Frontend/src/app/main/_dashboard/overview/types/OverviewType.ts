/**
 * Status Type
 */
export type StatusType = {
  status: string;
  total: number;
};

/*** formato completo da resposta JSON ***/
export interface StatusApiResponse {
  total: number;
  overviewStatus: StatusType[];
}

/**
 * Suspension Type
 */
export type SuspensionType = {
  total: number;
  patient: number;
  structure: number;
  team: number;
};

export interface SuspensionApiResponse {
  total: number;
  patient: number;
  structure: number;
  team: number;
}

/**
 * Fist Type
 */
export type FirstBucketsPct = {
  le0730: number;
  between0730_0800: number;
  gt0800: number;
};

export type FistType = {
  total: number; // total considerado (inclui nulos como "agora")
  le0730: number; // <= 07:30
  between0730_0800: number; // (07:30, 08:00]
  gt0800: number; // > 08:00
  pct: FirstBucketsPct;
};

export interface FistApiResponse {
  total: number; // total considerado (inclui nulos como "agora")
  le0730: number; // <= 07:30
  between0730_0800: number; // (07:30, 08:00]
  gt0800: number; // > 08:00
  pct: FirstBucketsPct;
}

/**
 * Destination Type
 */
export type DestinationType = {
  total: number;
  morgue: number; // Morgue
  uti: number; // UTI
  srpa: number; // SRPA
};

export interface DestinationApiResponse {
  total: number;
  morgue: number;
  uti: number;
  srpa: number;
}
