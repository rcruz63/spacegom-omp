import { GameDate } from './common';

export type GameEventType = 
  | 'hire_resolution'     // Búsqueda de personal finalizada
  | 'monthly_payday'      // Cierre del día 35
  | 'trade_cooldown'      // Cooldown de producto
  | 'custom_task';        // Tarea genérica programada

export interface GameEvent {
  id: string;
  type: GameEventType;
  title: string;
  description: string;
  targetDate: GameDate;
  assignedEmployeeId?: number;
  data?: Record<string, unknown>;
  createdAt: string;
}
