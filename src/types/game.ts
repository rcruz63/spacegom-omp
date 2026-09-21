import { GameDate, AuditLogEntry } from './common';
import { UniverseState } from './universe';
import { CompanyState } from './company';
import { TradeOrder, SpecialMission } from './trade';
import { GameEvent } from './events';
export interface GameSave {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  date: GameDate;
  company: CompanyState;
  universe: UniverseState;
  tradeOrders: TradeOrder[];
  missions: SpecialMission[];
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
