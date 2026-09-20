import { useState } from 'react';
import { GameSave } from '../../types/game';
import { advanceDays, formatDate } from '../../engine/calendar';
import { performWeeklyAdministration, performMonthlyAdministration } from '../../engine/administration';
import { Calendar, Landmark } from 'lucide-react';

interface TreasuryCalendarViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function TreasuryCalendarView({ game, onUpdateGame }: TreasuryCalendarViewProps) {
  const [loanRoll, setLoanRoll] = useState<number>(9);

  const activeEmployees = game.company.employees.filter(e => e.isActive);
  const totalSalaries = activeEmployees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const totalLoansOwed = game.company.loans.reduce((sum, l) => sum + (l.totalToRepay - (l.paidInstallments * l.monthlyPayment)), 0);

  const handleAdvanceDays = (days: number) => {
    const adv = advanceDays(game.date, days);
    let company = { ...game.company };
    const logNotes: string[] = [];

    // Si se cruza semana (día 7, 14, 21, 28)
    if (adv.isWeeklyAdminDue) {
      const weekly = performWeeklyAdministration(company);
      company = weekly.nextCompany;
      logNotes.push(...weekly.logNotes);
    }

    // Si se cruza fin de mes (día 28)
    if (adv.isMonthlyAdminDue) {
      const monthly = performMonthlyAdministration(company);
      company = monthly.nextCompany;
      logNotes.push(...monthly.logNotes);
    }

    const updatedLog = [
      {
        id: `log_adv_${Date.now()}`,
        gameDate: adv.newDate,
        category: 'calendario' as const,
        action: `Avanzados ${days} días`,
        details: logNotes.length > 0 ? logNotes.join(' | ') : `Paso del tiempo sin incidentes administrativos.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      date: adv.newDate,
      company,
      auditLog: updatedLog
    });
  };

  const handleRequestLoan = () => {
    if (game.company.totalLoansTaken >= 10) {
      alert('Has alcanzado el límite máximo de 10 préstamos en la campaña.');
      return;
    }
    if (game.company.loans.length >= 2) {
      alert('Ya tienes 2 préstamos activos simultáneos (límite máximo permitido).');
      return;
    }

    if (loanRoll < 9) {
      alert(`Tirada insuficiente (${loanRoll}). Se requiere 9 o más para obtener financiación bancaria.`);
      return;
    }

    const newLoan = {
      id: Date.now(),
      amount: 100,
      totalToRepay: 200, // 20 cuotas de 10 SC
      paidInstallments: 0,
      totalInstallments: 20,
      monthlyPayment: 10,
      grantYear: game.date.year,
      grantMonth: game.date.month
    };

    const updatedLog = [
      {
        id: `log_loan_${Date.now()}`,
        gameDate: game.date,
        category: 'tesoreria' as const,
        action: 'Concesión de Préstamo Bancario',
        details: `Concedido préstamo de 100 SC a devolver en 20 cuotas mensuales de 10 SC. Tesorería +100 SC.`,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      company: {
        ...game.company,
        treasury: game.company.treasury + 100,
        loans: [...game.company.loans, newLoan],
        totalLoansTaken: game.company.totalLoansTaken + 1
      },
      auditLog: updatedLog
    });

    alert('¡Préstamo concedido! Se han sumado 100 SC a la tesorería de la compañía.');
  };

  return (
    <div className="space-y-6">
      {/* Treasury Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Saldo de Tesorería
          </span>
          <p className="text-3xl font-black text-amber-300 font-mono">{game.company.treasury} SC</p>
          <p className="text-xs text-slate-400 mt-1">Fondos disponibles para operaciones inmediatas</p>
        </div>

        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Obligaciones de Nóminas
          </span>
          <p className="text-3xl font-black text-rose-400 font-mono">-{totalSalaries} SC</p>
          <p className="text-xs text-slate-400 mt-1">A pagar el día 28 de cada mes</p>
        </div>

        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Deuda Bancaria Viva
          </span>
          <p className="text-3xl font-black text-indigo-400 font-mono">{totalLoansOwed} SC</p>
          <p className="text-xs text-slate-400 mt-1">
            {game.company.loans.length} préstamos activos (máximo 2 a la vez)
          </p>
        </div>
      </div>

      {/* Calendar & Passage of Time Section */}
      <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-space-700">
          <div>
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-space-accent" />
              <span>Calendario de Campaña y Paso del Tiempo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fecha actual: <span className="font-mono text-space-accent font-bold">{formatDate(game.date)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 3, 7, 28].map(d => (
              <button
                key={d}
                onClick={() => handleAdvanceDays(d)}
                className="px-3 py-1.5 bg-space-700 hover:bg-space-600 text-slate-200 text-xs font-semibold rounded-lg border border-space-600 shadow"
              >
                +{d} {d === 1 ? 'día' : 'días'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Recuerda: Cada año tiene 12 meses de 28 días. Los días <strong>7, 14, 21 y 28</strong> se aplica la administración semanal (revisión directiva). El día <strong>28</strong> se aplican además los salarios mensuales, mantenimiento técnico, suministros y cuotas de deuda.
        </p>

        {/* 28-day Month View */}
        <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto p-4 bg-space-900/80 rounded-xl border border-space-700">
          {Array.from({ length: 28 }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = game.date.day === dayNum;
            const isWeekly = dayNum % 7 === 0;
            const isMonthly = dayNum === 28;

            return (
              <div
                key={dayNum}
                className={`p-2 rounded-lg flex flex-col items-center justify-between text-xs font-mono border transition-all ${
                  isToday
                    ? 'bg-space-accent text-space-900 font-bold border-space-accent shadow-md shadow-space-accent/20 scale-105'
                    : isMonthly
                    ? 'bg-rose-950/40 border-rose-700 text-rose-300'
                    : isWeekly
                    ? 'bg-amber-950/40 border-amber-700 text-amber-300'
                    : 'bg-space-800 border-space-700 text-slate-400'
                }`}
              >
                <span>{dayNum}</span>
                <span className="text-[9px] uppercase tracking-tighter">
                  {isMonthly ? 'Mes' : isWeekly ? 'Sem' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banking & Loans Section */}
      <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-space-700">
          <div>
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              <span>Financiación Bancaria y Préstamos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Solicitud de 100 SC a devolver en 20 cuotas de 10 SC (Tirada director gerente requerida: 9+)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Tirada Director (2D6+mods):</label>
              <input
                type="number"
                min="2"
                max="15"
                value={loanRoll}
                onChange={e => setLoanRoll(Number(e.target.value))}
                className="w-16 bg-space-900 border border-space-600 rounded px-2 py-1 text-xs text-slate-100"
              />
            </div>

            <button
              onClick={handleRequestLoan}
              disabled={game.company.loans.length >= 2 || game.company.totalLoansTaken >= 10}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-space-900 font-bold text-xs rounded-lg shadow"
            >
              Pedir Préstamo (+100 SC)
            </button>
          </div>
        </div>

        {game.company.loans.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No tienes préstamos pendientes de amortización.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game.company.loans.map((loan, idx) => (
              <div key={loan.id} className="p-4 bg-space-900 border border-space-700 rounded-xl text-xs">
                <div className="flex justify-between font-bold text-slate-200 mb-2">
                  <span>Préstamo #{idx + 1}</span>
                  <span className="text-amber-300 font-mono">10 SC / mes</span>
                </div>
                <div className="space-y-1 text-slate-400 mb-3">
                  <div>Cuotas amortizadas: <strong className="text-slate-200">{loan.paidInstallments} / {loan.totalInstallments}</strong></div>
                  <div>Pendiente de pago: <strong className="text-slate-200">{(loan.totalInstallments - loan.paidInstallments) * loan.monthlyPayment} SC</strong></div>
                </div>

                {/* Visual installments progress */}
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: loan.totalInstallments }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-sm ${
                        i < loan.paidInstallments ? 'bg-emerald-500' : 'bg-space-700'
                      }`}
                      title={`Cuota ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
