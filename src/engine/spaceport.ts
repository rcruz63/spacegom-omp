import { CompanyState } from '../types/company';
import { PlanetData } from '../types/universe';
import { rollDice } from './dice';
import { updateEmployeeAfterRoll, applyShipDamage } from './company';

/**
 * Capacidades de reparación del astillero según la calidad del espaciopuerto.
 *
 * Fuente: Manual de Operaciones, página 10:
 * - Rudimentario (RUD) o Sin espaciopuerto (SIN): Reparación no disponible.
 * - Básico (BAS): "Reparación limitada" -> Solo daños leves.
 * - Medio (MED): "Reparación normal" -> Daños leves y moderados.
 * - Notable (NOT) o Excelente (EXC): "Reparación avanzada" -> Daños leves, moderados y graves.
 */
export function getSpaceportRepairCapability(qualityRaw: string): {
  isAvailable: boolean;
  canRepairLight: boolean;
  canRepairModerate: boolean;
  canRepairHeavy: boolean;
  tierLabel: string;
} {
  const q = (qualityRaw || 'MED').toUpperCase().trim();

  if (q.includes('EXC') || q.includes('EXCELENTE') || q.includes('NOT') || q.includes('NOTABLE')) {
    return {
      isAvailable: true,
      canRepairLight: true,
      canRepairModerate: true,
      canRepairHeavy: true,
      tierLabel: 'Avanzada (Leves, Moderados y Graves)'
    };
  }

  if (q.includes('MED') || q.includes('MEDIO')) {
    return {
      isAvailable: true,
      canRepairLight: true,
      canRepairModerate: true,
      canRepairHeavy: false,
      tierLabel: 'Normal (Leves y Moderados)'
    };
  }

  if (q.includes('BAS') || q.includes('BÁSICO') || q.includes('BASICO')) {
    return {
      isAvailable: true,
      canRepairLight: true,
      canRepairModerate: false,
      canRepairHeavy: false,
      tierLabel: 'Limitada (Solo Daños Leves)'
    };
  }

  return {
    isAvailable: false,
    canRepairLight: false,
    canRepairModerate: false,
    canRepairHeavy: false,
    tierLabel: 'No disponible (Rudimentario o Inexistente)'
  };
}

export interface DockingParams {
  company: CompanyState;
  planet: PlanetData;
  pilotRollTotal: number;
  isDoubleSix?: boolean;
  damageSeverityRoll?: number; // 1D6 adicional en caso de fallo <= 6 (1-5 leve, 6 moderado)
}

export interface DockingResult {
  nextCompany: CompanyState;
  success: boolean;
  damageSuffered: 'ninguno' | 'leve' | 'moderado';
  dockingFee: number;
  pilotMoraleChanged: boolean;
  pilotExpChanged: boolean;
  logNotes: string[];
}

/**
 * Maniobra de amarre en espaciopuerto o aterrizaje en superficie.
 *
 * Fuente: Manual de Operaciones, página 10:
 * - El piloto lanza 2D6 + exp + moral + modif. nave.
 * - Resultado >= 7: Amarre o aterrizaje sin daños.
 * - Resultado <= 6: Se lanza 1D6:
 *     - 1 a 5: La astronave sufre 1 daño leve.
 *     - 6: La astronave sufre 1 daño moderado.
 * - Paga el coste de Amarre (docking_price) indicado en la ficha del planeta.
 */
