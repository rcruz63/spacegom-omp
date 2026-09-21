import { ExperienceLevel, GameDate } from './common';

export interface DirectorTask {
  id: string;
  positionKey: string;
  experience: ExperienceLevel;
  candidateName: string;
  searchDays: number;
  monthlySalary: number;
  hireThreshold: number;
  status: 'activa' | 'encolada';
  startDate: GameDate;
  targetDate: GameDate;
  createdAt: string;
}
