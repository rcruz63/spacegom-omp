import { useState, useMemo } from 'react';
import { GameSave } from '../../types/game';
import { PlanetData } from '../../types/universe';
import { ProductCode, TradeOrder } from '../../types/trade';
import { TRADE_PRODUCTS } from '../../data/tradeProducts';
import { 
  calculateNegotiatedBuyUnitPrice, 
  buyGoods 
} from '../../engine/trade';
import { 
  getPlanetMarketProducts, 
  getAreaOrdersCapacity, 
  calculateLogisticsHandling,
  PlanetProductMarketInfo
} from '../../engine/tradeLogistics';
import { advanceDays } from '../../engine/calendar';
import { rollDice } from '../../engine/dice';
import { 
  ShoppingCart, 
  Package, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Dices,
  ArrowRight
} from 'lucide-react';

interface TradeBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSave;
  planet: PlanetData;
  onUpdateGame: (updated: GameSave) => void;
}

export function TradeBuyModal({
  isOpen,
  onClose,
  game,
  planet,
  onUpdateGame
}: TradeBuyModalProps) {
  const company = game.company;
  const areaId = game.universe.currentAreaId;
  const availableSpace = Math.max(0, company.ship.warehouseMax - company.ship.warehouseOccupied);

  // Negociador de compraventa
  const negotiator = useMemo(() => {
    return company.employees.find(
      e => e.isActive && e.position.toLowerCase().includes('compraventa')
    );
  }, [company.employees]);

  // Operarios de logística
  const operarios = useMemo(() => {
    return company.employees.filter(
      e => e.isActive && e.position.toLowerCase().includes('logística y almacén')
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

  // Productos que el planeta produce
  const market = useMemo(() => {
    return getPlanetMarketProducts(planet, game.tradeOrders, game.date);
  }, [planet, game.tradeOrders, game.date]);

  // Capacidad de 25 filas del Área
  const areaCapacity = useMemo(() => {
    return getAreaOrdersCapacity(game.tradeOrders, areaId);
  }, [game.tradeOrders, areaId]);

  // Estado de la cesta
  const [selectedCodes, setSelectedCodes] = useState<ProductCode[]>([]);
  const [negotiatedPrices, setNegotiatedPrices] = useState<Record<ProductCode, number>>({} as Record<ProductCode, number>);
  const [cartQuantities, setCartQuantities] = useState<Record<ProductCode, number>>({} as Record<ProductCode, number>);
  const [hasNegotiated, setHasNegotiated] = useState(false);

  // Alternar selección de producto para negociar
  const handleToggleProduct = (code: ProductCode) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter(c => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  // Negociar precios (1 día por producto)
  const handleNegotiatePrices = () => {
    if (selectedCodes.length === 0) return;

    const prices: Record<ProductCode, number> = {} as Record<ProductCode, number>;
    const quantities: Record<ProductCode, number> = {} as Record<ProductCode, number>;

    for (const code of selectedCodes) {
      const prod = TRADE_PRODUCTS[code];
      const rollRes = rollDice({ diceCount: 2 });
      const rollTotal = rollRes.sum + negotiatorMods.totalMod;
      const { unitPrice } = calculateNegotiatedBuyUnitPrice(prod.baseBuyPrice, rollTotal);
      prices[code] = unitPrice;
      quantities[code] = 0;
    }

    setNegotiatedPrices(prices);
    setCartQuantities(quantities);
    setHasNegotiated(true);
  };

  // Cálculo de totales de la cesta
  const cartTotalUcn = useMemo(() => {
    return Object.values(cartQuantities).reduce((sum, q) => sum + (q || 0), 0);
  }, [cartQuantities]);

  const cartTotalCost = useMemo(() => {
    return Object.entries(cartQuantities).reduce((sum, [codeStr, q]) => {
      const code = codeStr as ProductCode;
      const price = negotiatedPrices[code] || TRADE_PRODUCTS[code].baseBuyPrice;
      return sum + (price * (q || 0));
    }, 0);
  }, [cartQuantities, negotiatedPrices]);

  // Días de estiba calculados
  const handling = useMemo(() => {
    return calculateLogisticsHandling(company.employees, cartTotalUcn, true);
  }, [company.employees, cartTotalUcn]);

  // Días totales de la operación: días negociación (1/prod) + días estiba
  const totalDaysRequired = selectedCodes.length + handling.handlingResult.daysRequired;

  const canAfford = company.treasury >= cartTotalCost;
  const canFit = cartTotalUcn <= availableSpace;
  const hasOrdersRemaining = areaCapacity.availableSlots >= Object.values(cartQuantities).filter(q => q > 0).length;

  const handleConfirmPurchase = () => {
    if (cartTotalUcn <= 0 || !canAfford || !canFit) return;

    let nextComp = company;
    const newOrders: TradeOrder[] = [];
    const logNotes: string[] = [];

    let rowOffset = 0;
    for (const [codeStr, qty] of Object.entries(cartQuantities)) {
      if (!qty || qty <= 0) continue;
      const code = codeStr as ProductCode;
      const unitPrice = negotiatedPrices[code];

      // Ejecutar compra
      const buyRes = buyGoods({
        productCode: code,
        ucnAmount: qty,
        areaId,
        planet,
        company: nextComp,
        negotiationRollTotal: 8, // Ya negociado
        gameDate: game.date,
        existingOrdersCountInArea: areaCapacity.currentCount + rowOffset
      });

      // Override con precio negociado exacto
      const finalCost = unitPrice * qty;
      const adjustedOrder: TradeOrder = {
        ...buyRes.order,
        buyPricePerUcn: unitPrice,
        totalBuyCost: finalCost
      };

      newOrders.push(adjustedOrder);
      rowOffset++;
      logNotes.push(...buyRes.logNotes);

      nextComp = {
        ...buyRes.nextCompany,
        treasury: nextComp.treasury - finalCost
      };
    }

    // Avanzar tiempo por días de negociación y estiba
    const adv = advanceDays(game.date, totalDaysRequired);

    const newLogEntry = {
      id: `log_trade_buy_${Date.now()}`,
      gameDate: adv.newDate,
      category: 'comercio' as const,
      action: 'Compra de Mercancías y Estiba',
      details: `Adquiridas ${cartTotalUcn} UCN por ${cartTotalCost} SC en ${planet.name} (+${totalDaysRequired}d negociación y carga).`,
      timestamp: new Date().toISOString()
    };

    onUpdateGame({
      ...game,
      date: adv.newDate,
      company: {
        ...nextComp,
        employees: handling.updatedEmployees
      },
      tradeOrders: [...newOrders, ...game.tradeOrders],
      auditLog: [newLogEntry, ...game.auditLog]
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-space-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-space-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-space-accent/10 border border-space-accent/30 rounded-xl text-space-accent">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                Comercio: Compra de Mercancías
              </h3>
              <p className="text-xs text-slate-400">
                Negociación, cesta y carga en bodega en {planet.name}
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
          
          {/* Status Bar */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Espacio Bodega:</span>
              <strong className="text-space-accent text-sm">{availableSpace} UCN libres</strong>
            </div>

            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Tesorería:</span>
              <strong className="text-amber-300 text-sm font-mono">{company.treasury} SC</strong>
            </div>

            <div className="p-3 bg-space-950 border border-space-800 rounded-xl">
              <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Registro Área {areaId}:</span>
              <strong className={areaCapacity.isFull ? 'text-rose-400 text-sm' : 'text-slate-200 text-sm'}>
                {areaCapacity.currentCount} / {areaCapacity.maxAllowed} pedidos
              </strong>
            </div>
          </div>

          {/* Negociador de Compraventa */}
          {negotiator && (
            <div className="p-3 bg-space-950/60 border border-space-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Negociador: <strong>{negotiator.name}</strong> ({negotiator.experience}, moral {negotiator.morale})</span>
              </div>
              <span className="text-space-accent font-mono font-bold">
                Mod: {negotiatorMods.totalMod >= 0 ? `+${negotiatorMods.totalMod}` : negotiatorMods.totalMod}
              </span>
            </div>
          )}

          {/* PASO 1: Selección y Negociación de Precios */}
          {!hasNegotiated ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-300">
                  1. Selecciona los productos a negociar (1 día de trabajo por producto):
                </span>
                <span className="text-xs text-space-accent font-semibold">
                  {selectedCodes.length} {selectedCodes.length === 1 ? 'día' : 'días'} de negociación
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
                {market.producible.map((prod: PlanetProductMarketInfo) => {
                  const isSelected = selectedCodes.includes(prod.code);
                  return (
                    <button
                      key={prod.code}
                      type="button"
                      disabled={!prod.isAvailableForTrade}
                      onClick={() => handleToggleProduct(prod.code)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                        !prod.isAvailableForTrade 
                          ? 'bg-space-950/40 border-space-800 text-slate-500 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-space-800 border-space-accent ring-1 ring-space-accent text-slate-100'
                            : 'bg-space-950 border-space-800 hover:border-space-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{prod.code}</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{prod.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Base: {prod.baseBuyPrice} SC/UCN · Máx: {prod.maxUcnPerVisit} UCN
                        </div>
                      </div>

                      {!prod.isAvailableForTrade ? (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          {prod.cooldownRemainingDays}d cooldown
                        </span>
                      ) : (
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-space-accent text-space-950 border-space-accent' : 'border-space-600'
                        }`}>
                          {isSelected && '✓'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNegotiatePrices}
                disabled={selectedCodes.length === 0}
                className="w-full py-3 bg-space-accent text-space-950 font-bold rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-space-accent/10"
              >
                <Dices className="w-4 h-4" />
                <span>Negociar Precios de los {selectedCodes.length} Productos (+{selectedCodes.length}d)</span>
              </button>
            </div>
          ) : (
            /* PASO 2: Cesta de Compra y Cantidades */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-space-800">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Precios negociados por el negociador (+{selectedCodes.length}d de trabajo)
                </span>
                <button
                  type="button"
                  onClick={() => setHasNegotiated(false)}
                  className="text-slate-400 hover:text-slate-200 underline text-[11px]"
                >
                  Volver a negociar
                </button>
              </div>

              {/* Lista de productos negociados con selector de UCN */}
              <div className="space-y-3">
                {selectedCodes.map(code => {
                  const prod = TRADE_PRODUCTS[code];
                  const price = negotiatedPrices[code];
                  const currentQty = cartQuantities[code] || 0;
                  const maxAllowed = planet.ucn_per_order || 10;

                  return (
                    <div key={code} className="p-3 bg-space-950 border border-space-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-100">{code}</strong>
                          <span className="text-slate-400">{prod.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Precio pactado: <strong className="text-amber-300 font-mono">{price} SC/UCN</strong> (Base: {prod.baseBuyPrice} SC)
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 uppercase font-semibold">UCN:</label>
                          <input
                            type="number"
                            min={0}
                            max={maxAllowed}
                            value={currentQty}
                            onChange={e => {
                              const val = Math.max(0, Math.min(maxAllowed, Number(e.target.value)));
                              setCartQuantities({ ...cartQuantities, [code]: val });
                            }}
                            className="w-16 bg-space-900 border border-space-700 rounded p-1 text-center font-bold text-slate-100 font-mono"
                          />
                          <span className="text-[10px] text-slate-500">/ {maxAllowed}</span>
                        </div>

                        <div className="w-20 text-right font-mono font-bold text-amber-300">
                          {price * currentQty} SC
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumen de Cesta y Estiba */}
              <div className="p-4 bg-space-950 border border-space-700 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total UCN a Cargar:</span>
                  <span className={`font-bold font-mono ${!canFit ? 'text-rose-400' : 'text-slate-100'}`}>
                    {cartTotalUcn} / {availableSpace} UCN disponibles
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Coste Total de Compra:</span>
                  <span className={`font-bold font-mono text-base ${!canAfford ? 'text-rose-400' : 'text-amber-300'}`}>
                    {cartTotalCost} SC (Saldo: {company.treasury} SC)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-space-800 text-[11px] text-slate-400">
                  <span>Tiempo de Estiba ({operarios.length} operarios):</span>
                  <span className="text-sky-400 font-bold">
                    +{handling.handlingResult.daysRequired} {handling.handlingResult.daysRequired === 1 ? 'día' : 'días'} (Total operación: +{totalDaysRequired}d)
                  </span>
                </div>
              </div>

              {/* Botón de compra final */}
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={cartTotalUcn <= 0 || !canAfford || !canFit || !hasOrdersRemaining}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-space-950 font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package className="w-4 h-4" />
                <span>Confirmar Compra ({cartTotalCost} SC) y Estiba (+{totalDaysRequired}d)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
