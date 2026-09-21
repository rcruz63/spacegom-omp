/**
 * Catálogo oficial de puestos de trabajo de Spacegom.
 *
 * Cada puesto define:
 * - techLevel: Nivel tecnológico mínimo del planeta para poder contratarlo.
 *   - RUDIMENTARIO: Mundos con >1.000 hab. y nivel Rudimentario o superior.
 *   - ESPACIAL: Mundos con >1.000 hab. y nivel Espacial o superior.
 *   - AVANZADO: Mundos con >1.000 hab. y nivel Interestelar, Político o Nivel Superior.
 * - searchTimeDice: Fórmula de tirada de días para encontrar candidatos (1, 2, 1d6, 2d6, 3d6).
 * - baseSalary: Salario mensual base en SC para nivel Estándar.
 * - hireThreshold: Resultado objetivo a igualar o superar en 2D6 por el Director Gerente.
 * - description: Función y beneficio del puesto para la compañía.
 *
 * Fuente: Manual de Operaciones y documento primer_objetivo.md
 */

export interface PositionDefinition {
  title: string;
  techLevel: 'RUDIMENTARIO' | 'ESPACIAL' | 'AVANZADO';
  searchTimeDice: string; // "1", "2", "1d6", "2d6", "3d6"
  baseSalary: number;
  hireThreshold: number; // 4+, 6+, 7+, 8+, 9+
  description: string;
}

