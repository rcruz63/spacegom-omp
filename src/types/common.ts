export type ExperienceLevel = 'novato' | 'estandar' | 'veterano';
export type MoraleLevel = 'baja' | 'media' | 'alta';

export type ShipLocation = 
  | 'mundo' 
  | 'espaciopuerto' 
  | 'instalacion_orbital' 
  | 'estacion_hiperdisparo' 
  | 'en_transito_hiperdisparo';

export type HealthLevel = 
  | 'excelente' 
  | 'buena' 
  | 'aceptable' 
  | 'deficiente' 
  | 'precaria' 
  | 'serio_riesgo' 
  | 'critica';

export interface GameDate {
  year: number;   // Inicia en 2880 (o año 1)
  month: number;  // 1 - 12
  day: number;    // 1 - 28 (o 35)
}

export interface DiceModifier {
  label: string;
  value: number;
}

export interface DiceRollResult {
  diceCount: number;
  sides: number;
  rolls: number[];
  sum: number;
  modifiers: DiceModifier[];
  total: number;
  isDoubleSix: boolean;
  isNaturalSnakeEyes: boolean;
  isManual: boolean;
  timestamp: string;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  gameDate: GameDate;
  category: 'dados' | 'calendario' | 'tesoreria' | 'nave' | 'tripulacion' | 'comercio' | 'misiones' | 'sistema';
  action: string;
  details: string;
  previousValue?: string | number;
  newValue?: string | number;
  rollDetails?: DiceRollResult;
  timestamp: string;
}
