import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { getAreaOrdersCapacity } from '../../engine/tradeLogistics';
import { PassengerTransportModal } from '../PassengerTransportModal';
import { TradeBuyModal } from '../trade/TradeBuyModal';
import { TradeSellModal } from '../trade/TradeSellModal';
import { 
  ShoppingCart, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TradeManagementViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function TradeManagementView({ game, onUpdateGame }: TradeManagementViewProps) {
  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;
  const areaId = game.universe.currentAreaId;

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);

  const isAtWorldSurface = game.universe.currentLocation === 'mundo';
  const hasTakenPassengersThisVisit = !!game.universe.passengersTakenInCurrentVisit;
  const freeSeats = Math.max(0, game.company.ship.passengersMax - game.company.ship.passengersCurrent);
  const canTransportPassengers = currentPlanet && isAtWorldSurface && !hasTakenPassengersThisVisit && freeSeats > 0;

  const availableSpace = game.company.ship.warehouseMax - game.company.ship.warehouseOccupied;
  const activeOrders = game.tradeOrders.filter(o => !o.isSold);
  const areaOrders = game.tradeOrders.filter(o => o.areaId === areaId);

  const areaCapacity = useMemo(() => {
    return getAreaOrdersCapacity(game.tradeOrders, areaId);
  }, [game.tradeOrders, areaId]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bodega y Compra */}
        <div className="bg-space-800 border border-space-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Almacén / Bodega de Mercancías
            </span>
            <p className="text-2xl font-black text-slate-100">
              {game.company.ship.warehouseOccupied} / {game.company.ship.warehouseMax} UCN
            </p>
            <p className="text-xs text-space-accent mt-1">
              {availableSpace} UCN disponibles para cargar
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              disabled={!currentPlanet || !isAtWorldSurface || availableSpace <= 0 || areaCapacity.isFull}
              className="w-full py-2 px-3 bg-space-accent hover:bg-sky-400 disabled:opacity-50 text-space-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Comprar Mercancías (Cesta)</span>
            </button>
          </div>
        </div>

        {/* Mercancías en Almacén y Venta */}
        <div className="bg-space-800 border border-space-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Mercancías Almacenadas
            </span>
            <p className="text-2xl font-black text-amber-300">
              {activeOrders.length} pedidos
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Inversión retenida: {activeOrders.reduce((sum, o) => sum + o.totalBuyCost, 0)} SC
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsSellModalOpen(true)}
              disabled={!currentPlanet || !isAtWorldSurface || activeOrders.length === 0}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-space-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors disabled:cursor-not-allowed"
            >
              <DollarSign className="w-4 h-4" />
              <span>Vender Mercancías</span>
            </button>
          </div>
        </div>

        {/* Pasajeros */}
        <div className="bg-space-800 border border-space-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Aforo de Pasajeros en Nave
            </span>
            <p className="text-2xl font-black text-space-accent">
              {game.company.ship.passengersCurrent} / {game.company.ship.passengersMax}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {freeSeats} plazas libres · {currentPlanet ? `Demanda: ${currentPlanet.max_passengers || 6} prom.` : 'Sin mundo'}
            </p>
          </div>

          <div className="mt-4">
            {hasTakenPassengersThisVisit ? (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Pasajeros ya captados en esta visita.</span>
              </div>
            ) : !isAtWorldSurface ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-space-900/60 p-2 rounded border border-space-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Requiere superficie del MUNDO.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPassengerModalOpen(true)}
                disabled={!canTransportPassengers}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4" />
                <span>Transporte de Pasajeros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Comercio de Mercancías del Área (25 Filas) */}
      <div className="bg-space-800 border border-space-700 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-space-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-space-accent" />
              <span>Registro de Comercio de Mercancías — Área {areaId}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Capacidad reglamentaria: {areaCapacity.currentCount} / {areaCapacity.maxAllowed} filas utilizadas (Convenio Universal Spacegom)
            </p>
          </div>

          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
            areaCapacity.isFull ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-space-900 text-slate-300 border border-space-700'
          }`}>
            {areaCapacity.availableSlots} filas disponibles
          </span>
        </div>

        {areaOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-slate-300 font-semibold">No hay pedidos registrados en el Área {areaId}.</p>
            <p className="text-slate-500">
              Compra mercancías en los mundos de este sector para registrarlas en la tabla oficial.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-space-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-space-700">
                <tr>
                  <th className="py-3 px-3">Fila</th>
                  <th className="py-3 px-3">Mundo Compra</th>
                  <th className="py-3 px-3">Producto & UCN</th>
                  <th className="py-3 px-3">Coste Compra</th>
                  <th className="py-3 px-3">Mundo Venta</th>
                  <th className="py-3 px-3">Ingreso Venta</th>
                  <th className="py-3 px-3">Beneficio</th>
                  <th className="py-3 px-3">Trazabilidad Spacegom</th>
                  <th className="py-3 px-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-700/60 text-slate-200">
                {areaOrders.map((order, idx) => {
                  const buyPlanet = PLANETS_BY_CODE[order.buyPlanetCode];
                  const sellPlanet = order.sellPlanetCode ? PLANETS_BY_CODE[order.sellPlanetCode] : null;

                  return (
                    <tr key={order.id} className="hover:bg-space-700/30 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono">#{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">{buyPlanet?.name || `#${order.buyPlanetCode}`}</div>
                        <div className="text-[10px] text-slate-500">{order.buyDate ? order.buyDate.slice(0, 10) : '-'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-space-accent">{order.productCode}</strong>
                        <span className="text-slate-300 ml-1.5 font-mono font-bold">({order.ucnAmount} UCN)</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{order.productName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300 font-bold">
                        {order.totalBuyCost} SC
                        <span className="text-[10px] text-slate-500 font-normal block">{order.buyPricePerUcn} SC/u</span>
                      </td>
                      <td className="py-3 px-3">
                        {order.isSold ? (
                          <>
                            <div className="font-semibold text-slate-200">{sellPlanet?.name || `#${order.sellPlanetCode}`}</div>
                            <div className="text-[10px] text-slate-500">{order.sellDate ? order.sellDate.slice(0, 10) : '-'}</div>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">- En tránsito -</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {order.isSold ? (
                          <span className="text-emerald-400 font-bold">{order.totalSellRevenue} SC</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {order.isSold && order.profit !== undefined ? (
                          <div className="flex items-center gap-1 font-bold">
                            {order.profit >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span className={order.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {order.profit >= 0 ? `+${order.profit}` : order.profit} SC
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.hasConvenioTraceability
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {order.hasConvenioTraceability ? '✓ Convenio' : '⚠ Ilegal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.isSold 
                            ? 'bg-space-700 text-slate-300' 
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                        }`}>
                          {order.isSold ? 'Vendido' : 'En Bodega'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales de Comercio */}
      {currentPlanet && (
        <>
          <TradeBuyModal
            isOpen={isBuyModalOpen}
            onClose={() => setIsBuyModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />

          <TradeSellModal
            isOpen={isSellModalOpen}
            onClose={() => setIsSellModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />

          <PassengerTransportModal
            isOpen={isPassengerModalOpen}
            onClose={() => setIsPassengerModalOpen(false)}
            game={game}
            planet={currentPlanet}
            onUpdateGame={onUpdateGame}
          />
        </>
      )}
    </div>
  );
}
