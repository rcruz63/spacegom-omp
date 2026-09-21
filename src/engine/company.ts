import personnelJson from '../data/personnel_roster.json';
import { CompanyState, Employee, Spaceship, LifeSupportInventory } from '../types/company';
import { ExperienceLevel, MoraleLevel } from '../types/common';

export interface PersonnelRosterEntry {
  id: number;
  game_id: number;
  position: string;
  name: string;
  monthly_salary: number;
  experience: string;
  morale: string;
  hire_date: string;
  is_active: number;
  notes: string | null;
}

export const PERSONNEL_ROSTER: PersonnelRosterEntry[] = personnelJson as unknown as PersonnelRosterEntry[];

export function getExperienceModifier(exp: ExperienceLevel): number {
  if (exp === 'novato') return -1;
  if (exp === 'veterano') return 1;
  return 0;
}

export function getMoraleModifier(mor: MoraleLevel): number {
  if (mor === 'baja') return -1;
  if (mor === 'alta') return 1;
  return 0;
}

export function calculateEmployeeDiceModifier(employee: Employee): number {
  return getExperienceModifier(employee.experience) + getMoraleModifier(employee.morale);
}

export function updateEmployeeAfterRoll(
  employee: Employee,
  totalWithMods: number,
  isDoubleSix: boolean
): { updatedEmployee: Employee; moraleChanged: boolean; expChanged: boolean; logNotes: string[] } {
  let morale = employee.morale;
  let experience = employee.experience;
  let moraleChanged = false;
  let expChanged = false;
  const logNotes: string[] = [];

  // Subir moral con 10 o más
  if (totalWithMods >= 10 && morale !== 'alta') {
    morale = morale === 'baja' ? 'media' : 'alta';
    moraleChanged = true;
    logNotes.push(`${employee.name} subió moral a ${morale.toUpperCase()}`);
  }

  // Bajar moral con 4 o menos
  if (totalWithMods <= 4 && morale !== 'baja') {
    morale = morale === 'alta' ? 'media' : 'baja';
    moraleChanged = true;
    logNotes.push(`${employee.name} bajó moral a ${morale.toUpperCase()}`);
  }

  // Subir experiencia con doble 6
  if (isDoubleSix && experience !== 'veterano') {
    experience = experience === 'novato' ? 'estandar' : 'veterano';
    expChanged = true;
    logNotes.push(`${employee.name} subió experiencia a ${experience.toUpperCase()}`);
  }

  return {
    updatedEmployee: {
      ...employee,
      morale,
      experience
    },
    moraleChanged,
    expChanged,
    logNotes
  };
}

export interface InitialCompanyOptions {
  name?: string;
  shipName?: string;
  difficulty?: 'facil' | 'normal' | 'dificil';
  initialTreasury?: number;
  customCrew?: Employee[];
  crewNames?: string[];
}

