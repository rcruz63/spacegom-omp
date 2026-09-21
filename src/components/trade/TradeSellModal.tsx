import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PlanetData } from '../../types/universe';

import { TRADE_PRODUCTS } from '../../data/tradeProducts';
import { 
  calculateNegotiatedSellUnitPrice, 
  sellGoods 
} from '../../engine/trade';
import { 
  getPlanetMarketProducts, 
  calculateLogisticsHandling 
} from '../../engine/tradeLogistics';
import { advanceDays } from '../../engine/calendar';
import { rollDice } from '../../engine/dice';
import { 
  DollarSign, 
  Coins, 
  CheckCircle2, 
  X, 
  Dices, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

interface TradeSellModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  onUpdateGame: (updated: GameSave) => void;
}

export function TradeSellModal({
  isOpen,
  onClose,
  game,
  planet,
  onUpdateGame
}: TradeSellModalProps) {
  const company = game.company;
  const activeOrders = useMemo(() => {
    return game.tradeOrders.filter(o => !o.isSold);
  }, [game.tradeOrders]);

  // Negociador de compraventa
  const negotiator = useMemo(() => {
    return company.employees.find(
      e => e.isActive && e.position.toLowerCase().includes('compraventa')
    );
  }, [company.employees]);

  // Modificadores del negociador
  const negotiatorMods = useMemo(() => {
    let expMod = 0;
    let morMod = 0;
    if (negotiator) {
      if (negotiator.experience === 'veterano') expMod = 1;
      if (negotiator.experience === 'novato') expMod = -1;
      if (negotiator.morale === 'alta') morMod = 1;
      if (negotiator.morale === 'baja') morMod = -1;
    }
    const repMod = Math.floor(company.reputation / 2);
    return {
      expMod,
      morMod,
      repMod,
      totalMod: expMod + morMod + repMod
    };
  }, [negotiator, company.reputation]);

  // Productos que el planeta demanda
  const market = useMemo(() => {
    return getPlanetMarketProducts(planet, game.tradeOrders, game.date);
  }, [planet, game.tradeOrders, game.date]);

  // Pedidos elegibles para vender en este mundo (que demanda el planeta)
  const eligibleOrders = useMemo(() => {
    return activeOrders.filter(order => {
      const demanded = market.demanded.find(d => d.code === order.productCode);
      return demanded && demanded.isAvailableForTrade;
    });
  }, [activeOrders, market.demanded]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    return eligibleOrders[0]?.id || '';
  });

  const selectedOrder = activeOrders.find(o => o.id === selectedOrderId);
  const selectedProdDef = selectedOrder ? TRADE_PRODUCTS[selectedOrder.productCode] : null;

  // Si el planeta no tiene convenio, se permite venta parcial
  const isConvenioWorld = planet.convenio_spacegom === 1;
  const [ucnToSell, setUcnToSell] = useState<number>(() => selectedOrder?.ucnAmount || 1);

  // Estado de negociación de venta
  const [hasNegotiated, setHasNegotiated] = useState(false);
  const [negotiatedResult, setNegotiatedResult] = useState<{
    daysToFindBuyers: number;
    unitPrice: number;
    totalRevenue: number;
    profit: number;
    rollTotal: number;
  } | null>(null);

  // Negociar la venta del pedido seleccionado
  const handleNegotiateSale = () => {
    if (!selectedOrder || !selectedProdDef) return;

    // Buscar compradores: 1D6 días por pedido
    const daysToFindBuyers = rollDice({ diceCount: 1 }).rolls[0];

    // Tirada de negociación de venta: 2D6 + mods
    const rollRes = rollDice({ diceCount: 2 });
    const rollTotal = rollRes.sum + negotiatorMods.totalMod;
    const { unitPrice } = calculateNegotiatedSellUnitPrice(selectedProdDef.baseSellPrice, rollTotal);

    const actualQty = isConvenioWorld ? selectedOrder.ucnAmount : ucnToSell;
    const totalRevenue = unitPrice * actualQty;
    const proportionalBuyCost = Math.round((selectedOrder.totalBuyCost * actualQty) / selectedOrder.ucnAmount);
    const profit = totalRevenue - proportionalBuyCost;

    setNegotiatedResult({
      daysToFindBuyers,
      unitPrice,
      totalRevenue,
      profit,
      rollTotal
    });
    setHasNegotiated(true);
  };

  // Días de estiba para descarga
  const actualQty = isConvenioWorld ? (selectedOrder?.ucnAmount || 0) : ucnToSell;
  const handling = useMemo(() => {
    return calculateLogisticsHandling(company.employees, actualQty, false);
  }, [company.employees, actualQty]);

  const totalDays = (negotiatedResult?.daysToFindBuyers || 1) + handling.handlingResult.daysRequired;

  const handleConfirmSale = () => {
    if (!selectedOrder || !negotiatedResult) return;

    const res = sellGoods({
      order: selectedOrder,
      planet,
      company,
      negotiationRollTotal: negotiatedResult.rollTotal,
      gameDate: game.date,
      ucnToSell: isConvenioWorld ? undefined : ucnToSell
    });

    // Avanzar tiempo por búsqueda de compradores + descarga
    const adv = advanceDays(game.date, totalDays);

    const newLogEntry = {
      id: `log_trade_sell_${Date.now()}`,
      gameDate: adv.newDate,
      category: 'comercio' as const,
      action: 'Venta de Mercancías',
      details: `Vendidas ${actualQty} UCN de ${selectedOrder.productName} por ${negotiatedResult.totalRevenue} SC en ${planet.name} (Beneficio: ${negotiatedResult.profit >= 0 ? '+' : ''}${negotiatedResult.profit} SC, +${totalDays}d).`,
      timestamp: new Date().toISOString()
    };

    const updatedOrders = game.tradeOrders.map(o => o.id === selectedOrder.id ? res.updatedOrder : o);

    onUpdateGame({
      ...game,
      date: adv.newDate,
      company: {
        ...res.nextCompany,
        employees: handling.updatedEmployees
      },
      tradeOrders: updatedOrders,
      auditLog: [newLogEntry, ...game.auditLog]
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Comercio: Venta de Mercancías
              </h3>
              <p className="text-xs text-slate-400">
                Búsqueda de compradores, negociación y descarga en {planet.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-space-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Advertencia si no hay pedidos demandados */}
          {eligibleOrders.length === 0 ? (
            <div className="p-6 bg-space-950 border border-space-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="font-semibold text-slate-200">No tienes mercancías en bodega demandadas por {planet.name}.</p>
              <p className="text-[11px] text-slate-500">
                Un planeta solo compra productos que no produce, siempre que su período de demanda no esté en cooldown.
              </p>
            </div>
          ) : (
            <>
              {/* PASO 1: Selección de Pedido */}
              {!hasNegotiated ? (
                <div className="space-y-4 text-xs">
                  <span className="font-bold text-slate-300 uppercase block">
                    Selecciona el pedido a vender en este mundo:
                  </span>

                  <div className="space-y-2.5 max-h-52 overflow-y-auto">
                    {eligibleOrders.map(order => {
                      const isSelected = selectedOrderId === order.id;
                      const prod = TRADE_PRODUCTS[order.productCode];
                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setUcnToSell(order.ucnAmount);
                          }}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-space-800 border-space-accent ring-1 ring-space-accent text-slate-100'
                              : 'bg-space-950 border-space-800 hover:border-space-700 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-sm">{order.productCode}</strong>
                              <span className="text-slate-300">{order.productName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {order.ucnAmount} UCN · Coste compra: {order.buyPricePerUcn} SC/UCN (Total: {order.totalBuyCost} SC) · 
                              {order.hasConvenioTraceability ? ' ✓ Trazable Spacegom' : ' ⚠ Ilegal'}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-emerald-400 font-bold text-xs block">
                              Base venta: {prod?.baseSellPrice} SC
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Fila #{order.orderRowNumber || 1}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Venta parcial en mundos sin convenio */}
                  {selectedOrder && !isConvenioWorld && (
                    <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-300 font-semibold">Venta Parcial (Mundo sin convenio):</span>
                        <input
                          type="number"
                          min={1}
                          max={selectedOrder.ucnAmount}
                          value={ucnToSell}
                          onChange={e => setUcnToSell(Math.max(1, Math.min(selectedOrder.ucnAmount, Number(e.target.value))))}
                          className="w-16 bg-space-900 border border-space-700 rounded p-1 text-center font-bold text-slate-100 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-amber-400/80">
                        Aviso: Realizar una venta parcial romperá la trazabilidad del Convenio Universal Spacegom para este pedido.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNegotiateSale}
                    disabled={!selectedOrder}
                    className="w-full py-3 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 text-xs shadow-md shadow-space-accent/10"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Buscar Compradores y Negociar Venta (1D6 días + tirada 2D6)</span>
                  </button>
                </div>
              ) : (
                /* PASO 2: Resultado de la Negociación y Confirmación */
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-space-800">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Compradores encontrados en {negotiatedResult?.daysToFindBuyers}d (Tirada: {negotiatedResult?.rollTotal})
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasNegotiated(false)}
                      className="text-slate-400 hover:text-slate-200 underline text-[11px]"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Resumen económico */}
                  {selectedOrder && negotiatedResult && (
                    <div className="p-4 bg-space-950 border border-space-700 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Producto y Cantidad:</span>
                        <strong className="text-slate-100">{actualQty} UCN de {selectedOrder.productName}</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Precio de Venta Negociado:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {negotiatedResult.unitPrice} SC / UCN
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Ingreso Total Bruto:</span>
                        <strong className="text-base font-black text-amber-400 font-mono">
                          +{negotiatedResult.totalRevenue} SC
                        </strong>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-space-800">
                        <span className="text-slate-400 font-bold uppercase">Resultado Neto (Ganancia/Pérdida):</span>
                        <div className="flex items-center gap-1.5">
                          {negotiatedResult.profit >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                          )}
                          <span className={`text-base font-black font-mono ${
                            negotiatedResult.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {negotiatedResult.profit >= 0 ? `+${negotiatedResult.profit}` : negotiatedResult.profit} SC
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-space-800 text-[11px] text-slate-500 flex justify-between">
                        <span>Descarga en bodega ({handling.handlingResult.daysRequired}d):</span>
                        <span className="text-sky-400 font-semibold">Total operación: +{totalDays} días</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmSale}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Confirmar Venta (+{negotiatedResult?.totalRevenue} SC) y Descarga</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
