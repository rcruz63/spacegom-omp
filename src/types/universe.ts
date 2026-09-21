export interface PlanetData {
  code: number;
  name: string;
  life_support: string;
  local_contagion_risk: number;
  days_to_hyperspace: number;
  legal_order_threshold: number;
  spaceport_quality: string;
  fuel_density: string;
  docking_price: number;
  orbital_cartography_center: number;
  orbital_hackers: number;
  orbital_supply_depot: number;
  orbital_astro_academy: number;
  product_indu: number;
  product_basi: number;
  product_alim: number;
  product_made: number;
  product_agua: number;
  product_mico: number;
  product_mira: number;
  product_mipr: number;
  product_pava: number;
  product_a: number;
  product_ae: number;
  product_aei: number;
  product_com: number;
  self_sufficiency_level: string;
  ucn_per_order: number;
  max_passengers: number;
  mission_threshold: number;
  tech_level: string;
  population_over_1000: number;
  convenio_spacegom: number;
  notes: string | null;
  is_custom: number;
}

export interface SectorQuadrant {
  col: string; // 'A' - 'F'
  row: number; // 1 - 6
  isConfigured: boolean;
  planetCode: number | null;
  hasPirates?: boolean;
  hasMegacorp?: boolean;
}

export interface SectorArea {
  id: number; // 2 - 12
  density: 'Baja' | 'Media' | 'Alta';
  quadrants: Record<string, SectorQuadrant>; // key: 'A1', 'B3', etc.
  discoveredPlanets: number[]; // planet codes discovered in this area
}

export interface UniverseState {
  currentAreaId: number;
  currentCol: string;
  currentRow: number;
  currentPlanetCode: number | null;
  currentLocation: 'mundo' | 'espaciopuerto' | 'instalacion_orbital' | 'estacion_hiperdisparo' | 'en_transito_hiperdisparo';
  areas: Record<number, SectorArea>;
  usedPlanetCodes: number[]; // across the whole game
  passengersTakenInCurrentVisit?: boolean;
  originPlanetCode?: number;
  originAreaId?: number;
  originCol?: string;
  originRow?: number;
}