export const INITIAL_CREW_ROSTER_TEMPLATE = [
  { position: 'Director gerente', monthlySalary: 20, experience: 'veterano' as ExperienceLevel, morale: 'alta' as MoraleLevel, defaultName: 'Widaker Farq' },
  { position: 'Comandante de hipersaltos', monthlySalary: 15, experience: 'veterano' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Samantha Warm' },
  { position: 'Ingeniero computacional', monthlySalary: 4, experience: 'novato' as ExperienceLevel, morale: 'baja' as MoraleLevel, defaultName: 'Thomas Muller' },
  { position: 'Ingeniero de astronavegación', monthlySalary: 8, experience: 'estandar' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Walter Lopez' },
  { position: 'Técnico de repostaje y análisis', monthlySalary: 8, experience: 'estandar' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Jeffrey Cook' },
  { position: 'Piloto', monthlySalary: 10, experience: 'veterano' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Danielle Rivers' },
  { position: 'Operario de logística y almacén', monthlySalary: 1, experience: 'estandar' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Isaac Peterson' },
  { position: 'Contabilidad y burocracia', monthlySalary: 3, experience: 'estandar' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Katherine Smith' },
  { position: 'Suministros de mantenimiento', monthlySalary: 3, experience: 'estandar' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Jason Wilson' },
  { position: 'Cocinero', monthlySalary: 3, experience: 'estandar' as ExperienceLevel, morale: 'alta' as MoraleLevel, defaultName: 'Sam Hernández' },
  { position: 'Asistente doméstico', monthlySalary: 1, experience: 'novato' as ExperienceLevel, morale: 'media' as MoraleLevel, defaultName: 'Alexandra Adams' }
];

export function generateInitialCrew(crewNames?: string[]): Employee[] {
  return INITIAL_CREW_ROSTER_TEMPLATE.map((template, index) => {
    const name = crewNames && crewNames[index] ? crewNames[index] : template.defaultName;
    return {
      id: index + 1,
      position: template.position,
      name,
      monthlySalary: template.monthlySalary,
      experience: template.experience,
      morale: template.morale,
      isActive: true
    };
  });
}

export function getDifficultyTreasury(difficulty: 'facil' | 'normal' | 'dificil'): number {
  switch (difficulty) {
    case 'facil': return 600;
    case 'normal': return 500;
    case 'dificil': return 400;
    default: return 500;
  }
}

export function createInitialCompany(
  nameOrOptions: string | InitialCompanyOptions = 'Starblack',
  difficultyArg: 'facil' | 'normal' | 'dificil' = 'normal'
): CompanyState {
  const options: InitialCompanyOptions = typeof nameOrOptions === 'object'
    ? nameOrOptions
    : { name: nameOrOptions, difficulty: difficultyArg };

  const companyName = options.name || 'Starblack';
  const shipName = options.shipName || 'Astronave I';
  const difficulty = options.difficulty || 'normal';
  const initialTreasury = options.initialTreasury ?? getDifficultyTreasury(difficulty);

  const initialShip: Spaceship = {
    name: shipName,
    model: 'Transporte Ligero Clase A',
    hyperspaceRange: 10,
    fuelCurrent: 20,
    fuelMax: 30,
    warehouseMax: 40,
    warehouseOccupied: 0,
    passengersMax: 10,
    passengersCurrent: 0,
    damageLight: 0,
    damageModerate: 0,
    damageHeavy: 0,
    diceModifier: 0
  };

  const initialLifeSupport: LifeSupportInventory = {
    standardSuit: 1,
    filterRespirator: 2,
    respirator: 3,
    filterMask: 5,
    basicOxygen: 7,
    advancedSuit: 0,
    hyperAdvancedSuit: 0
  };

  const defaultCrew: Employee[] = options.customCrew || generateInitialCrew(options.crewNames);

  return {
    name: companyName,
    reputation: 0,
    treasury: initialTreasury,
    employees: defaultCrew,
    ship: initialShip,
    loans: [],
    totalLoansTaken: 0,
    lifeSupport: initialLifeSupport,
    healthLevel: 'excelente',
    weapons: []
  };
}

export function getTotalMonthlySalaries(employees: Employee[]): number {
  return employees.filter(e => e.isActive).reduce((sum, e) => sum + e.monthlySalary, 0);
}

export function applyShipDamage(ship: Spaceship, level: 'leve' | 'moderado' | 'grave'): Spaceship {
  let { damageLight, damageModerate, damageHeavy } = ship;

  if (level === 'leve') {
    damageLight += 1;
    if (damageLight >= 3) {
      damageLight = 0;
      damageModerate += 1;
    }
  } else if (level === 'moderado') {
    damageModerate += 1;
  } else if (level === 'grave') {
    damageHeavy += 1;
  }

  if (damageModerate >= 2) {
    damageModerate = 0;
    damageHeavy += 1;
  }

  // Modificador a tiradas de navegación según daños
  let diceModifier = 0;
  if (damageModerate > 0) diceModifier -= 1;
  if (damageHeavy > 0) diceModifier -= 2;

  return {
    ...ship,
    damageLight,
    damageModerate,
    damageHeavy,
    diceModifier
  };
}

export function hireEmployee(
  company: CompanyState,
  newEmployee: Omit<Employee, 'id' | 'isActive'>
): CompanyState {
  const maxId = company.employees.reduce((max, e) => Math.max(max, e.id), 0);
  const employee: Employee = {
    ...newEmployee,
    id: maxId + 1,
    isActive: true
  };

  return {
    ...company,
    employees: [...company.employees, employee]
  };
}

export function fireEmployee(
  company: CompanyState,
  employeeId: number,
  paySeverance: boolean
): { nextCompany: CompanyState; logNotes: string[] } {
  const target = company.employees.find(e => e.id === employeeId);
  if (!target) throw new Error('Empleado no encontrado');

  const logNotes: string[] = [];
  let treasury = company.treasury;
  let reputation = company.reputation;
  let updatedEmployees = company.employees.filter(e => e.id !== employeeId);

  if (paySeverance) {
    const severanceCost = target.monthlySalary * 5; // mes actual + 4 adicionales
    treasury -= severanceCost;
    logNotes.push(`Despido indemnizado de ${target.name}. Coste: ${severanceCost} SC.`);
  } else {
    reputation = Math.max(0, reputation - 1);
    updatedEmployees = updatedEmployees.map(e => ({
      ...e,
      morale: e.morale === 'alta' ? 'media' : 'baja'
    }));
    logNotes.push(`Despido no indemnizado de ${target.name}. Reputación -1 y moral general reducida.`);
  }

  return {
    nextCompany: {
      ...company,
      treasury,
      reputation,
      employees: updatedEmployees
    },
    logNotes
  };
}
