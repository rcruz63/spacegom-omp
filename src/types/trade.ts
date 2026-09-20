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

export interface TradeOrder {
  id: string;
  areaId: number;
  productCode: ProductCode;
  productName: string;
  ucnAmount: number;
  buyPricePerUcn: number;
  totalBuyCost: number;
  buyPlanetCode: number;
  buyDate: string;
  isSold: boolean;
  sellPlanetCode?: number;
  sellPricePerUcn?: number;
  totalSellRevenue?: number;
  sellDate?: string;
  isContrabandCleaned?: boolean;
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
