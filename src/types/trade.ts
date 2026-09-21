export type ProductCode = 
  | 'INDU' 
  | 'BASI' 
  | 'ALIM' 
  | 'MADE' 
  | 'AGUA' 
  | 'MICO' 
  | 'MIRA' 
  | 'MIPR' 
  | 'PAVA' 
  | 'A' 
  | 'AE' 
  | 'AEI' 
  | 'COM';

export interface ProductDefinition {
  code: ProductCode;
  name: string;
  baseBuyPrice: number;
  baseSellPrice: number;
  daysToProduce: number;
  daysToDemand: number;
}
export const MAX_ORDERS_PER_AREA = 25;

export interface TradeOrder {
  id: string;
  areaId: number;
  productCode: ProductCode;
  productName: string;
  ucnAmount: number;
  buyPricePerUcn: number;
  totalBuyCost: number;
  buyPlanetCode: number;
  buyDate: string; // ISO o texto descriptivo
  buyGameDate?: { year: number; month: number; day: number };
  isSold: boolean;
  sellPlanetCode?: number;
  sellPricePerUcn?: number;
  totalSellRevenue?: number;
  sellDate?: string;
  sellGameDate?: { year: number; month: number; day: number };
  profit?: number; // Ganancia (+) o pérdida (-)
  hasConvenioTraceability: boolean; // Trazabilidad Convenio Spacegom
  orderRowNumber?: number; // Fila 1-25 del registro del área
  isContrabandCleaned?: boolean;
}

export interface NegotiatedProduct {
  productCode: ProductCode;
  productName: string;
  basePrice: number;
  negotiatedPrice: number;
  factor: number; // 0.8, 1.0, 1.2
  maxUcnAvailable: number;
  isAvailable: boolean;
  cooldownRemainingDays?: number;
}

export interface CargoHandlingResult {
  totalUcn: number;
  daysRequired: number;
  operariosCount: number;
  dailyCapacity: number;
  operarioRolls: Array<{
    operarioId: number;
    operarioName: string;
    rollSum: number;
    ucnPerDay: number;
  }>;
  logNotes: string[];
}
export interface SpecialMission {
  id: string;
  code: string;
  type: string;
  originPlanetCode: number;
  targetPlanetCode?: number;
  deadlineDays: number;
  maxDate: string;
  rewardSC: number;
  minReputation: number;
  requiredPersonnel: string;
  bookPage: number;
  status: 'activa' | 'completada' | 'fallida';
  notes: string;
}

export interface PassengerTransportResult {
  passengersCount: number;
  farePerPassenger: number;
  totalIncome: number;
  logNotes: string[];
}
