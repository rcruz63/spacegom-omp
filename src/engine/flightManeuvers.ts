import { CompanyState } from '../types/company';
import { UniverseState, PlanetData } from '../types/universe';
import { rollDice } from './dice';
import { updateEmployeeAfterRoll, applyShipDamage } from './company';
import { disembarkPassengers } from './navigation';

export type ManeuverType = 'aterrizaje' | 'amarre_orbital' | 'transito_hiperdisparo';

export interface PilotManeuverResult {
  nextCompany: CompanyState;
  success: boolean;
  damageSuffered: 'ninguno' | 'leve' | 'moderado';
  pilotMoraleChanged: boolean;
  pilotExpChanged: boolean;
  logNotes: string[];
}

/**
 * Ejecuta una tirada de maniobra de vuelo para el Piloto.
 *
 * Fuente: Manual de Operaciones, página 10 y página 13:
 * - Tirada: 2D6 + Experiencia + Moral + Modificador de la astronave.
 * - Resultado >= 7: Maniobra perfecta sin daños estructurales.
 * - Resultado <= 6: Fallo en la maniobra. Tirada de 1D6:
 *     - 1 a 5: La astronave sufre 1 daño leve.
 *     - 6: La astronave sufre 1 daño moderado.
 * - Aplica reglas de moral (>= 10 sube, <= 4 baja) y experiencia (doble 6 sube).
 */
export function executePilotManeuver(
  company: CompanyState,
  pilotRollTotal: number,
  isDoubleSix = false,
  severityRoll?: number,
  actionName = 'Maniobra de vuelo'
): PilotManeuverResult {
  const logNotes: string[] = [];

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
    logNotes.push(`${actionName} superada con éxito (Tirada: ${pilotRollTotal} >= 7). Maniobra limpia sin daños.`);
  } else {
    const sev = severityRoll !== undefined ? severityRoll : rollDice({ diceCount: 1 }).rolls[0];
    if (sev === 6) {
      damageSuffered = 'moderado';
      updatedShip = applyShipDamage(updatedShip, 'moderado');
      logNotes.push(`Fallo en ${actionName} (Tirada: ${pilotRollTotal} <= 6). Severidad ${sev}: la nave sufre 1 DAÑO MODERADO.`);
    } else {
      damageSuffered = 'leve';
      updatedShip = applyShipDamage(updatedShip, 'leve');
      logNotes.push(`Fallo en ${actionName} (Tirada: ${pilotRollTotal} <= 6). Severidad ${sev}: la nave sufre 1 DAÑO LEVE.`);
    }
  }

  return {
    nextCompany: {
      ...company,
      ship: updatedShip,
      employees: updatedEmployees
    },
    success,
    damageSuffered,
    pilotMoraleChanged,
    pilotExpChanged,
    logNotes
  };
}

export interface LandingManeuverResult {
  nextCompany: CompanyState;
  nextUniverse: UniverseState;
  success: boolean;
  damageSuffered: 'ninguno' | 'leve' | 'moderado';
  disembarkedCount: number;
  logNotes: string[];
}

/**
 * Desciende y aterriza en la superficie del MUNDO.
 * Ejecuta tirada del piloto y desembarca pasajeros automáticamente si los hubiera.
 */
export function executeLandingManeuver(
  company: CompanyState,
  universe: UniverseState,
  planet: PlanetData,
  pilotRollTotal: number,
  isDoubleSix = false,
  severityRoll?: number
): LandingManeuverResult {
  const maneuver = executePilotManeuver(
    company,
    pilotRollTotal,
    isDoubleSix,
    severityRoll,
    `Aterrizaje en ${planet.name}`
  );

  let nextComp = maneuver.nextCompany;
  const logNotes = [...maneuver.logNotes];

  // Desembarco de pasajeros
  const dis = disembarkPassengers(nextComp);
  nextComp = dis.nextCompany;
  if (dis.disembarkedCount > 0) {
    logNotes.push(`Llegada a superficie de ${planet.name}: Desembarcan ${dis.disembarkedCount} pasajeros del camarote.`);
  }

  const nextUniverse: UniverseState = {
    ...universe,
    currentLocation: 'mundo'
  };

  return {
    nextCompany: nextComp,
    nextUniverse,
    success: maneuver.success,
    damageSuffered: maneuver.damageSuffered,
    disembarkedCount: dis.disembarkedCount,
    logNotes
  };
}

export interface OrbitalDockingResult {
  nextCompany: CompanyState;
  nextUniverse: UniverseState;
  success: boolean;
  damageSuffered: 'ninguno' | 'leve' | 'moderado';
  logNotes: string[];
}

/**
 * Efectúa maniobra de amarre en las Instalaciones Orbitales del planeta.
 */
export function executeOrbitalDockingManeuver(
  company: CompanyState,
  universe: UniverseState,
  planet: PlanetData,
  pilotRollTotal: number,
  isDoubleSix = false,
  severityRoll?: number
): OrbitalDockingResult {
  const maneuver = executePilotManeuver(
    company,
    pilotRollTotal,
    isDoubleSix,
    severityRoll,
    `Amarre orbital en ${planet.name}`
  );

  const nextUniverse: UniverseState = {
    ...universe,
    currentLocation: 'instalacion_orbital'
  };

  return {
    nextCompany: maneuver.nextCompany,
    nextUniverse,
    success: maneuver.success,
    damageSuffered: maneuver.damageSuffered,
    logNotes: maneuver.logNotes
  };
}

export interface TransitHyperspaceResult {
  nextCompany: CompanyState;
  nextUniverse: UniverseState;
  daysTaken: number;
  fuelConsumed: number;
  logNotes: string[];
}

/**
 * Viaja desde el planeta / espaciopuerto hasta la Estación de Hiperdisparo.
 *
 * Fuente: Manual de Operaciones, página 3:
 * - Días: Columna *5 del planeta (days_to_hyperspace).
 * - Combustible: Resta 1 de combustible por cada 5 días transcurridos al alza (Math.ceil(dias / 5)).
 */
export function executeTransitToHyperspace(
  company: CompanyState,
  universe: UniverseState,
  planet: PlanetData
): TransitHyperspaceResult {
  const logNotes: string[] = [];
  const daysTaken = planet.days_to_hyperspace || 5;
  const fuelNeeded = Math.max(1, Math.ceil(daysTaken / 5));

  if (company.ship.fuelCurrent < fuelNeeded) {
    throw new Error(
      `Combustible insuficiente para transitar hasta la Estación de Hiperdisparo (${fuelNeeded} U requeridas, disponibles: ${company.ship.fuelCurrent} U).`
    );
  }

  logNotes.push(
    `Tránsito sublumínico a Estación de Hiperdisparo desde ${planet.name}: ${daysTaken} días transcurridos, -${fuelNeeded} U de combustible.`
  );

  const nextCompany: CompanyState = {
    ...company,
    ship: {
      ...company.ship,
      fuelCurrent: company.ship.fuelCurrent - fuelNeeded
    }
  };

  const nextUniverse: UniverseState = {
    ...universe,
    currentLocation: 'estacion_hiperdisparo'
  };

  return {
    nextCompany,
    nextUniverse,
    daysTaken,
    fuelConsumed: fuelNeeded,
    logNotes
  };
}
