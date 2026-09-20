import { ProductCode, ProductDefinition } from '../types/trade';

export const TRADE_PRODUCTS: Record<ProductCode, ProductDefinition> = {
  INDU: {
    code: 'INDU',
    name: 'Productos industriales y manufacturados comunes',
    baseBuyPrice: 9,
    baseSellPrice: 18,
    daysToProduce: 30,
    daysToDemand: 50
  },
  BASI: {
    code: 'BASI',
    name: 'Metal, plásticos, químicos y materiales básicos',
    baseBuyPrice: 11,
    baseSellPrice: 21,
    daysToProduce: 40,
    daysToDemand: 50
  },
  ALIM: {
    code: 'ALIM',
    name: 'Productos de alimentación',
    baseBuyPrice: 4,
    baseSellPrice: 11,
    daysToProduce: 30,
    daysToDemand: 40
  },
  MADE: {
    code: 'MADE',
    name: 'Madera y derivados',
    baseBuyPrice: 6,
    baseSellPrice: 17,
    daysToProduce: 30,
    daysToDemand: 50
  },
  AGUA: {
    code: 'AGUA',
    name: 'Agua potable',
    baseBuyPrice: 2,
    baseSellPrice: 5,
    daysToProduce: 20,
    daysToDemand: 20
  },
  MICO: {
    code: 'MICO',
    name: 'Minerales comunes',
    baseBuyPrice: 5,
    baseSellPrice: 9,
    daysToProduce: 30,
    daysToDemand: 50
  },
  MIRA: {
    code: 'MIRA',
    name: 'Minerales raros y materias primas poco comunes',
    baseBuyPrice: 13,
    baseSellPrice: 30,
    daysToProduce: 50,
    daysToDemand: 60
  },
  MIPR: {
    code: 'MIPR',
    name: 'Metales preciosos, diamantes, gemas',
    baseBuyPrice: 20,
    baseSellPrice: 60,
    daysToProduce: 80,
    daysToDemand: 80
  },
  PAVA: {
    code: 'PAVA',
    name: 'Productos avanzados, robótica, ordenadores',
    baseBuyPrice: 15,
    baseSellPrice: 30,
    daysToProduce: 40,
    daysToDemand: 60
  },
  A: {
    code: 'A',
    name: 'Armas hasta etapa espacial',
    baseBuyPrice: 7,
    baseSellPrice: 15,
    daysToProduce: 40,
    daysToDemand: 40
  },
  AE: {
    code: 'AE',
    name: 'Armas a partir de etapa espacial',
    baseBuyPrice: 10,
    baseSellPrice: 23,
    daysToProduce: 60,
    daysToDemand: 60
  },
  AEI: {
    code: 'AEI',
    name: 'Armas modernas etapa interestelar',
    baseBuyPrice: 20,
    baseSellPrice: 45,
    daysToProduce: 80,
    daysToDemand: 80
  },
  COM: {
    code: 'COM',
    name: 'Combustible para astronavegación',
    baseBuyPrice: 4,
    baseSellPrice: 7,
    daysToProduce: 30,
    daysToDemand: 20
  }
};
