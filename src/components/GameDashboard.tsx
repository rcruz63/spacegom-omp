import { useState } from 'react';
import { GameSave } from '../types/game';
import { formatDate } from '../engine/calendar';
import { PLANETS_BY_CODE } from '../engine/universe';
import { 
  Rocket, 
  Coins, 
  Award, 
  Calendar, 
  MapPin, 
  ShoppingCart, 
  Wrench, 
  ScrollText, 
  Building2, 
  Compass, 
  Dices, 
  FileText, 
  ChevronLeft,
  AlertTriangle,
  FastForward,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { calculateNextMilestone, advanceTimeToMilestone } from '../engine/eventQueue';
import { GameEvent } from '../types/events';
import { EventResolutionModal } from './EventResolutionModal';
import { DiceModal } from './DiceModal';
import { AuditLogModal } from './AuditLogModal';
import { SectorMapView } from './tabs/SectorMapView';
import { CompanyManagementView } from './tabs/CompanyManagementView';
import { TradeManagementView } from './tabs/TradeManagementView';
import { SpaceportOperationsView } from './tabs/SpaceportOperationsView';
import { MissionsView } from './tabs/MissionsView';
import { TreasuryCalendarView } from './tabs/TreasuryCalendarView';
import { saveGame } from '../engine/storage';
import { DiceRollResult } from '../types/common';

interface GameDashboardProps {
  game: GameSave;
  onExitToMenu: () => void;
}

export type ActiveTab = 'sector' | 'compania' | 'comercio' | 'espaciopuerto' | 'misiones' | 'tesoreria_calendario';

export function GameDashboard({ game: initialGame, onExitToMenu }: GameDashboardProps) {
  const [game, setGame] = useState<GameSave>(initialGame);
  const [activeTab, setActiveTab] = useState<ActiveTab>('sector');
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeResolvingEvent, setActiveResolvingEvent] = useState<GameEvent | null>(null);

  const milestone = calculateNextMilestone(game.date, game.events || []);
  const director = game.company.employees.find(e => e.isActive && e.position.toLowerCase().includes('director gerente'));

  const handleAdvanceToMilestone = () => {
    const targetEvent = milestone.event;
    const res = advanceTimeToMilestone(game);
    handleUpdateGame(res.nextGame);

    if (targetEvent && targetEvent.type === 'hire_resolution') {
      setActiveResolvingEvent(targetEvent);
    }
  };

  const handleEventResolved = (updatedGame: GameSave) => {
    handleUpdateGame(updatedGame);
    setActiveResolvingEvent(null);
  };

  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;

  const handleUpdateGame = (updated: GameSave) => {
    setGame(updated);
    saveGame(updated);
  };

  const handleDiceRollComplete = (result: DiceRollResult) => {
    const updatedLog = [
      {
        id: `log_dice_${Date.now()}`,
        gameDate: game.date,
        category: 'dados' as const,
        action: result.reason,
        details: `Resultado total: ${result.total} (Dados: [${result.rolls.join(', ')}])`,
        rollDetails: result,
        timestamp: new Date().toISOString()
      },
      ...game.auditLog
    ];

    handleUpdateGame({
      ...game,
      auditLog: updatedLog
    });
  };

  // Alerta de números rojos en tesorería
  const isTreasuryInDanger = game.company.treasury < 50;

  return (
    <div className="min-h-screen flex flex-col bg-space-900 text-slate-100">
      {/* Header Bar */}
      <header className="bg-space-800/90 border-b border-space-700 px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            onClick={onExitToMenu}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-space-900/60 rounded border border-space-700"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Partidas</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-space-accent" />
              <span className="font-bold text-slate-100 text-sm">{game.company.name}</span>
              <span className="text-[10px] px-2 py-0.5 bg-space-700 text-slate-300 rounded-full font-mono">
                {game.company.ship.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-space-accent">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(game.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Global Key Stats */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-space-900/80 rounded-lg border border-space-700">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className={isTreasuryInDanger ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
              {game.company.treasury} SC
            </span>
            {isTreasuryInDanger && (
              <span className="flex items-center gap-0.5 text-[10px] text-rose-400 animate-pulse font-normal">
                <AlertTriangle className="w-3 h-3" />
                ¡Alerta Fondos!
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-space-900/80 rounded-lg border border-space-700">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Reputación: {game.company.reputation}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-space-900/80 rounded-lg border border-space-700">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>
              Área {game.universe.currentAreaId} [{game.universe.currentCol}{game.universe.currentRow}]
              {currentPlanet ? ` - ${currentPlanet.name}` : ' (Espacio Vacío)'}
            </span>
          </div>

          {/* Quick Action Modals */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-space-accent text-space-900 font-bold rounded-lg hover:bg-sky-400 transition-colors shadow-sm"
              title="Lanzador de dados manual o automático"
            >
              <Dices className="w-4 h-4" />
              <span>Tirar Dados</span>
            </button>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-space-700 hover:bg-space-600 text-slate-200 font-medium rounded-lg border border-space-600 transition-colors"
              title="Ver bitácora completa de auditoría"
            >
              <FileText className="w-4 h-4" />
              <span>Bitácora ({game.auditLog.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Time & Event Control Bar */}
      <div className="bg-space-950/70 border-b border-space-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Director Gerente Status */}
          {director && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              director.isBusy 
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' 
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Director: <strong>{director.isBusy ? director.busyReason : 'Disponible para encargos'}</strong></span>
            </div>
          )}

          {/* Próximo Hito / Evento */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-space-accent shrink-0" />
            <span>
              Próximo hito: <strong className="text-slate-100">{milestone.reason}</strong>{' '}
              <span className="text-space-accent font-mono font-bold">
                (en {milestone.days} {milestone.days === 1 ? 'día' : 'días'})
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAdvanceToMilestone}
            className="flex items-center gap-1.5 px-3 py-1 bg-space-accent text-space-950 font-bold rounded-lg hover:bg-sky-400 transition-colors shadow-sm"
            title="Avanzar el calendario hasta el próximo evento o cierre de nóminas"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Avanzar al Hito (+{milestone.days}d)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-space-800/50 border-b border-space-700/80 px-4 flex gap-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sector')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sector'
              ? 'border-space-accent text-space-accent bg-space-700/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Sector & Navegación</span>
        </button>

        <button
          onClick={() => setActiveTab('compania')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'compania'
              ? 'border-space-accent text-space-accent bg-space-700/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Compañía & Empleados</span>
        </button>

        <button
          onClick={() => setActiveTab('comercio')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'comercio'
              ? 'border-space-accent text-space-accent bg-space-700/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Comercio & Pasajeros</span>
        </button>

        <button
          onClick={() => setActiveTab('espaciopuerto')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'espaciopuerto'
              ? 'border-space-accent text-space-accent bg-space-700/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Espaciopuerto & Orbital</span>
        </button>

        <button
          onClick={() => setActiveTab('misiones')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'misiones'
              ? 'border-space-accent text-space-accent bg-space-700/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Misiones ({game.missions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tesoreria_calendario')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tesoreria_calendario'
              ? 'border-space-accent text-space-accent bg-space-700/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tesorería & Calendario</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
        {activeTab === 'sector' && (
          <SectorMapView game={game} onUpdateGame={handleUpdateGame} />
        )}
        {activeTab === 'compania' && (
          <CompanyManagementView game={game} onUpdateGame={handleUpdateGame} />
        )}
        {activeTab === 'comercio' && (
          <TradeManagementView game={game} onUpdateGame={handleUpdateGame} />
        )}
        {activeTab === 'espaciopuerto' && (
          <SpaceportOperationsView game={game} onUpdateGame={handleUpdateGame} />
        )}
        {activeTab === 'misiones' && (
          <MissionsView game={game} onUpdateGame={handleUpdateGame} />
        )}
        {activeTab === 'tesoreria_calendario' && (
          <TreasuryCalendarView game={game} onUpdateGame={handleUpdateGame} />
        )}
      </main>

      {/* Modals */}
      <DiceModal
        isOpen={isDiceModalOpen}
        onClose={() => setIsDiceModalOpen(false)}
        onRollComplete={handleDiceRollComplete}
      />


      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        entries={game.auditLog}
      />

      {/* Event Resolution Modal */}
      {activeResolvingEvent && (
        <EventResolutionModal
          event={activeResolvingEvent}
          game={game}
          onResolved={handleEventResolved}
        />
      )}
    </div>
  );
}
