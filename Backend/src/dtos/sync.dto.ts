/**
 * DTOs e interfaces do sistema de sincronização
 * Protocolo inspirado no AnkiWeb — last-write-wins com soft deletes
 */

export interface SyncRequestDTO {
  lastSyncAt: string | null; // ISO 8601 — null para primeiro sync
  changes: SyncChange[];
}

export interface SyncChange {
  entity: 'deck' | 'card' | 'reviewLog';
  action: 'create' | 'update' | 'delete';
  id?: number;               // ID do servidor (null para creates)
  clientId?: string;          // UUID gerado no client (para creates)
  data: Record<string, unknown>;
  updatedAt: string;          // ISO 8601 — timestamp da mudança no client
}

export interface SyncResponseDTO {
  applied: SyncAppliedResult[];        // Resultado de cada change do client
  serverChanges: SyncServerChange[];   // Mudanças do servidor que o client precisa
  newSyncAt: string;                   // Novo checkpoint de sync
  conflicts: SyncConflict[];           // Conflitos detectados
}

export interface SyncAppliedResult {
  clientId?: string;
  entity: string;
  action: string;
  serverId: number;
  status: 'applied' | 'conflict' | 'skipped';
}

export interface SyncServerChange {
  entity: 'deck' | 'card' | 'reviewLog';
  action: 'create' | 'update' | 'delete';
  id: number;
  data: Record<string, unknown>;
  updatedAt: string;
}

export interface SyncConflict {
  entity: string;
  id: number;
  clientId?: string;
  reason: string;
  resolution: 'server_wins' | 'client_wins';
  serverData: Record<string, unknown>;
}
