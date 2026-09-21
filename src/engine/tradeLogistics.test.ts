import { describe, it, expect } from 'vitest';
import { 
  calculateLogisticsHandling, 
  checkProductCooldown, 
  getAreaOrdersCapacity 
} from './tradeLogistics';
import { 
  calculateNegotiatedBuyUnitPrice, 
  calculateNegotiatedSellUnitPrice, 
  sellGoods 
} from './trade';
import { PlanetData } from '../types/universe';
import { createInitialCompany } from './company';
import { PLANETS_BY_CODE } from './universe';
import { TradeOrder } from '../types/trade';
import { Employee } from '../types/company';

describe('Trade Logistics & Cooldown Engine', () => {
  describe('Warehouse Logistics Handling (Operarios)', () => {
    it('calculates 10 UCN/day for operario rolling >= 7', () => {
      const operario: Employee = {
        id: 1,
        name: 'Carlos Logística',
        position: 'Operario de logística y almacén',
        monthlySalary: 1,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      };

      // Roll 8 (sum 8 >= 7) -> 10 UCN/day. For 20 UCN -> 2 days.
      const res = calculateLogisticsHandling([operario], 20, true, { 1: 8 });
      expect(res.handlingResult.dailyCapacity).toBe(10);
      expect(res.handlingResult.daysRequired).toBe(2);
      expect(res.handlingResult.operarioRolls[0].ucnPerDay).toBe(10);
    });

    it('calculates 5 UCN/day for operario rolling < 7', () => {
      const operario: Employee = {
        id: 1,
        name: 'Carlos Logística',
        position: 'Operario de logística y almacén',
        monthlySalary: 1,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      };

      // Roll 5 (< 7) -> 5 UCN/day. For 15 UCN -> 3 days.
      const res = calculateLogisticsHandling([operario], 15, false, { 1: 5 });
      expect(res.handlingResult.dailyCapacity).toBe(5);
      expect(res.handlingResult.daysRequired).toBe(3);
      expect(res.handlingResult.operarioRolls[0].ucnPerDay).toBe(5);
    });

    it('combines capacity of multiple logistics operators', () => {
      const op1: Employee = {
        id: 1,
        name: 'Op 1',
        position: 'Operario de logística y almacén',
        monthlySalary: 1,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      };
      const op2: Employee = {
        id: 2,
        name: 'Op 2',
        position: 'Operario de logística y almacén',
        monthlySalary: 1,
        experience: 'estandar',
        morale: 'media',
        isActive: true
      };

      // Op 1 rolls 8 (10 UCN), Op 2 rolls 5 (5 UCN) -> Total capacity = 15 UCN/day.
      // 30 UCN requires 2 days.
      const res = calculateLogisticsHandling([op1, op2], 30, true, { 1: 8, 2: 5 });
      expect(res.handlingResult.dailyCapacity).toBe(15);
      expect(res.handlingResult.daysRequired).toBe(2);
    });

    it('provides fallback 5 UCN/day capacity when no logistics operators are present', () => {
      const res = calculateLogisticsHandling([], 15, true);
      expect(res.handlingResult.dailyCapacity).toBe(5);
      expect(res.handlingResult.daysRequired).toBe(3);
    });
  });

  describe('Product Cooldowns (Days to Produce / Demand)', () => {
    it('blocks buying products on cooldown and unlocks when days have passed', () => {
      // ALIM: daysToProduce = 30
      const order: TradeOrder = {
        id: 'ord_1',
        areaId: 8,
        productCode: 'ALIM',
        productName: 'Productos de alimentación',
        ucnAmount: 10,
        buyPricePerUcn: 4,
        totalBuyCost: 40,
        buyPlanetCode: 111,
        buyDate: '2880-01-01',
        buyGameDate: { year: 2880, month: 1, day: 1 },
        hasConvenioTraceability: true,
        isSold: false
      };

      // Check on Day 15 (14 days after purchase -> 16 days remaining of 30)
      const cd15 = checkProductCooldown(111, 'ALIM', true, [order], { year: 2880, month: 1, day: 15 });
      expect(cd15.isAvailable).toBe(false);
      expect(cd15.remainingDays).toBe(16);

      // Check on Day 32 (31 days after purchase -> cooldown passed)
      const cd32 = checkProductCooldown(111, 'ALIM', true, [order], { year: 2880, month: 1, day: 32 });
      expect(cd32.isAvailable).toBe(true);
      expect(cd32.remainingDays).toBe(0);
    });
  });

  describe('Area 25-Order Row Limit', () => {
    it('tracks capacity up to 25 orders per area', () => {
      const orders: TradeOrder[] = Array.from({ length: 24 }, (_, i) => ({
        id: `ord_${i}`,
        areaId: 5,
        productCode: 'INDU',
        productName: 'Industriales',
        ucnAmount: 5,
        buyPricePerUcn: 9,
        totalBuyCost: 45,
        buyPlanetCode: 111,
        buyDate: '2880-01-01',
        hasConvenioTraceability: true,
        isSold: false
      }));

      const cap24 = getAreaOrdersCapacity(orders, 5);
      expect(cap24.currentCount).toBe(24);
      expect(cap24.availableSlots).toBe(1);
      expect(cap24.isFull).toBe(false);

      orders.push({ ...orders[0], id: 'ord_25' });
      const cap25 = getAreaOrdersCapacity(orders, 5);
      expect(cap25.currentCount).toBe(25);
      expect(cap25.availableSlots).toBe(0);
      expect(cap25.isFull).toBe(true);
    });
  });

  describe('Price Negotiation Factors', () => {
    it('applies buy price multipliers: <=6 x1.2, 7-9 x1.0, >=10 x0.8', () => {
      // Base buy for INDU is 9 SC
      const low = calculateNegotiatedBuyUnitPrice(9, 5);
      expect(low.unitPrice).toBe(11); // ceil(9 * 1.2) = 11

      const mid = calculateNegotiatedBuyUnitPrice(9, 8);
      expect(mid.unitPrice).toBe(9);

      const high = calculateNegotiatedBuyUnitPrice(9, 11);
      expect(high.unitPrice).toBe(8); // ceil(9 * 0.8) = 8
    });

    it('applies sell price multipliers: <=6 x0.8, 7-9 x1.0, >=10 x1.2', () => {
      // Base sell for INDU is 18 SC
      const low = calculateNegotiatedSellUnitPrice(18, 5);
      expect(low.unitPrice).toBe(14); // floor(18 * 0.8) = 14

      const mid = calculateNegotiatedSellUnitPrice(18, 8);
      expect(mid.unitPrice).toBe(18);

      const high = calculateNegotiatedSellUnitPrice(18, 11);
      expect(high.unitPrice).toBe(22); // ceil(18 * 1.2) = 22
    });
  });

  describe('Traceability and Spacegom Universal Agreement', () => {
    it('preserves traceability when selling full order on a Convenio world', () => {
      const comp = createInitialCompany();
      const planetWithConvenio: PlanetData = {
        ...PLANETS_BY_CODE[111],
        convenio_spacegom: 1
      };

      const order: TradeOrder = {
        id: 'ord_full',
        areaId: 8,
        productCode: 'INDU',
        productName: 'Industriales',
        ucnAmount: 10,
        buyPricePerUcn: 9,
        totalBuyCost: 90,
        buyPlanetCode: 111,
        buyDate: '2880-01-01',
        hasConvenioTraceability: true,
        isSold: false
      };

      const res = sellGoods({
        order,
        planet: planetWithConvenio,
        company: comp,
        negotiationRollTotal: 8
      });

      expect(res.updatedOrder.isSold).toBe(true);
      expect(res.updatedOrder.hasConvenioTraceability).toBe(true);
      expect(res.profit).toBe(res.totalRevenue - 90);
    });

    it('breaks traceability when performing partial sale or selling on non-convenio world', () => {
      const comp = createInitialCompany();
      const planetWithoutConvenio: PlanetData = {
        ...PLANETS_BY_CODE[111],
        convenio_spacegom: 0 // Non-convenio
      };

      const order: TradeOrder = {
        id: 'ord_partial',
        areaId: 8,
        productCode: 'INDU',
        productName: 'Industriales',
        ucnAmount: 10,
        buyPricePerUcn: 9,
        totalBuyCost: 90,
        buyPlanetCode: 111,
        buyDate: '2880-01-01',
        hasConvenioTraceability: true,
        isSold: false
      };

      // Sell 4 UCN out of 10
      const res = sellGoods({
        order,
        planet: planetWithoutConvenio,
        company: comp,
        negotiationRollTotal: 8,
        ucnToSell: 4
      });

      // Partial sale keeps order unsold with 6 UCN remaining, but loses traceability
      expect(res.updatedOrder.isSold).toBe(false);
      expect(res.updatedOrder.ucnAmount).toBe(6);
      expect(res.updatedOrder.hasConvenioTraceability).toBe(false);
    });
  });
});
