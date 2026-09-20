import { AuditLogEntry, GameDate } from '../types/common';

export interface AuditLogState {
  entries: AuditLogEntry[];
}

export function createAuditLog(): AuditLogState {
  return { entries: [] };
}

export function addLogEntry(
  state: AuditLogState,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): { nextState: AuditLogState; entry: AuditLogEntry } {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  return {
    nextState: {
      entries: [newEntry, ...state.entries]
    },
    entry: newEntry
  };
}

export function exportLogToText(entries: AuditLogEntry[]): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatDateStr = (d: GameDate) => `[Día ${pad(d.day)}/Mes ${pad(d.month)}/Año ${d.year}]`;

  return entries
    .slice()
    .reverse()
    .map(e => {
      let line = `${formatDateStr(e.gameDate)} [${e.category.toUpperCase()}] ${e.action}: ${e.details}`;
      if (e.previousValue !== undefined && e.newValue !== undefined) {
        line += ` (Anterior: ${e.previousValue} -> Nuevo: ${e.newValue})`;
      }
      if (e.rollDetails) {
        const r = e.rollDetails;
        line += ` | Dados: [${r.rolls.join(', ')}] Suma=${r.sum} Total=${r.total}${r.isManual ? ' (Manual)' : ''}`;
      }
      return line;
    })
    .join('\n');
}
