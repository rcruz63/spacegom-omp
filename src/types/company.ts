import { ExperienceLevel, MoraleLevel, HealthLevel } from './common';

import { GameDate } from './common';

export interface Employee {
  id: number;
  name: string;
  position: string;
  monthlySalary: number;
  experience: ExperienceLevel;
  morale: MoraleLevel;
  weaponId?: string;
  isSick?: boolean;
  isActive: boolean;
  isBusy?: boolean;
  busyReason?: string;
  busyUntilDate?: GameDate;
}
export interface Spaceship {
  name: string;
  model: string;
  hyperspaceRange: number;
  fuelCurrent: number;
  fuelMax: number;
  warehouseMax: number;
  warehouseOccupied: number;
  passengersMax: number;
  passengersCurrent: number;
  damageLight: number;
  damageModerate: number;
  damageHeavy: number;
  diceModifier: number;
}

export interface BankLoan {
  id: number;
  amount: number;
  totalToRepay: number;
  paidInstallments: number;
  totalInstallments: number;
  monthlyPayment: number;
  grantYear: number;
  grantMonth: number;
}

export interface LifeSupportInventory {
  basicOxygen: number;
  filterMask: number;
  respirator: number;
  filterRespirator: number;
  standardSuit: number;
  advancedSuit: number;
  hyperAdvancedSuit: number;
}

export interface Weapon {
  id: string;
  type: string;
  ownerEmployeeId: number | null;
  effects: string;
}

export interface CompanyState {
  name: string;
  reputation: number;
  treasury: number;
  employees: Employee[];
  ship: Spaceship;
  loans: BankLoan[];
  totalLoansTaken: number;
  lifeSupport: LifeSupportInventory;
  healthLevel: HealthLevel;
  weapons: Weapon[];
  isBankrupt?: boolean;
}