export function dockAtSpaceport(params: DockingParams): DockingResult {
  const { company, planet, pilotRollTotal, isDoubleSix = false } = params;
  const logNotes: string[] = [];

  const dockingFee = planet.docking_price || 0;
  if (company.treasury < dockingFee) {
    throw new Error(`Tesorería insuficiente para pagar la tasa de amarre (${dockingFee} SC necesarios, saldo: ${company.treasury} SC).`);
  }

  const pilot = company.employees.find(
    e => e.isActive && e.position.toLowerCase().includes('piloto')
  );

  let pilotMoraleChanged = false;
  let pilotExpChanged = false;
  let updatedEmployees = [...company.employees];

  if (pilot) {
    const res = updateEmployeeAfterRoll(pilot, pilotRollTotal, isDoubleSix);
    pilotMoraleChanged = res.moraleChanged;
    pilotExpChanged = res.expChanged;
    logNotes.push(...res.logNotes);

    updatedEmployees = updatedEmployees.map(e => e.id === pilot.id ? res.updatedEmployee : e);
  }

  let updatedShip = { ...company.ship };
  let damageSuffered: 'ninguno' | 'leve' | 'moderado' = 'ninguno';

  const success = pilotRollTotal >= 7;

  if (success) {
    logNotes.push(`Maniobra de amarre exitosa en ${planet.name} (Tirada: ${pilotRollTotal} >= 7). Sin daños.`);
  } else {
    // Tirada 1D6 para determinar severidad del daño
    const severityRoll = params.damageSeverityRoll !== undefined 
      ? params.damageSeverityRoll 
      : rollDice({ diceCount: 1 }).rolls[0];

    if (severityRoll === 6) {
      damageSuffered = 'moderado';
      updatedShip = applyShipDamage(updatedShip, 'moderado');
      logNotes.push(`Fallo en maniobra de amarre (Tirada: ${pilotRollTotal} <= 6). Severidad ${severityRoll}: la nave sufre 1 DAÑO MODERADO.`);
    } else {
      damageSuffered = 'leve';
      updatedShip = applyShipDamage(updatedShip, 'leve');
      logNotes.push(`Fallo en maniobra de amarre (Tirada: ${pilotRollTotal} <= 6). Severidad ${severityRoll}: la nave sufre 1 DAÑO LEVE.`);
    }
  }

  logNotes.push(`Abonada tasa de amarre del espaciopuerto: -${dockingFee} SC.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury - dockingFee,
      ship: updatedShip,
      employees: updatedEmployees
    },
    success,
    damageSuffered,
    dockingFee,
    pilotMoraleChanged,
    pilotExpChanged,
    logNotes
  };
}

export interface RefuelParams {
  company: CompanyState;
  planet: PlanetData;
  unitsToRefuel: number;
  techRollTotal?: number;
  techIsDoubleSix?: boolean;
}

export interface RefuelResult {
  nextCompany: CompanyState;
  unitsRefueled: number;
  fuelCost: number;
  dockDailyCost: number;
  totalCost: number;
  daysTaken: number;
  damageSuffered: 'ninguno' | 'leve';
  techMoraleChanged: boolean;
  techExpChanged: boolean;
  logNotes: string[];
}

/**
 * Repostaje reglamentario de combustible en el espaciopuerto.
 *
 * Fuente: Manual de Operaciones, página 10:
 * - Coste de combustible: 3 SC por cada unidad.
 * - Tiempo según densidad de combustible:
 *     - Baja (DB): 1 unidad / día.
 *     - Media (DM): 5 unidades / día.
 *     - Alta (DA): 10 unidades / día.
 * - Coste de ocupación del muelle: 1 SC por cada día transcurrido.
 * - Control técnico: El Técnico de repostaje lanza 2D6 + exp + moral:
 *     - >= 7: Repostaje limpio sin daños.
 *     - <= 6: Combustible impuro/fallo técnico -> la astronave sufre 1 daño leve.
 */
export function refuelShip(
  companyOrParams: CompanyState | RefuelParams,
  legacyPlanet?: PlanetData,
  legacyUnits?: number
): RefuelResult {
  let company: CompanyState;
  let planet: PlanetData;
  let unitsToRefuel: number;
  let techRollTotal: number | undefined;
  let techIsDoubleSix = false;

  if ('company' in companyOrParams) {
    company = companyOrParams.company;
    planet = companyOrParams.planet;
    unitsToRefuel = companyOrParams.unitsToRefuel;
    techRollTotal = companyOrParams.techRollTotal;
    techIsDoubleSix = companyOrParams.techIsDoubleSix || false;
  } else {
    company = companyOrParams;
    planet = legacyPlanet!;
    unitsToRefuel = legacyUnits!;
  }

  const logNotes: string[] = [];
  const needed = Math.min(unitsToRefuel, company.ship.fuelMax - company.ship.fuelCurrent);
  if (needed <= 0) {
    throw new Error('El depósito de combustible ya se encuentra al máximo de capacidad.');
  }

  // 1. Coste del combustible: 3 SC por unidad
  const fuelCost = needed * 3;

  // 2. Velocidad de bombeo según densidad del combustible local
  const density = (planet.fuel_density || 'DM').toUpperCase().trim();
  let unitsPerDay = 5;
  if (density.includes('DA') || density.includes('ALTA')) unitsPerDay = 10;
  if (density.includes('DB') || density.includes('BAJA')) unitsPerDay = 1;

  const daysTaken = Math.max(1, Math.ceil(needed / unitsPerDay));

  // 3. Tasa de ocupación: 1 SC por día de amarre para repostar
  const dockDailyCost = daysTaken * 1;
  const totalCost = fuelCost + dockDailyCost;

  if (company.treasury < totalCost) {
    throw new Error(`Tesorería insuficiente para repostar (${totalCost} SC requeridos, saldo: ${company.treasury} SC).`);
  }

  // 4. Control de calidad del Técnico de repostaje
  const fuelTech = company.employees.find(
    e => e.isActive && e.position.toLowerCase().includes('repostaje')
  );

  let updatedEmployees = [...company.employees];
  let techMoraleChanged = false;
  let techExpChanged = false;
  let updatedShip = { ...company.ship, fuelCurrent: company.ship.fuelCurrent + needed };
  let damageSuffered: 'ninguno' | 'leve' = 'ninguno';

  // Si no se proporcionó tirada técnica previa, se genera
  const rollToUse = techRollTotal !== undefined ? techRollTotal : (fuelTech ? 8 : 7);

  if (fuelTech) {
    const res = updateEmployeeAfterRoll(fuelTech, rollToUse, techIsDoubleSix);
    techMoraleChanged = res.moraleChanged;
    techExpChanged = res.expChanged;
    logNotes.push(...res.logNotes);

    updatedEmployees = updatedEmployees.map(e => e.id === fuelTech.id ? res.updatedEmployee : e);
  }

  if (rollToUse < 7) {
    damageSuffered = 'leve';
    updatedShip = applyShipDamage(updatedShip, 'leve');
    logNotes.push(`Análisis deficiente de combustible (Tirada ${rollToUse} < 7): impurezas detectadas, la nave sufre 1 DAÑO LEVE.`);
  } else {
    logNotes.push(`Control de combustible óptimo superado con éxito (Tirada ${rollToUse} >= 7).`);
  }

  logNotes.push(
    `Repostadas ${needed} unidades de combustible (${density}) en ${daysTaken} días. Coste: ${fuelCost} SC (combustible) + ${dockDailyCost} SC (ocupación) = ${totalCost} SC.`
  );

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury - totalCost,
      ship: updatedShip,
      employees: updatedEmployees
    },
    unitsRefueled: needed,
    fuelCost,
    dockDailyCost,
    totalCost,
    daysTaken,
    damageSuffered,
    techMoraleChanged,
    techExpChanged,
    logNotes
  };
}

export interface RepairParams {
  company: CompanyState;
  planet: PlanetData;
  damageType: 'leve' | 'moderado' | 'grave';
  mechanicRollTotal?: number;
  mechanicIsDoubleSix?: boolean;
  randomDaysRoll?: number; // 1D6 para moderado, 2D6 para grave
}

export interface RepairResult {
  nextCompany: CompanyState;
  damageTypeRepaired: 'leve' | 'moderado' | 'grave';
  cost: number;
  daysTaken: number;
  technicianOptimized: boolean;
  techMoraleChanged: boolean;
  techExpChanged: boolean;
  logNotes: string[];
}

/**
 * Reparación reglamentaria de la astronave en el astillero del espaciopuerto.
 *
 * Fuente: Manual de Operaciones, página 10:
 * - Calidad del espaciopuerto:
 *     - Rudimentario/Sin espaciopuerto: no disponible.
 *     - Básico: solo daños leves.
 *     - Medio: daños leves y moderados.
 *     - Notable/Excelente: leves, moderados y graves.
 * - Costes y tiempos base:
 *     - Leve: 5 SC, 1 día.
 *     - Moderado: 20 SC, 1D6 días.
 *     - Grave: 50 SC, 2D6 días.
 * - Técnico de mantenimiento: lanza 2D6 + exp + moral:
 *     - >= 7: Disminuye a la mitad coste y tiempo (redondeo alza, mín 1 día).
 *     - <= 6: Coste y tiempo íntegros.
 */
export function repairShip(
  companyOrParams: CompanyState | RepairParams,
  legacyDamageType?: 'leve' | 'moderado' | 'grave',
  legacyRoll?: number
): RepairResult {
  let company: CompanyState;
  let planet: PlanetData | null = null;
  let damageType: 'leve' | 'moderado' | 'grave';
  let mechanicRollTotal = 7;
  let mechanicIsDoubleSix = false;
  let randomDaysRoll: number | undefined;

  if ('company' in companyOrParams) {
    company = companyOrParams.company;
    planet = companyOrParams.planet;
    damageType = companyOrParams.damageType;
    mechanicRollTotal = companyOrParams.mechanicRollTotal ?? 7;
    mechanicIsDoubleSix = companyOrParams.mechanicIsDoubleSix || false;
    randomDaysRoll = companyOrParams.randomDaysRoll;
  } else {
    company = companyOrParams;
    damageType = legacyDamageType!;
    mechanicRollTotal = legacyRoll ?? 7;
  }

  const logNotes: string[] = [];

  // 1. Validar que la nave tenga daños de ese tipo
  const { damageLight, damageModerate, damageHeavy } = company.ship;
  if (damageType === 'leve' && damageLight <= 0) {
    throw new Error('La nave no tiene daños leves pendientes de reparar.');
  }
  if (damageType === 'moderado' && damageModerate <= 0) {
    throw new Error('La nave no tiene daños moderados pendientes de reparar.');
  }
  if (damageType === 'grave' && damageHeavy <= 0) {
    throw new Error('La nave no tiene daños graves pendientes de reparar.');
  }

  // 2. Validar capacidad del astillero según la calidad del espaciopuerto
  if (planet) {
    const cap = getSpaceportRepairCapability(planet.spaceport_quality);
    if (!cap.isAvailable) {
      throw new Error(`Astillero no disponible en ${planet.name} (${cap.tierLabel}).`);
    }
    if (damageType === 'moderado' && !cap.canRepairModerate) {
      throw new Error(`El espaciopuerto de ${planet.name} solo admite reparación limitada (daños leves).`);
    }
    if (damageType === 'grave' && !cap.canRepairHeavy) {
      throw new Error(`El espaciopuerto de ${planet.name} no cuenta con astillero avanzado para daños graves.`);
    }
  }

  // 3. Tiempos y costes base
  let baseCost = 5;
  let baseDays = 1;

  if (damageType === 'moderado') {
    baseCost = 20;
    baseDays = randomDaysRoll !== undefined ? randomDaysRoll : rollDice({ diceCount: 1 }).rolls[0];
  } else if (damageType === 'grave') {
    baseCost = 50;
    baseDays = randomDaysRoll !== undefined ? randomDaysRoll : rollDice({ diceCount: 2 }).sum;
  }

  // 4. Intervención del Técnico de Mantenimiento de Astronaves
  const mechanic = company.employees.find(
    e => e.isActive && e.position.toLowerCase().includes('mantenimiento')
  );

  let updatedEmployees = [...company.employees];
  let techMoraleChanged = false;
  let techExpChanged = false;

  if (mechanic) {
    const res = updateEmployeeAfterRoll(mechanic, mechanicRollTotal, mechanicIsDoubleSix);
    techMoraleChanged = res.moraleChanged;
    techExpChanged = res.expChanged;
    logNotes.push(...res.logNotes);

    updatedEmployees = updatedEmployees.map(e => e.id === mechanic.id ? res.updatedEmployee : e);
  }

  const technicianOptimized = mechanicRollTotal >= 7;
  let cost = baseCost;
  let daysTaken = baseDays;

  if (technicianOptimized) {
    cost = Math.ceil(baseCost / 2);
    daysTaken = Math.max(1, Math.ceil(baseDays / 2));
    logNotes.push(
      `Técnico de mantenimiento optimizó los trabajos (Tirada: ${mechanicRollTotal} >= 7): Coste reducido al 50% (${cost} SC) y tiempo a la mitad (${daysTaken}d).`
    );
  } else {
    logNotes.push(
      `Reparación realizada a tarifa y tiempo completos de astillero (Tirada técnico: ${mechanicRollTotal} <= 6).`
    );
  }

  if (company.treasury < cost) {
    throw new Error(`Tesorería insuficiente para costear la reparación (${cost} SC necesarios, saldo: ${company.treasury} SC).`);
  }

  // 5. Aplicar reparación al casco
  let nextLight = damageLight;
  let nextMod = damageModerate;
  let nextHeavy = damageHeavy;

  if (damageType === 'leve') nextLight--;
  else if (damageType === 'moderado') nextMod--;
  else if (damageType === 'grave') nextHeavy--;

  logNotes.push(`Reparado con éxito 1 daño ${damageType.toUpperCase()} en ${daysTaken} días por ${cost} SC.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury - cost,
      ship: {
        ...company.ship,
        damageLight: nextLight,
        damageModerate: nextMod,
        damageHeavy: nextHeavy
      },
      employees: updatedEmployees
    },
    damageTypeRepaired: damageType,
    cost,
    daysTaken,
    technicianOptimized,
    techMoraleChanged,
    techExpChanged,
    logNotes
  };
}