export const POSITIONS_CATALOG: Record<string, PositionDefinition> = {
  // === NIVEL RUDIMENTARIO (>1000 hab + nivel RUD o superior) ===
  'Abogado': {
    title: 'Abogado',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 5,
    hireThreshold: 8,
    description: 'Evita la pérdida mensual de 1 punto de Reputación por litigios y pleitos legales.'
  },
  'Agente secreto': {
    title: 'Agente secreto',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '2d6',
    baseSalary: 25,
    hireThreshold: 8,
    description: 'Especialista en misiones de infiltración, sabotaje y espionaje corporativo.'
  },
  'Asistente doméstico': {
    title: 'Asistente doméstico',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1',
    baseSalary: 1,
    hireThreshold: 4,
    description: 'Mantenimiento del hábitat y confort a bordo de la astronave.'
  },
  'Auxiliar de vuelo': {
    title: 'Auxiliar de vuelo',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1',
    baseSalary: 2,
    hireThreshold: 7,
    description: 'Incrementa los ingresos por transporte de pasajeros (hasta 4 SC por pasajero con 3 auxiliares).'
  },
  'Cocinero': {
    title: 'Cocinero',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 3,
    hireThreshold: 8,
    description: 'Alimentación de calidad para mantener la moral de la tripulación en viajes largos.'
  },
  'Negociador de compraventa de mercadería': {
    title: 'Negociador de compraventa de mercadería',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 10,
    hireThreshold: 8,
    description: 'Negocia los precios de compra y venta de mercancías en los mundos comerciales.'
  },
  'Operario de logística y almacén': {
    title: 'Operario de logística y almacén',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1',
    baseSalary: 1,
    hireThreshold: 6,
    description: 'Carga y descarga UCN de mercancías en el almacén de la astronave (5 a 10 UCN/día).'
  },
  'Político demagogo': {
    title: 'Político demagogo',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '2d6',
    baseSalary: 30,
    hireThreshold: 9,
    description: 'Influencia política e intermediación diplomática con autoridades planetarias.'
  },
  'Psicólogo': {
    title: 'Psicólogo',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 5,
    hireThreshold: 8,
    description: 'Asistencia y recuperación de moral para miembros de la tripulación.'
  },
  'Responsable de contabilidad y burocracia': {
    title: 'Responsable de contabilidad y burocracia',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 3,
    hireThreshold: 7,
    description: 'Reduce los costes operativos burocráticos mensuales de 20 SC a solo 4 SC.'
  },
  'Responsable de soporte a pasajeros': {
    title: 'Responsable de soporte a pasajeros',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 4,
    hireThreshold: 7,
    description: 'Gestiona y capta viajeros en los mundos visitados para transporte de pasajeros.'
  },
  'Responsable de suministros de manutención': {
    title: 'Responsable de suministros de manutención',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 3,
    hireThreshold: 7,
    description: 'Gestión de raciones, víveres y logística interna del personal.'
  },
  'Soldado mercenario': {
    title: 'Soldado mercenario',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '2',
    baseSalary: 5,
    hireThreshold: 7,
    description: 'Seguridad armada para repeler asaltos piratas y peligros en superficie.'
  },
  'Recursos Humanos': {
    title: 'Recursos Humanos',
    techLevel: 'RUDIMENTARIO',
    searchTimeDice: '1d6',
    baseSalary: 5,
    hireThreshold: 7,
    description: 'Apoyo al Director Gerente en selección, bienestar y gestión de personal.'
  },

  // === NIVEL ESPACIAL (>1000 hab + nivel ES o superior) ===
  'Ingeniero de astronavegación': {
    title: 'Ingeniero de astronavegación',
    techLevel: 'ESPACIAL',
    searchTimeDice: '2d6',
    baseSalary: 8,
    hireThreshold: 9,
    description: 'Especialista en cálculos de trayectorias sublumínicas y maniobras orbitales.'
  },
  'Ingeniero computacional': {
    title: 'Ingeniero computacional',
    techLevel: 'ESPACIAL',
    searchTimeDice: '2d6',
    baseSalary: 15,
    hireThreshold: 8,
    description: 'Mantenimiento de computadores de a bordo y sistemas de defensa electrónica.'
  },
  'Médico': {
    title: 'Médico',
    techLevel: 'ESPACIAL',
    searchTimeDice: '1d6',
    baseSalary: 7,
    hireThreshold: 8,
    description: 'Tratamiento de enfermedades, heridas y contagios locales en la tripulación.'
  },
  'Piloto': {
    title: 'Piloto',
    techLevel: 'ESPACIAL',
    searchTimeDice: '2d6',
    baseSalary: 10,
    hireThreshold: 7,
    description: 'Imprescindible para maniobras de aproximación, despegue, aterrizaje y amarre.'
  },
  'Técnico de mantenimiento de astronaves': {
    title: 'Técnico de mantenimiento de astronaves',
    techLevel: 'ESPACIAL',
    searchTimeDice: '1d6',
    baseSalary: 6,
    hireThreshold: 8,
    description: 'Previene y repara daños en el casco y componentes de la nave en el mantenimiento mensual.'
  },
  'Técnico de repostaje y análisis de combustibles': {
    title: 'Técnico de repostaje y análisis de combustibles',
    techLevel: 'ESPACIAL',
    searchTimeDice: '1d6',
    baseSalary: 7,
    hireThreshold: 8,
    description: 'Optimiza la carga y pureza del combustible en espaciopuertos.'
  },
  'Técnico de soportes vitales': {
    title: 'Técnico de soportes vitales',
    techLevel: 'ESPACIAL',
    searchTimeDice: '1d6',
    baseSalary: 5,
    hireThreshold: 7,
    description: 'Supervisión del stock y buen funcionamiento de trajes, máscaras y oxígeno.'
  },
  'Vicedirector gerente': {
    title: 'Vicedirector gerente',
    techLevel: 'ESPACIAL',
    searchTimeDice: '1d6',
    baseSalary: 20,
    hireThreshold: 7,
    description: 'Elimina las ineficiencias de gestión semanales (-8 SC) apoyando al Director Gerente.'
  },

  // === NIVEL AVANZADO (>1000 hab + nivel INT, POL o N.SUP) ===
  'Comandante de hipersaltos': {
    title: 'Comandante de hipersaltos',
    techLevel: 'AVANZADO',
    searchTimeDice: '3d6',
    baseSalary: 15,
    hireThreshold: 9,
    description: 'Coordina y ejecuta los saltos hiperespaciales entre sectores de la galaxia.'
  },
  'Científico de terraformación': {
    title: 'Científico de terraformación',
    techLevel: 'AVANZADO',
    searchTimeDice: '2d6',
    baseSalary: 8,
    hireThreshold: 9,
    description: 'Análisis medioambiental y evaluación de biomas planetarios extremos.'
  },
  'Director gerente': {
    title: 'Director gerente',
    techLevel: 'AVANZADO',
    searchTimeDice: '2d6',
    baseSalary: 20,
    hireThreshold: 7,
    description: 'Máxima autoridad ejecutiva de la compañía espacial.'
  }
};
