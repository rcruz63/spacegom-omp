import { CompanyState } from '../types/company';
import { PlanetData } from '../types/universe';
import { ProductCode, TradeOrder } from '../types/trade';
import { TRADE_PRODUCTS } from '../data/tradeProducts';
import { updateEmployeeAfterRoll } from './company';

export interface BuyGoodsParams {
  productCode: ProductCode;
  ucnAmount: number;
  areaId: number;
  planet: PlanetData;
  company: CompanyState;
  negotiationRollTotal: number;
  isDoubleSix?: boolean;
  gameDate?: { year: number; month: number; day: number };
  existingOrdersCountInArea?: number;
}

/**
 * Calcula el precio unitario negociado de compra según la tirada de 2D6 del negociador.
 * Regla de Spacegom:
 * - Tirada <= 6: Precio base * 1.2 (redondeo al alza).
 * - Tirada 7-9: Precio base * 1.0.
 * - Tirada >= 10: Precio base * 0.8 (redondeo al alza).
 */
export function calculateNegotiatedBuyUnitPrice(
  baseBuyPrice: number,
  rollTotal: number
): { unitPrice: number; factor: number } {
  if (rollTotal <= 6) {
    return { unitPrice: Math.ceil(baseBuyPrice * 1.2), factor: 1.2 };
  }
  if (rollTotal >= 10) {
    return { unitPrice: Math.ceil(baseBuyPrice * 0.8), factor: 0.8 };
  }
  return { unitPrice: baseBuyPrice, factor: 1.0 };
}

/**
 * Calcula el precio unitario negociado de venta según la tirada de 2D6 del negociador.
 * Regla de Spacegom:
 * - Tirada <= 6: Precio base * 0.8 (redondeo a la baja).
 * - Tirada 7-9: Precio base * 1.0.
 * - Tirada >= 10: Precio base * 1.2 (redondeo al alza).
 */
export function calculateNegotiatedSellUnitPrice(
  baseSellPrice: number,
  rollTotal: number
): { unitPrice: number; factor: number } {
  if (rollTotal <= 6) {
    return { unitPrice: Math.floor(baseSellPrice * 0.8), factor: 0.8 };
  }
  if (rollTotal >= 10) {
    return { unitPrice: Math.ceil(baseSellPrice * 1.2), factor: 1.2 };
  }
  return { unitPrice: baseSellPrice, factor: 1.0 };
}

