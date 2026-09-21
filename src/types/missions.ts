/**
 * Tipos oficiales para el Registro de Misiones de Spacegom.
 *
 * Fuente: Manual de Operaciones y documento primer_objetivo.md:
 * Hay dos tipos de misiones:
 * 1. Objetivos de Campaña: Marcados por el Libro de Campaña (Nº objetivo, Mundo aceptado, Lugar ejecución, Fecha máxima, Resultado).
 * 2. Misiones Especiales: Contratos secundarios (Código, Página libro, Mundo aceptado, Lugar ejecución, Fecha máxima, Recompensa SC, Resultado).
 */

export type MissionCategory = 'campana' | 'especial';
export type MissionStatus = 'en_curso' | 'exito' | 'fracaso';

export interface CampaignObjective {
  id: string;
  category: 'campana';
  objectiveNumber: number;
  title: string;
  description: string;
  acceptedPlanetCode: number;
  acceptedPlanetName: string;
  executionLocation: string; // ej. "Superficie de MUNDO"
  maxDate: string;           // ej. "Sin fecha límite" o fecha concreta
  status: MissionStatus;
  notes?: string;
}

export interface SpecialMission {
  id: string;
  category: 'especial';
  code: string;              // ej. "MIS-01" o código del libro
  bookPage: number;          // Página del libro donde se detalla
  title: string;
  acceptedPlanetCode: number;
  acceptedPlanetName: string;
  executionLocation: string; // Lugar donde debe ejecutarse
  maxDate: string;           // Fecha máxima
  rewardSC: number;          // Recompensa en SC
  status: MissionStatus;
  notes?: string;
}

export type GameMission = CampaignObjective | SpecialMission;
