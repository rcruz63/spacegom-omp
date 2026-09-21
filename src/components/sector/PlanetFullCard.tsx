import { PlanetData } from '../../types/universe';
import { TRADE_PRODUCTS } from '../../data/tradeProducts';
import { ProductCode } from '../../types/trade';
import { 
  Globe, 
  Star, 
  Fuel, 
  Package, 
  AlertTriangle, 
  ScrollText, 
  CheckCircle2
} from 'lucide-react';

interface PlanetFullCardProps {
  planet: PlanetData;
  isOriginPlanet?: boolean;
  isCurrentPlanet?: boolean;
  titlePrefix?: string;
}

const ALL_PRODUCT_CODES: ProductCode[] = [
  'INDU', 'BASI', 'ALIM', 'MADE', 'AGUA', 'MICO', 'MIRA', 
  'MIPR', 'PAVA', 'A', 'AE', 'AEI', 'COM'
];

export function PlanetFullCard({
  planet,
  isOriginPlanet = false,
  isCurrentPlanet = false,
  titlePrefix = 'Ficha del Planeta'
}: PlanetFullCardProps) {
  const checkProductProduces = (code: ProductCode): boolean => {
    const key = `product_${code.toLowerCase()}`;
    return Boolean((planet as unknown as Record<string, unknown>)[key]);
  };

  return (
    <div className="bg-space-900 border border-space-700 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Cabecera del Planeta */}
      <div className="flex items-start justify-between pb-3 border-b border-space-800">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            {titlePrefix}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <Globe className="w-5 h-5 text-space-accent" />
            <h3 className="text-lg font-black text-slate-100">{planet.name}</h3>
            <span className="px-2 py-0.5 rounded bg-space-800 border border-space-600 font-mono font-bold text-xs text-space-accent">
              #{planet.code}
            </span>

            {isOriginPlanet && (
              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-[10px] flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Base Natal</span>
              </span>
            )}

            {isCurrentPlanet && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold">
                Aquí Ahora
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Nivel Tecnológico:</span>
          <span className="text-xs font-bold text-slate-200">{planet.tech_level || 'Estándar'}</span>
        </div>
      </div>

      {/* Grid de Atributos Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Soporte Vital (*2) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Soporte Vital (*2)
          </span>
          <strong className="text-slate-100 text-sm">{planet.life_support || 'Ninguno'}</strong>
          <span className="text-[10px] text-slate-500 block">Equipo exigido</span>
        </div>

        {/* Riesgo Contagio (*3) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Riesgo Contagio (*3)
          </span>
          <span className={`text-sm font-bold flex items-center gap-1 ${
            planet.local_contagion_risk ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {planet.local_contagion_risk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{planet.local_contagion_risk ? 'Peligro Biológico' : 'Seguro'}</span>
          </span>
          <span className="text-[10px] text-slate-500 block">Chequeo médico</span>
        </div>

        {/* Convenio Spacegom (*4) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Convenio (*4)
          </span>
          <span className={`text-sm font-bold ${planet.convenio_spacegom ? 'text-emerald-400' : 'text-amber-400'}`}>
            {planet.convenio_spacegom ? '✓ Adscrito' : '⚠ No adscrito'}
          </span>
          <span className="text-[10px] text-slate-500 block">Trazabilidad legal</span>
        </div>

        {/* Distancia Hiperdisparo (*5) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            A Hiperdisparo (*5)
          </span>
          <strong className="text-slate-100 text-sm">{planet.days_to_hyperspace} días</strong>
          <span className="text-[10px] text-slate-500 block">Tránsito sublumínico</span>
        </div>

        {/* Orden Legal (*6) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Orden Legal (*6)
          </span>
          <strong className="text-slate-100 text-sm">{planet.legal_order_threshold}</strong>
          <span className="text-[10px] text-slate-500 block">Igualar o superar</span>
        </div>

        {/* Autosuficiencia (*7) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Autosuficiencia (*7)
          </span>
          <strong className="text-slate-100 text-sm">{planet.self_sufficiency_level || '0'}</strong>
          <span className="text-[10px] text-slate-500 block">Nivel económico</span>
        </div>

        {/* UCN por Pedido (*8) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            UCN / Pedido (*8)
          </span>
          <strong className="text-amber-300 text-sm font-mono">{planet.ucn_per_order} UCN</strong>
          <span className="text-[10px] text-slate-500 block">Máximo por visita</span>
        </div>

        {/* Pasajeros Promedio (*9) */}
        <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Pasajeros (*9)
          </span>
          <strong className="text-sky-300 text-sm font-mono">{planet.max_passengers} viajeros</strong>
          <span className="text-[10px] text-slate-500 block">Demanda media</span>
        </div>
      </div>

      {/* Espaciopuerto y Misiones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-space-800/80">
        {/* Espaciopuerto */}
        <div className="p-3 bg-space-950 border border-space-800 rounded-xl space-y-1.5">
          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span>Espaciopuerto</span>
          </span>
          <div className="flex justify-between text-slate-300">
            <span>Calidad:</span>
            <strong className="text-slate-100">{planet.spaceport_quality || 'MED'}</strong>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Combustible:</span>
            <strong className="text-slate-100">{planet.fuel_density || 'DM'}</strong>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Tasa de Amarre:</span>
            <strong className="text-amber-300 font-mono">{planet.docking_price} SC</strong>
          </div>
        </div>

        {/* Misiones e Instalaciones Orbitales */}
        <div className="p-3 bg-space-950 border border-space-800 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <ScrollText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Misiones (*10)</span>
            </span>
            <strong className="text-indigo-300 font-mono">{planet.mission_threshold}</strong>
          </div>

          <div className="pt-1 border-t border-space-800/60">
            <span className="text-[10px] text-slate-500 block mb-1 uppercase font-semibold">Instalaciones Orbitales:</span>
            <div className="flex flex-wrap gap-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                planet.orbital_cartography_center ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-space-900/60 text-slate-600'
              }`}>
                CC: Cartografía
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                planet.orbital_hackers ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-space-900/60 text-slate-600'
              }`}>
                PI: Hackers
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                planet.orbital_supply_depot ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-space-900/60 text-slate-600'
              }`}>
                DS: Suministros
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                planet.orbital_astro_academy ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-space-900/60 text-slate-600'
              }`}>
                AA: Academia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Catálogo de Mercancías del Planeta (13 Productos) */}
      <div className="pt-2 border-t border-space-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-space-accent" />
            <span>Mercancías del Planeta (Verde: Produce/Compra · Azul: Demanda/Venta)</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
          {ALL_PRODUCT_CODES.map(code => {
            const prod = TRADE_PRODUCTS[code];
            const produces = checkProductProduces(code);

            return (
              <div
                key={code}
                className={`p-1.5 rounded-lg border text-center text-xs flex flex-col justify-between ${
                  produces
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-space-950/60 border-space-800 text-slate-400'
                }`}
                title={`${prod.name}: ${produces ? 'PRODUCE (se compra aquí a ' + prod.baseBuyPrice + ' SC)' : 'DEMANDA (se vende aquí a ' + prod.baseSellPrice + ' SC)'}`}
              >
                <div className="font-mono font-bold text-xs">{code}</div>
                <div className="text-[9px] font-semibold mt-0.5">
                  {produces ? (
                    <span className="text-emerald-400 font-mono">{prod.baseBuyPrice} SC (C)</span>
                  ) : (
                    <span className="text-sky-400 font-mono">{prod.baseSellPrice} SC (V)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
