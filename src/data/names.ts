import companyNamesJson from './companyNames.json';
import shipNamesJson from './shipNames.json';
import personnelNamesJson from './personnelNames.json';

export const COMPANY_NAMES: string[] = companyNamesJson;
export const SHIP_NAMES: string[] = shipNamesJson;
export const PERSONNEL_NAMES: string[] = personnelNamesJson;

/**
 * Obtiene un nombre aleatorio de la lista
 */
export function getRandomItem<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

/**
 * Obtiene N nombres aleatorios y únicos de una lista (evita repeticiones en la misma partida)
 */
export function getUniqueRandomItems<T>(items: T[], count: number, exclude: T[] = []): T[] {
  const available = items.filter(item => !exclude.includes(item));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
