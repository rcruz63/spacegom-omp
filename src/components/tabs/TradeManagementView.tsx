import { useState } from 'react';
import { GameSave } from '../../types/game';
import { ProductCode } from '../../types/trade';
import { TRADE_PRODUCTS } from '../../data/tradeProducts';
import { buyGoods, sellGoods, transportPassengers } from '../../engine/trade';
import { PLANETS_BY_CODE } from '../../engine/universe';
import { ShoppingCart, Users } from 'lucide-react';

interface TradeManagementViewProps {
  game: GameSave;
  onUpdateGame: (game: GameSave) => void;
}

export function TradeManagementView({ game, onUpdateGame }: TradeManagementViewProps) {
  const currentPlanet = game.universe.currentPlanetCode ? PLANETS_BY_CODE[game.universe.currentPlanetCode] : null;

  const [selectedProduct, setSelectedProduct] = useState<ProductCode>('INDU');
  const [buyUcnAmount, setBuyUcnAmount] = useState<number>(10);
  const [negotiationRoll, setNegotiationRoll] = useState<number>(8);

  const availableSpace = game.company.ship.warehouseMax - game.company.ship.warehouseOccupied;
  const activeOrders = game.tradeOrders.filter(o => !o.isSold);

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlanet) {
      alert('Debes estar en un planeta con comercio para comprar');
      return;
    }

    try {
      const res = buyGoods({
        productCode: selectedProduct,
        ucnAmount: buyUcnAmount,
        areaId: game.universe.currentAreaId,
        planet: currentPlanet,
        company: game.company,
        negotiationRollTotal: negotiationRoll
      });

      const updatedLog = [
        {
          id: `log_buy_${Date.now()}`,
          gameDate: game.date,
          category: 'comercio' as const,
          action: 'Compra de Mercancías',
          details: res.logNotes.join(' '),
          timestamp: new Date().toISOString()
        },
        ...game.auditLog
      ];

      onUpdateGame({
        ...game,
        company: res.nextCompany,
        tradeOrders: [res.order, ...game.tradeOrders],
        auditLog: updatedLog
      });

      alert(`¡Compra realizada con éxito! Coste: ${res.totalCost} SC.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  const handleSell = (orderId: string) => {
    if (!currentPlanet) {
      alert('Debes estar en un planeta para vender');
      return;
    }

    const order = game.tradeOrders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const res = sellGoods({
        order,
        planet: currentPlanet,
        company: game.company,
        negotiationRollTotal: negotiationRoll
      });

      const updatedLog = [
        {
          id: `log_sell_${Date.now()}`,
          gameDate: game.date,
          category: 'comercio' as const,
          action: 'Venta de Mercancías',
          details: res.logNotes.join(' '),
          timestamp: new Date().toISOString()
        },
        ...game.auditLog
      ];

      const updatedOrders = game.tradeOrders.map(o => o.id === orderId ? res.updatedOrder : o);

      onUpdateGame({
        ...game,
        company: res.nextCompany,
        tradeOrders: updatedOrders,
        auditLog: updatedLog
      });

      alert(`¡Venta completada! Ingreso: ${res.totalRevenue} SC (Beneficio: ${res.profit} SC).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  const handleTransportPassengers = () => {
    if (!currentPlanet) {
      alert('Debes estar en un planeta con aforo de viajeros');
      return;
    }

    try {
      const res = transportPassengers(currentPlanet, game.company, negotiationRoll);
      const updatedLog = [
        {
          id: `log_pass_${Date.now()}`,
          gameDate: game.date,
          category: 'comercio' as const,
          action: 'Transporte de Pasajeros',
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

      alert(`¡Pasajeros embarcados! Se han cobrado ${res.income} SC por adelantado.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Espacio en Bodega / Almacén
          </span>
          <p className="text-2xl font-black text-slate-100">
            {game.company.ship.warehouseOccupied} / {game.company.ship.warehouseMax} UCN
          </p>
          <p className="text-xs text-space-accent mt-1">{availableSpace} UCN libres para cargar</p>
        </div>

        <div className="bg-space-800 border border-space-700 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Mercancías en Tránsito
          </span>
          <p className="text-2xl font-black text-amber-300">
            {activeOrders.length} pedidos
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Inversión retenida: {activeOrders.reduce((sum, o) => sum + o.totalBuyCost, 0)} SC
          </p>
        </div>

        <div className="bg-space-800 border border-space-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Pasajeros en {currentPlanet ? currentPlanet.name : 'Sector'}
            </span>
            <p className="text-xl font-bold text-emerald-400">
              {currentPlanet ? `${currentPlanet.max_passengers} personas máx.` : 'No disponible'}
            </p>
          </div>
          {currentPlanet && (
            <button
              onClick={handleTransportPassengers}
              className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow"
            >
              <Users className="w-4 h-4" />
              <span>Embarcar Pasajeros (Cobro Anticipado)</span>
            </button>
          )}
        </div>
      </div>

      {/* Buy Merchandise Form */}
      {currentPlanet ? (
        <div className="bg-space-800 border border-space-700 rounded-xl p-6 shadow-xl">
          <h3 className="text-md font-bold text-slate-100 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-space-accent" />
            <span>Comprar Mercancías en {currentPlanet.name}</span>
          </h3>

          <form onSubmit={handleBuy} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Tipo de Producto
              </label>
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value as ProductCode)}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                {Object.values(TRADE_PRODUCTS).map(p => (
                  <option key={p.code} value={p.code}>
                    {p.code} - {p.name} (Base: {p.baseBuyPrice} SC)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Cantidad a Comprar (UCN)
              </label>
              <input
                type="number"
                min="1"
                max={availableSpace}
                value={buyUcnAmount}
                onChange={e => setBuyUcnAmount(Number(e.target.value))}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Tirada Negociador (2D6 + mods)
              </label>
              <input
                type="number"
                min="2"
                max="15"
                value={negotiationRoll}
                onChange={e => setNegotiationRoll(Number(e.target.value))}
                className="w-full bg-space-900 border border-space-600 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {'<=6: +20% coste | 7-9: base | >=10: -20% descuento'}
              </span>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={availableSpace <= 0}
                className="w-full py-2 bg-space-accent hover:bg-sky-400 disabled:opacity-50 text-space-900 font-bold text-xs rounded-lg transition-colors shadow"
              >
                Efectuar Compra de Mercancía
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-space-800/60 border border-space-700 rounded-xl text-center text-xs text-slate-400">
          Navega a un planeta para comprar o vender productos comerciales.
        </div>
      )}

      {/* Active Orders in Cargo */}
      <div className="bg-space-800 border border-space-700 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-space-700 flex justify-between items-center">
          <h3 className="text-md font-bold text-slate-100">Mercancías en Almacén (Listas para Vender)</h3>
          <span className="text-xs text-slate-400">{activeOrders.length} pedidos almacenados</span>
        </div>

        {activeOrders.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">Bodega vacía. No tienes mercancías para vender.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-space-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-space-700">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">UCN</th>
                  <th className="py-3 px-4">Precio Compra</th>
                  <th className="py-3 px-4">Coste Total</th>
                  <th className="py-3 px-4">Precio Base Venta</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-700/60 text-slate-200">
                {activeOrders.map(order => {
                  const prod = TRADE_PRODUCTS[order.productCode];
                  return (
                    <tr key={order.id} className="hover:bg-space-700/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {order.productCode} - {order.productName}
                      </td>
                      <td className="py-3 px-4 font-mono">{order.ucnAmount} UCN</td>
                      <td className="py-3 px-4 font-mono text-amber-300">{order.buyPricePerUcn} SC</td>
                      <td className="py-3 px-4 font-mono text-amber-300 font-bold">{order.totalBuyCost} SC</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{prod.baseSellPrice} SC/UCN</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSell(order.id)}
                          disabled={!currentPlanet}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded text-[11px] shadow"
                        >
                          Vender Aquí
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
