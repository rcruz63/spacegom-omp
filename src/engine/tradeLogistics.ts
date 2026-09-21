import { Employee } from '../types/company';
import { PlanetData } from '../types/universe';
import { GameDate } from '../types/common';
import { 
  ProductCode, 
  TradeOrder, 
  CargoHandlingResult, 
  MAX_ORDERS_PER_AREA 
} from '../types/trade';
import { TRADE_PRODUCTS } from '../data/tradeProducts';
import { dateToAbsoluteDays } from './calendar';
import { rollDice } from './dice';
import { updateEmployeeAfterRoll } from './company';

/**
 * Calcula los días y capacidad de estiba de almacén para carga o descarga de mercancías.
 * 
 * Regla de Spacegom:
 * Cada Operario de logística y almacén activo realiza una tirada de 2D6 + mods:
 * - Tirada >= 7: Carga/descarga 10 UCN en 1 día. Posible subida de moral/experiencia.
 * - Tirada < 7: Carga/descarga 5 UCN en 1 día. Posible pérdida de moral.
 * Si no hay operarios en plantilla, la capacidad es de 5 UCN/día por esfuerzo de la tripulación.
 *
 * @param employees Lista de empleados de la compañía
 * @param totalUcn Cantidad total de UCN a mover
 * @param isLoad true para cargar en bodega, false para descargar
 * @param manualRolls Tiradas manuales opcionales por id de empleado
 */
export function calculateLogisticsHandling(
  employees: Employee[],
  totalUcn: number,
  isLoad = true,
  manualRolls?: Record<number, number>
): {
  handlingResult: CargoHandlingResult;
  updatedEmployees: Employee[];
} {
  if (totalUcn <= 0) {
    return {
      handlingResult: {
        totalUcn: 0,
        daysRequired: 0,
        operariosCount: 0,
        dailyCapacity: 0,
        operarioRolls: [],
        logNotes: ['Sin mercancía para estibar.']
      },
      updatedEmployees: employees
    };
  }

  const operarios = employees.filter(
    e => e.isActive && e.position.toLowerCase().includes('logística y almacén')
  );

  const operarioRolls: CargoHandlingResult['operarioRolls'] = [];
  const logNotes: string[] = [];
  let updatedEmployees = [...employees];
  let dailyCapacity = 0;

  if (operarios.length === 0) {
    // Sin operario especialista: capacidad básica de 5 UCN por día
    dailyCapacity = 5;
    logNotes.push('Sin operarios de logística: La tripulación carga a ritmo básico de 5 UCN/día.');
  } else {
    for (const op of operarios) {
      const manual = manualRolls ? manualRolls[op.id] : undefined;
      const rollRes = manual !== undefined 
        ? { sum: manual, isDoubleSix: manual === 12 } 
        : rollDice({ diceCount: 2 });

      let expMod = 0;
      let morMod = 0;
      if (op.experience === 'veterano') expMod = 1;
      if (op.experience === 'novato') expMod = -1;
      if (op.morale === 'alta') morMod = 1;
      if (op.morale === 'baja') morMod = -1;

      const totalRoll = rollRes.sum + expMod + morMod;
      const ucnPerDay = totalRoll >= 7 ? 10 : 5;
      dailyCapacity += ucnPerDay;

      // Actualizar moral y experiencia del operario
      const updateRes = updateEmployeeAfterRoll(op, totalRoll, rollRes.isDoubleSix);
      logNotes.push(...updateRes.logNotes);

      updatedEmployees = updatedEmployees.map(e => {
        if (e.id === op.id) return updateRes.updatedEmployee;
        return e;
      });

      operarioRolls.push({
        operarioId: op.id,
        operarioName: op.name,
        rollSum: totalRoll,
        ucnPerDay
      });

      logNotes.push(
        `${op.name}: Tirada ${totalRoll} -> Estiba ${ucnPerDay} UCN/día (${isLoad ? 'carga' : 'descarga'}).`
      );
    }
  }

  const daysRequired = Math.max(1, Math.ceil(totalUcn / dailyCapacity));
  const actionLabel = isLoad ? 'Carga en bodega' : 'Descarga de bodega';
  logNotes.push(
    `${actionLabel} de ${totalUcn} UCN completada en ${daysRequired} ${daysRequired === 1 ? 'día' : 'días'} (capacidad diaria: ${dailyCapacity} UCN/día).`
  );

  return {
    handlingResult: {
      totalUcn,
      daysRequired,
      operariosCount: operarios.length,
      dailyCapacity,
      operarioRolls,
      logNotes
    },
    updatedEmployees
  };
}

/**
 * Comprueba el cooldown de producción o demanda de un producto en un planeta específico.
 * 
 * Regla de Spacegom:
 * - Compra: No se pueden comprar productos adquiridos recientemente hasta que transcurran
 *   los "días hasta que un mundo vuelve a producir ese producto" (daysToProduce).
 * - Venta: No se pueden vender productos comercializados recientemente hasta que transcurran
 *   los "días hasta que un mundo vuelve a necesitarlo" (daysToDemand).
 */
