import { CompanyState } from '../types/company';
import { rollDice } from './dice';

export interface WeeklyAdminResult {
  nextCompany: CompanyState;
  logNotes: string[];
}

export interface MonthlyAdminResult {
  nextCompany: CompanyState;
  totalSalariesPaid: number;
  loansPaid: number;
  operatingCosts: number;
  maintenanceDamages: number;
  moraleChanges: string[];
  isBankrupt: boolean;
  logNotes: string[];
}

export function performWeeklyAdministration(company: CompanyState): WeeklyAdminResult {
  const logNotes: string[] = [];
  let treasury = company.treasury;

  const hasDirector = company.employees.some(e => e.isActive && e.position.toLowerCase().includes('director gerente'));
  const hasVice = company.employees.some(e => e.isActive && e.position.toLowerCase().includes('vicedirector'));

  if (hasDirector && hasVice) {
    logNotes.push('Gestión gerencial impecable (Director y Vicedirector presentes). Sin pérdidas.');
  } else if (hasDirector && !hasVice) {
    treasury -= 8;
    logNotes.push('Ineficiencias de gestión (-8 SC) por falta de Vicedirector.');
  } else if (!hasDirector && hasVice) {
    treasury -= 8;
    logNotes.push('Ineficiencias de gestión (-8 SC). El Vicedirector asume la dirección.');
  } else {
    treasury -= 25;
    logNotes.push('Ineficiencias graves de gestión (-25 SC) sin equipo directivo.');
  }

  return {
    nextCompany: {
      ...company,
      treasury
    },
    logNotes
  };
}

export function performMonthlyAdministration(company: CompanyState): MonthlyAdminResult {
  const logNotes: string[] = [];
  const moraleChanges: string[] = [];
  let treasury = company.treasury;
  let ship = { ...company.ship };
  let reputation = company.reputation;

  // 1. Salarios mensuales
  const activeEmployees = company.employees.filter(e => e.isActive);
  const totalSalariesPaid = activeEmployees.reduce((sum, e) => sum + e.monthlySalary, 0);
  treasury -= totalSalariesPaid;
  logNotes.push(`Pago de nóminas mensuales: -${totalSalariesPaid} SC a ${activeEmployees.length} empleados.`);

  // 2. Cuotas de préstamos
  let loansPaid = 0;
  const updatedLoans = company.loans.map(loan => {
    if (loan.paidInstallments < loan.totalInstallments) {
      loansPaid += loan.monthlyPayment;
      return {
        ...loan,
        paidInstallments: loan.paidInstallments + 1
      };
    }
    return loan;
  }).filter(loan => loan.paidInstallments < loan.totalInstallments);

  treasury -= loansPaid;
  if (loansPaid > 0) {
    logNotes.push(`Pago de cuotas de préstamos bancarios: -${loansPaid} SC.`);
  }

  // 3. Mantenimiento técnico de astronave
  const techMechanic = company.employees.find(e => e.isActive && e.position.toLowerCase().includes('mantenimiento de astronaves'));
  let maintenanceDamages = 0;
  if (techMechanic) {
    const roll = rollDice({ diceCount: 2 }).sum;
    if (roll < 7) {
      ship.damageLight += 1;
      maintenanceDamages += 1;
      logNotes.push('Mantenimiento técnico deficiente: la nave sufre 1 daño leve.');
    } else {
      logNotes.push('Mantenimiento técnico de astronave superado con éxito.');
    }
  } else {
    ship.damageModerate += 1;
    maintenanceDamages += 1;
    logNotes.push('Sin técnico de mantenimiento: la nave sufre 1 daño moderado automático.');
  }

  // 4. Gastos administrativos/burocráticos
  const hasAccountant = company.employees.some(e => e.isActive && e.position.toLowerCase().includes('contabilidad'));
  const operatingCosts = hasAccountant ? 4 : 20;
  treasury -= operatingCosts;
  logNotes.push(`Gastos operativos y burocráticos del mes: -${operatingCosts} SC.`);

  // 5. Gestión legal / abogado
  const hasLawyer = company.employees.some(e => e.isActive && e.position.toLowerCase().includes('abogado'));
  if (!hasLawyer) {
    reputation = Math.max(0, reputation - 1);
    logNotes.push('Sin abogado en plantilla: Reputación disminuye en 1 por litigios desatendidos.');
  }
  const isBankrupt = treasury < 0;
  if (isBankrupt) {
    logNotes.push(`¡QUIEBRA! La tesorería de la compañía ha entrado en saldo negativo (${treasury} SC).`);
  }

  return {
    nextCompany: {
      ...company,
      treasury,
      reputation,
      ship,
      loans: updatedLoans,
      isBankrupt
    },
    totalSalariesPaid,
    loansPaid,
    operatingCosts,
    maintenanceDamages,
    moraleChanges,
    isBankrupt,
    logNotes
  };
}
