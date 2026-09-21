import { GameDate, AuditLogEntry } from './common';
import { UniverseState } from './universe';
import { CompanyState } from './company';
import { TradeOrder } from './trade';
import { GameEvent } from './events';
import { GameMission } from './missions';
export interface GameSave {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  date: GameDate;
  company: CompanyState;
  universe: UniverseState;
  tradeOrders: TradeOrder[];
  missions: GameMission[];
  events?: GameEvent[];
  auditLog: AuditLogEntry[];
}

export interface GameSummary {
  id: string;
  name: string;
  companyName: string;
  reputation: number;
  treasury: number;
  date: GameDate;
  exploredPlanetsCount: number;
  exploredSectorsCount: number;
  employeesCount: number;
  updatedAt: string;
}