export function checkProductCooldown(
  planetCode: number,
  productCode: ProductCode,
  isBuy: boolean,
  orders: TradeOrder[],
  currentDate: GameDate
): {
  isAvailable: boolean;
  remainingDays: number;
  lastDate?: GameDate;
} {
  const prod = TRADE_PRODUCTS[productCode];
  if (!prod) {
    return { isAvailable: false, remainingDays: 0 };
  }

  const cooldownDays = isBuy ? prod.daysToProduce : prod.daysToDemand;
  const currentAbs = dateToAbsoluteDays(currentDate);

  // Buscar el pedido más reciente de este producto en este planeta
  let lastMatchingDate: GameDate | undefined = undefined;
  let minDaysDiff = Infinity;

  for (const order of orders) {
    if (order.productCode !== productCode) continue;

    if (isBuy && order.buyPlanetCode === planetCode && order.buyGameDate) {
      const orderAbs = dateToAbsoluteDays(order.buyGameDate);
      const diff = currentAbs - orderAbs;
      if (diff >= 0 && diff < minDaysDiff) {
        minDaysDiff = diff;
        lastMatchingDate = order.buyGameDate;
      }
    } else if (!isBuy && order.sellPlanetCode === planetCode && order.sellGameDate) {
      const orderAbs = dateToAbsoluteDays(order.sellGameDate);
      const diff = currentAbs - orderAbs;
      if (diff >= 0 && diff < minDaysDiff) {
        minDaysDiff = diff;
        lastMatchingDate = order.sellGameDate;
      }
    }
  }

  if (!lastMatchingDate || minDaysDiff >= cooldownDays) {
    return { isAvailable: true, remainingDays: 0, lastDate: lastMatchingDate };
  }

  return {
    isAvailable: false,
    remainingDays: cooldownDays - minDaysDiff,
    lastDate: lastMatchingDate
  };
}

/**
 * Obtiene el estado de ocupación de las 25 filas de la tabla de pedidos del Área.
 *
 * Regla de Spacegom:
 * Cada Área espacial cuenta con una tabla de 25 filas para pedidos.
 * Si se agotan las 25 filas, no se pueden realizar nuevas compras salvo que se acumulen
 * sobre un pedido previo no vendido del mismo producto (rompiendo trazabilidad).
 */
export function getAreaOrdersCapacity(
  orders: TradeOrder[],
  areaId: number
): {
  currentCount: number;
  maxAllowed: number;
  isFull: boolean;
  availableSlots: number;
} {
  // Contar cuántos pedidos registrados pertenecen a esta área
  const areaOrders = orders.filter(o => o.areaId === areaId);
  const currentCount = areaOrders.length;
  const maxAllowed = MAX_ORDERS_PER_AREA;
  const isFull = currentCount >= maxAllowed;

  return {
    currentCount,
    maxAllowed,
    isFull,
    availableSlots: Math.max(0, maxAllowed - currentCount)
  };
}

export interface PlanetProductMarketInfo {
  code: ProductCode;
  name: string;
  isProduced: boolean; // Si el mundo lo produce (se puede comprar)
  isDemanded: boolean; // Si el mundo lo demanda (se puede vender)
  baseBuyPrice: number;
  baseSellPrice: number;
  maxUcnPerVisit: number;
  isAvailableForTrade: boolean;
  cooldownRemainingDays: number;
}

/**
 * Extrae la lista de productos producidos y demandados de un planeta con sus cooldowns.
 */
export function getPlanetMarketProducts(
  planet: PlanetData,
  orders: TradeOrder[],
  currentDate: GameDate
): {
  producible: PlanetProductMarketInfo[];
  demanded: PlanetProductMarketInfo[];
} {
  const maxUcn = planet.ucn_per_order || 10;
  const producible: PlanetProductMarketInfo[] = [];
  const demanded: PlanetProductMarketInfo[] = [];

  const checkFlag = (key: string): boolean => {
    return Boolean((planet as unknown as Record<string, unknown>)[key]);
  };

  const productFlags: Record<ProductCode, string> = {
    INDU: 'product_indu',
    BASI: 'product_basi',
    ALIM: 'product_alim',
    MADE: 'product_made',
    AGUA: 'product_agua',
    MICO: 'product_mico',
    MIRA: 'product_mira',
    MIPR: 'product_mipr',
    PAVA: 'product_pava',
    A: 'product_a',
    AE: 'product_ae',
    AEI: 'product_aei',
    COM: 'product_com'
  };

  for (const [codeStr, flagKey] of Object.entries(productFlags)) {
    const code = codeStr as ProductCode;
    const prod = TRADE_PRODUCTS[code];
    const produces = checkFlag(flagKey);

    if (produces) {
      const cd = checkProductCooldown(planet.code, code, true, orders, currentDate);
      producible.push({
        code,
        name: prod.name,
        isProduced: true,
        isDemanded: false,
        baseBuyPrice: prod.baseBuyPrice,
        baseSellPrice: prod.baseSellPrice,
        maxUcnPerVisit: maxUcn,
        isAvailableForTrade: cd.isAvailable,
        cooldownRemainingDays: cd.remainingDays
      });
    } else {
      const cd = checkProductCooldown(planet.code, code, false, orders, currentDate);
      demanded.push({
        code,
        name: prod.name,
        isProduced: false,
        isDemanded: true,
        baseBuyPrice: prod.baseBuyPrice,
        baseSellPrice: prod.baseSellPrice,
        maxUcnPerVisit: maxUcn,
        isAvailableForTrade: cd.isAvailable,
        cooldownRemainingDays: cd.remainingDays
      });
    }
  }

  return { producible, demanded };
}
