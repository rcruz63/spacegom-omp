import { useState } from 'react';
import { GameSave } from '../../types/game';
import { calculateEmployeeDiceModifier, fireEmployee } from '../../engine/company';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { HiringModal } from '../HiringModal';
import { Users, UserPlus, HeartPulse, Wrench, Clock } from 'lucide-react';

interface CompanyManagementViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function CompanyManagementView({ game, onUpdateGame }: CompanyManagementViewProps) {
  const [isHiringOpen, setIsHiringOpen] = useState(false);
  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;
  const activeEmployees = game.company.employees.filter(e => e.isActive);
  const totalSalaries = activeEmployees.reduce((sum, e) => sum + e.monthlySalary, 0);

  const handleFire = (id: number, name: string) => {
    const withSeverance = confirm(
      `¿Despedir a ${name}?\n\n- PULSA ACEPTAR para indemnizar (pagar mes actual + 4 mensualidades) sin penalización de moral ni reputación.\n- PULSA CANCELAR para despido procedente/gratuito (costará -1 Reputación y bajará la moral de toda la plantilla).`
    );

    const res = fireEmployee(game.company, id, withSeverance);
    const updatedLog = [
      {
        id: `log_fire_${Date.now()}`,
        gameDate: game.date,
        category: 'tripulacion' as const,
        action: 'Despido de Empleado',
        details: res.logNotes.join(' '),
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    onUpdateGame({
      ...game,
      company: res.nextCompany,
      auditLog: updatedLog
    });
  };

  // La contratación ahora se gestiona a través de HiringModal y el motor de EventQueue

  return (
    <div className="space-y-6">
      {/* Ship & General Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Wrench className="w-4 h-4 text-space-accent" />
            <span>Estado de la Astronave</span>
          </div>
          <p className="text-lg font-bold text-slate-100">{game.company.ship.name}</p>
          <p className="text-xs text-slate-400 mb-3">{game.company.ship.model}</p>
          
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Almacén:</span>
              <span className="font-mono">{game.company.ship.warehouseOccupied} / {game.company.ship.warehouseMax} UCN</span>
            </div>
            <div className="flex justify-between">
              <span>Combustible:</span>
              <span className="font-mono">{game.company.ship.fuelCurrent} / {game.company.ship.fuelMax} U.</span>
            </div>
            <div className="flex justify-between">
              <span>Aforo Pasajeros:</span>
              <span className="font-mono">{game.company.ship.passengersCurrent} / {game.company.ship.passengersMax}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>Daños:</span>
              <span className="font-mono">
                {game.company.ship.damageLight} leves, {game.company.ship.damageModerate} mod, {game.company.ship.damageHeavy} grav
              </span>
            </div>
          </div>
        </div>

        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Nivel de Salubridad</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 capitalize">{game.company.healthLevel}</p>
          <p className="text-xs text-slate-400 mb-3">Mantenimiento higiénico y ambiental</p>
          
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Trajes estándar:</span>
              <span className="font-mono">{game.company.lifeSupport.standardSuit}</span>
            </div>
            <div className="flex justify-between">
              <span>Resp. con filtraje:</span>
              <span className="font-mono">{game.company.lifeSupport.filterRespirator}</span>
            </div>
            <div className="flex justify-between">
              <span>Respiradores simples:</span>
              <span className="font-mono">{game.company.lifeSupport.respirator}</span>
            </div>
            <div className="flex justify-between">
              <span>Máscaras filtraje:</span>
              <span className="font-mono">{game.company.lifeSupport.filterMask}</span>
            </div>
            <div className="flex justify-between">
              <span>Suministros oxígeno:</span>
              <span className="font-mono">{game.company.lifeSupport.basicOxygen}</span>
            </div>
          </div>
        </div>

        <div className="bg-space-800 border border-space-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Resumen de Plantilla</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{activeEmployees.length} empleados</p>
            <p className="text-xs text-slate-400 mt-1">
              Gasto en nóminas mensuales: <span className="font-bold text-amber-300 font-mono">{totalSalaries} SC</span>
            </p>
          </div>

          <button
            onClick={() => setIsHiringOpen(true)}
            className="w-full mt-4 py-2 px-3 bg-space-accent text-space-900 font-bold text-xs rounded-lg hover:bg-sky-400 flex items-center justify-center gap-1.5 shadow"
          >
            <UserPlus className="w-4 h-4" />
            <span>Contratar Personal</span>
          </button>
        </div>
      </div>

      {/* Hiring Modal/Section */}
      <HiringModal
        isOpen={isHiringOpen}
        onClose={() => setIsHiringOpen(false)}
        game={game}
        currentPlanet={currentPlanet}
        onUpdateGame={onUpdateGame}
      />

      {/* Roster Table */}
      <div className="bg-space-800 border border-space-700 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-space-700 flex justify-between items-center">
          <h3 className="text-md font-bold text-slate-100">Ficha de Plantilla y Tripulación</h3>
          <span className="text-xs text-slate-400">Total salarios mensuales: {totalSalaries} SC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-space-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-space-700">
              <tr>
                <th className="py-3 px-4">Puesto</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Salario</th>
                <th className="py-3 px-4">Experiencia</th>
                <th className="py-3 px-4">Moral</th>
                <th className="py-3 px-4">Modificador</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-700/60 text-slate-200">
              {activeEmployees.map(emp => {
                const mod = calculateEmployeeDiceModifier(emp);
                return (
                  <tr key={emp.id} className="hover:bg-space-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <span>{emp.position}</span>
                      {emp.isBusy && (
                        <span 
                          className="ml-2 text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-normal inline-flex items-center gap-1"
                          title={emp.busyReason || 'Ocupado'}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>Ocupado</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{emp.name}</td>
                    <td className="py-3 px-4 font-mono text-amber-300">{emp.monthlySalary} SC</td>
                    <td className="py-3 px-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        emp.experience === 'veterano' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' :
                        emp.experience === 'novato' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                        'bg-space-700 text-slate-300'
                      }`}>
                        {emp.experience}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        emp.morale === 'alta' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        emp.morale === 'baja' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                        'bg-space-700 text-slate-300'
                      }`}>
                        {emp.morale}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={mod > 0 ? 'text-emerald-400' : mod < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleFire(emp.id, emp.name)}
                        className="text-rose-400 hover:text-rose-300 font-semibold text-[11px] p-1 rounded hover:bg-rose-950/40"
                      >
                        Despedir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