export function buyGoods(params: BuyGoodsParams): {
  nextCompany: CompanyState;
  order: TradeOrder;
  unitPrice: number;
  totalCost: number;
  logNotes: string[];
} {
  const { productCode, ucnAmount, areaId, planet, company, negotiationRollTotal, isDoubleSix = false } = params;
  const prod = TRADE_PRODUCTS[productCode];
  if (!prod) throw new Error(`Producto desconocido: ${productCode}`);

  const logNotes: string[] = [];
  const spaceAvailable = company.ship.warehouseMax - company.ship.warehouseOccupied;
  if (ucnAmount > spaceAvailable) {
    throw new Error(`Capacidad insuficiente en almacén (disponible: ${spaceAvailable} UCN)`);
  }

  const { unitPrice } = calculateNegotiatedBuyUnitPrice(prod.baseBuyPrice, negotiationRollTotal);
  const totalCost = unitPrice * ucnAmount;

  if (company.treasury < totalCost) {
    throw new Error(`Tesorería insuficiente (requerido: ${totalCost} SC, disponible: ${company.treasury} SC)`);
  }

  const negotiator = company.employees.find(e => e.isActive && e.position.toLowerCase().includes('compraventa'));
  let updatedEmployees = company.employees;
  if (negotiator) {
    const res = updateEmployeeAfterRoll(negotiator, negotiationRollTotal, isDoubleSix);
    updatedEmployees = company.employees.map(e => e.id === negotiator.id ? res.updatedEmployee : e);
    logNotes.push(...res.logNotes);
  }

  const order: TradeOrder = {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    areaId,
    productCode,
    productName: prod.name,
    ucnAmount,
    buyPricePerUcn: unitPrice,
    totalBuyCost: totalCost,
    buyPlanetCode: planet.code,
    buyDate: new Date().toISOString(),
    buyGameDate: params.gameDate,
    hasConvenioTraceability: planet.convenio_spacegom === 1,
    orderRowNumber: (params.existingOrdersCountInArea || 0) + 1,
    isSold: false
  };

  logNotes.push(`Compradas ${ucnAmount} UCN de ${prod.name} por ${totalCost} SC (${unitPrice} SC/UCN) en ${planet.name}.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury - totalCost,
      ship: {
        ...company.ship,
        warehouseOccupied: company.ship.warehouseOccupied + ucnAmount
      },
      employees: updatedEmployees
    },
    order,
    unitPrice,
    totalCost,
    logNotes
  };
}

export interface SellGoodsParams {
  order: TradeOrder;
  planet: PlanetData;
  company: CompanyState;
  negotiationRollTotal: number;
  isDoubleSix?: boolean;
  gameDate?: { year: number; month: number; day: number };
  ucnToSell?: number; // Para venta parcial en mundos sin convenio
}

export function sellGoods(params: SellGoodsParams): {
  nextCompany: CompanyState;
  updatedOrder: TradeOrder;
  unitPrice: number;
  totalRevenue: number;
  profit: number;
  logNotes: string[];
} {
  const { order, planet, company, negotiationRollTotal, isDoubleSix = false } = params;
  const prod = TRADE_PRODUCTS[order.productCode];
  if (!prod) throw new Error(`Producto desconocido: ${order.productCode}`);

  const logNotes: string[] = [];

  const ucnAmount = params.ucnToSell !== undefined ? Math.min(params.ucnToSell, order.ucnAmount) : order.ucnAmount;
  const { unitPrice } = calculateNegotiatedSellUnitPrice(prod.baseSellPrice, negotiationRollTotal);
  const totalRevenue = unitPrice * ucnAmount;
  const proportionalBuyCost = Math.round((order.totalBuyCost * ucnAmount) / order.ucnAmount);
  const profit = totalRevenue - proportionalBuyCost;

  const isPartial = ucnAmount < order.ucnAmount;
  // Si se vende parcialmente o en mundo sin convenio, se rompe trazabilidad
  const retainsTraceability = order.hasConvenioTraceability && planet.convenio_spacegom === 1 && !isPartial;


  const negotiator = company.employees.find(e => e.isActive && e.position.toLowerCase().includes('compraventa'));
  let updatedEmployees = company.employees;
  if (negotiator) {
    const res = updateEmployeeAfterRoll(negotiator, negotiationRollTotal, isDoubleSix);
    updatedEmployees = company.employees.map(e => e.id === negotiator.id ? res.updatedEmployee : e);
    logNotes.push(...res.logNotes);
  }

  const updatedOrder: TradeOrder = {
    ...order,
    isSold: !isPartial,
    ucnAmount: isPartial ? order.ucnAmount - ucnAmount : order.ucnAmount,
    sellPlanetCode: planet.code,
    sellPricePerUcn: unitPrice,
    totalSellRevenue: (order.totalSellRevenue || 0) + totalRevenue,
    profit: (order.profit || 0) + profit,
    sellDate: new Date().toISOString(),
    sellGameDate: params.gameDate,
    hasConvenioTraceability: retainsTraceability
  };

  logNotes.push(`Vendidas ${order.ucnAmount} UCN de ${prod.name} por ${totalRevenue} SC (${unitPrice} SC/UCN). Beneficio neto: ${profit} SC.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury + totalRevenue,
      ship: {
        ...company.ship,
        warehouseOccupied: Math.max(0, company.ship.warehouseOccupied - order.ucnAmount)
      },
      employees: updatedEmployees
    },
    updatedOrder,
    unitPrice,
    totalRevenue,
    profit,
    logNotes
  };
}

export interface PassengerFareCalculation {
  flightAttendantsCount: number;
  ratePerPassenger: number;
  baseIncome: number;
  noviceCount: number;
  noviceDiscount: number;
  veteranCount: number;
  veteranBonus: number;
  totalIncome: number;
}

export function calculatePassengerFare(
  company: CompanyState,
  passengersCount: number
): PassengerFareCalculation {
  const flightAttendants = company.employees.filter(
    e => e.isActive && e.position.toLowerCase().includes('auxiliar de vuelo')
  );

  const flightAttendantsCount = flightAttendants.length;
  let ratePerPassenger = 1;
  if (flightAttendantsCount >= 3) ratePerPassenger = 4;
  else if (flightAttendantsCount === 2) ratePerPassenger = 3;
  else if (flightAttendantsCount === 1) ratePerPassenger = 2;

  const baseIncome = passengersCount * ratePerPassenger;

  let noviceCount = 0;
  let veteranCount = 0;
  for (const att of flightAttendants) {
    if (att.experience === 'novato') noviceCount++;
    if (att.experience === 'veterano') veteranCount++;
  }

  const noviceDiscount = noviceCount * 5;
  const veteranBonus = veteranCount * 5;

  const totalIncome = Math.max(0, baseIncome - noviceDiscount + veteranBonus);

  return {
    flightAttendantsCount,
    ratePerPassenger,
    baseIncome,
    noviceCount,
    noviceDiscount,
    veteranCount,
    veteranBonus,
    totalIncome
  };
}

