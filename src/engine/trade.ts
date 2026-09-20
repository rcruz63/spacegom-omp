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

  // Factor de negociación: <=6 -> x1.2 (redondeo alza); 7-9 -> x1.0; >=10 -> x0.8 (redondeo alza)
  let factor = 1.0;
  if (negotiationRollTotal <= 6) {
    factor = 1.2;
  } else if (negotiationRollTotal >= 10) {
    factor = 0.8;
  }

  const unitPrice = Math.ceil(prod.baseBuyPrice * factor);
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

  // Factor venta: <=6 -> x0.8 (redondeo baja); 7-9 -> x1.0; >=10 -> x1.2 (redondeo alza)
  let unitPrice = prod.baseSellPrice;
  if (negotiationRollTotal <= 6) {
    unitPrice = Math.floor(prod.baseSellPrice * 0.8);
  } else if (negotiationRollTotal >= 10) {
    unitPrice = Math.ceil(prod.baseSellPrice * 1.2);
  }

  const totalRevenue = unitPrice * order.ucnAmount;
  const profit = totalRevenue - order.totalBuyCost;

  const negotiator = company.employees.find(e => e.isActive && e.position.toLowerCase().includes('compraventa'));
  let updatedEmployees = company.employees;
  if (negotiator) {
    const res = updateEmployeeAfterRoll(negotiator, negotiationRollTotal, isDoubleSix);
    updatedEmployees = company.employees.map(e => e.id === negotiator.id ? res.updatedEmployee : e);
    logNotes.push(...res.logNotes);
  }

  const updatedOrder: TradeOrder = {
    ...order,
    isSold: true,
    sellPlanetCode: planet.code,
    sellPricePerUcn: unitPrice,
    totalSellRevenue: totalRevenue,
    sellDate: new Date().toISOString()
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

export function transportPassengers(
  planet: PlanetData,
  company: CompanyState,
  rollTotal: number
): {
  nextCompany: CompanyState;
  passengersCount: number;
  income: number;
  logNotes: string[];
} {
  const logNotes: string[] = [];
  const maxPlanetPassengers = planet.max_passengers || 6;

  let passengerRatio = 1.0;
  if (rollTotal <= 6) {
    passengerRatio = 0.5;
  } else if (rollTotal >= 10) {
    passengerRatio = 1.5;
  }

  const availableSpace = company.ship.passengersMax;
  const calculatedCount = Math.floor(maxPlanetPassengers * passengerRatio);
  const passengersCount = Math.min(availableSpace, Math.max(1, calculatedCount));

  // Cálculo de tarifa por auxiliares de vuelo:
  // 3 auxiliares: 4 SC/pasajero; 2 aux: 3 SC; 1 aux: 2 SC; 0 aux: 1 SC.
  const flightAttendants = company.employees.filter(e => e.isActive && e.position.toLowerCase().includes('auxiliar de vuelo'));
  let ratePerPassenger = 1;
  if (flightAttendants.length >= 3) ratePerPassenger = 4;
  else if (flightAttendants.length === 2) ratePerPassenger = 3;
  else if (flightAttendants.length === 1) ratePerPassenger = 2;

  let baseIncome = passengersCount * ratePerPassenger;

  // Modificadores por experiencia de los auxiliares:
  // Novatos: -2 SC cada uno. Veteranos: +5 SC cada uno (máx 3).
  for (const att of flightAttendants.slice(0, 3)) {
    if (att.experience === 'novato') baseIncome = Math.max(0, baseIncome - 2);
    if (att.experience === 'veterano') baseIncome += 5;
  }

  logNotes.push(`Transporte de ${passengersCount} pasajeros en ${planet.name}. Ingreso cobrado por adelantado: +${baseIncome} SC.`);

  return {
    nextCompany: {
      ...company,
      treasury: company.treasury + baseIncome
    },
    passengersCount,
    income: baseIncome,
    logNotes
  };
}
