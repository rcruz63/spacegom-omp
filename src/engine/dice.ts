import { DiceRollResult, DiceModifier } from '../types/common';

export interface RollOptions {
  diceCount?: number;
  sides?: number;
  modifiers?: DiceModifier[];
  manualRolls?: number[];
  reason?: string;
  randomFn?: () => number;
}

export function rollDice(options: RollOptions = {}): DiceRollResult {
  const {
    diceCount = 2,
    sides = 6,
    modifiers = [],
    manualRolls,
    reason = 'Tirada de dados',
    randomFn = Math.random
  } = options;

  let rolls: number[] = [];
  const isManual = Array.isArray(manualRolls) && manualRolls.length === diceCount;

  if (isManual) {
    rolls = manualRolls.map(r => Math.max(1, Math.min(sides, Math.floor(r))));
  } else {
    for (let i = 0; i < diceCount; i++) {
      rolls.push(Math.floor(randomFn() * sides) + 1);
    }
  }

  const sum = rolls.reduce((acc, val) => acc + val, 0);
  const modTotal = modifiers.reduce((acc, m) => acc + m.value, 0);
  const total = sum + modTotal;

  const isDoubleSix = diceCount === 2 && rolls[0] === 6 && rolls[1] === 6;
  const isNaturalSnakeEyes = diceCount === 2 && rolls[0] === 1 && rolls[1] === 1;

  return {
    diceCount,
    sides,
    rolls,
    sum,
    modifiers,
    total,
    isDoubleSix,
    isNaturalSnakeEyes,
    isManual,
    timestamp: new Date().toISOString(),
    reason
  };
}

export function rollD6(reason?: string, manualRoll?: number): DiceRollResult {
  return rollDice({
    diceCount: 1,
    sides: 6,
    manualRolls: manualRoll !== undefined ? [manualRoll] : undefined,
    reason: reason || 'Tirada 1D6'
  });
}

export function roll2D6(modifiers: DiceModifier[] = [], reason?: string, manualRolls?: [number, number]): DiceRollResult {
  return rollDice({
    diceCount: 2,
    sides: 6,
    modifiers,
    manualRolls,
    reason: reason || 'Tirada 2D6'
  });
}