export interface TransportPassengersParams {
  planet: PlanetData;
  company: CompanyState;
  rollTotal: number;
  isDoubleSix?: boolean;
  selectedCount?: number;
}

export interface TransportPassengersResult {
  nextCompany: CompanyState;
  passengersAccommodated: number;
  passengersCount: number;
  passengersOffered: number;
  income: number;
  fare: PassengerFareCalculation;
  moraleChanged: boolean;
  expChanged: boolean;
  logNotes: string[];
}

export function transportPassengers(
  planetOrParams: PlanetData | TransportPassengersParams,
  legacyCompany?: CompanyState,
  legacyRollTotal?: number
): TransportPassengersResult {
  let planet: PlanetData;
  let company: CompanyState;
  let rollTotal: number;
  let isDoubleSix = false;
  let selectedCount: number | undefined;

  if ('planet' in planetOrParams) {
    planet = planetOrParams.planet;
    company = planetOrParams.company;
    rollTotal = planetOrParams.rollTotal;
    isDoubleSix = planetOrParams.isDoubleSix || false;
    selectedCount = planetOrParams.selectedCount;
  } else {
    planet = planetOrParams;
    company = legacyCompany!;
    rollTotal = legacyRollTotal!;
  }

  const logNotes: string[] = [];
  const maxPlanetPassengers = planet.max_passengers || 6;

  // Tirada de dados:
  // < 7: mitad promedio (redondeo a la baja)
  // 7-9: promedio exacto
  // >= 10: doble del promedio
  let passengersOffered = maxPlanetPassengers;
  if (rollTotal < 7) {
    passengersOffered = Math.floor(maxPlanetPassengers * 0.5);
  } else if (rollTotal >= 10) {
    passengersOffered = maxPlanetPassengers * 2;
  }

  const availableSpace = Math.max(0, company.ship.passengersMax - company.ship.passengersCurrent);
  const maxAccommodable = Math.min(availableSpace, passengersOffered);
  const passengersAccommodated = selectedCount !== undefined 
    ? Math.min(selectedCount, maxAccommodable) 
    : maxAccommodable;

  const fare = calculatePassengerFare(company, passengersAccommodated);

  // Actualizar moral y experiencia del Responsable de soporte a pasajeros
  const passengerManager = company.employees.find(
    e => e.isActive && e.position.toLowerCase().includes('soporte a pasajeros')
  );

  let updatedEmployees = [...company.employees];
  let moraleChanged = false;
  let expChanged = false;

  if (passengerManager) {
    const mRes = updateEmployeeAfterRoll(passengerManager, rollTotal, isDoubleSix);
    moraleChanged = mRes.moraleChanged;
    expChanged = mRes.expChanged;
    logNotes.push(...mRes.logNotes);

    updatedEmployees = updatedEmployees.map(e => {
      if (e.id === passengerManager.id) {
        return mRes.updatedEmployee;
      }
      return e;
    });
  }

  logNotes.push(
    `Transporte de pasajeros en ${planet.name}: ${passengersAccommodated} viajeros alojados (oferta: ${passengersOffered}, plazas libres: ${availableSpace}). Cobrado por adelantado: +${fare.totalIncome} SC (${fare.ratePerPassenger} SC/pasajero con ${fare.flightAttendantsCount} auxiliares).`
  );

  const nextCompany: CompanyState = {
    ...company,
    treasury: company.treasury + fare.totalIncome,
    ship: {
      ...company.ship,
      passengersCurrent: company.ship.passengersCurrent + passengersAccommodated
    },
    employees: updatedEmployees
  };

  return {
    nextCompany,
    passengersAccommodated,
    passengersCount: passengersAccommodated,
    passengersOffered,
    income: fare.totalIncome,
    fare,
    moraleChanged,
    expChanged,
    logNotes
  };
}
