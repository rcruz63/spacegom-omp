import { CompanyState } from '../types/company';
import { PlanetData } from '../types/universe';

export interface RefuelResult {
  nextCompany: CompanyState;
  unitsRefueled: number;
  totalCost: number;
  daysTaken: number;
  logNotes: string[];
}

export function refuelShip(
  company: CompanyState,
  planet: PlanetData,
  unitsToRefuel: number
): RefuelResult {
  const logNotes: string[] = [];
  const needed = Math.min(unitsToRefuel, company.ship.fuelMax - company.ship.fuelCurrent);
  if (needed <= 0) {
    throw new Error('El depósito ya está lleno');
  }

  // Coste: 3 SC por espacio de combustible
  const fuelCost = needed * 3;

  // Densidad: Alta -> 10/día; Media -> 5/día; Baja -> 1/día
  const density = (planet.fuel_density || 'DM').toUpperCase();
  let unitsPerDay = 5;
  if (density === 'DA') unitsPerDay = 10;
  if (density === 'DB') unitsPerDay = 1;

  const daysTaken = Math.max(1, Math.ceil(needed / unitsPerDay));
  const dockDailyCost = daysTaken * 1; // 1 SC por día de ocupación
  const totalCost = fuelCost + dockDailyCost;

  if (company.treasury < totalCost) {
    throw new Error(`Tesorería insuficiente para repostar (${totalCost} SC necesarios)`);
  }

  logNotes.push(`Repostadas ${needed} unidades de combustible en ${daysTaken} días. Coste: ${totalCost} SC.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury - totalCost,
      ship: {
        ...company.ship,
        fuelCurrent: company.ship.fuelCurrent + needed
      }
    },
    unitsRefueled: needed,
    totalCost,
    daysTaken,
    logNotes
  };
}

export interface RepairResult {
  nextCompany: CompanyState;
  damageTypeRepaired: 'leve' | 'moderado' | 'grave';
  cost: number;
  daysTaken: number;
  logNotes: string[];
}

export function repairShip(
  company: CompanyState,
  damageType: 'leve' | 'moderado' | 'grave',
  mechanicRollTotal = 7
): RepairResult {
  const logNotes: string[] = [];
  let baseCost = 5;
  let baseDays = 1;

  if (damageType === 'moderado') {
    baseCost = 20;
    baseDays = 3;
  } else if (damageType === 'grave') {
    baseCost = 50;
    baseDays = 7;
  }

  // Si tirada de mecánico >= 7: reduce coste y tiempo a la mitad (redondeo alza, min 1 día)
  let cost = baseCost;
  let daysTaken = baseDays;
  if (mechanicRollTotal >= 7) {
    cost = Math.ceil(baseCost / 2);
    daysTaken = Math.max(1, Math.ceil(baseDays / 2));
    logNotes.push('Técnico de mantenimiento optimizó las reparaciones (coste y tiempo reducidos al 50%).');
  }

  if (company.treasury < cost) {
    throw new Error(`Tesorería insuficiente para reparar daños (${cost} SC necesarios)`);
  }

  let { damageLight, damageModerate, damageHeavy } = company.ship;
  if (damageType === 'leve' && damageLight > 0) damageLight--;
  else if (damageType === 'moderado' && damageModerate > 0) damageModerate--;
  else if (damageType === 'grave' && damageHeavy > 0) damageHeavy--;

  logNotes.push(`Reparado 1 daño ${damageType} en ${daysTaken} días por ${cost} SC.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury - cost,
      ship: {
        ...company.ship,
        damageLight,
        damageModerate,
        damageHeavy
      }
    },
    damageTypeRepaired: damageType,
    cost,
    daysTaken,
    logNotes
  };
}
