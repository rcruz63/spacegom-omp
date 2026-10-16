# 🚀 Spacegom OMP - Estado del Proyecto y Manual de Continuidad

**Fecha de corte:** Octubre 2026  
**Entorno de desarrollo:** React 18, Vite, TypeScript 5, Tailwind CSS, Vitest  
**Estado:** Totalmente funcional, testeado (85 tests unitarios/integración) y listo para ser retomado en cualquier entorno.

---

## 📌 1. Visión General del Proyecto

**Spacegom OMP** es la adaptación digital e interactiva del juego de libro-juego y gestión espacial *Spacegom*. Permite jugar campañas interestelares completas manteniendo al 100% las reglas matemáticas, económicas y de dados del reglamento oficial, eliminando el tedio del registro en fichas de papel pero respetando la posibilidad de tirar dados físicos o automáticos.

---

## 🛠️ 2. Pila Tecnológica y Arquitectura

* **Frontend:** React 18 + TypeScript + Vite.
* **Estilos:** Tailwind CSS con paleta temática espacial (`space` y `slate`), animaciones de dados y niebla de guerra.
* **Iconos:** `lucide-react`.
* **Testing:** Vitest (85 tests automatizados que cubren el motor económico, dados, calendario, cola de eventos, comercio y maniobras).
* **Persistencia:** `localStorage` bajo la clave `spacegom_saves_v1` (con capa de abstracción SSR/Node y migración automática de partidas).
* **Estructura modular:**
  ```text
  src/
  ├── components/
  │   ├── common/           # Componentes reutilizables (DiceRollerVisual, etc.)
  │   ├── company/          # Fichas de personal y cola de tareas del Director
  │   ├── missions/         # Listas de Objetivos de Campaña y Misiones Especiales
  │   ├── navigation/       # Modales de maniobras de vuelo (aterrizaje, orbital, tránsito)
  │   ├── sector/           # Mapa 6x6 estrellado, ficha completa de planeta, navegación
  │   ├── setup/            # Pasos modulares del Setup Wizard de nueva partida
  │   ├── spaceport/        # Modales de amarre, repostaje y astillero
  │   ├── tabs/             # Vistas principales del Dashboard
  │   ├── trade/            # Modales de cesta de compra y venta de mercancías
  │   ├── App.tsx           # Enrutamiento de vistas (Puerta de acceso, Gestor de partidas, Dashboard)
  │   └── GameDashboard.tsx # Barra de tiempo/eventos, estado del Director y pestañas
  ├── data/                 # Datasets desacoplados para actualización por humanos
  │   ├── companyNames.json # 470 nombres de megacorporaciones
  │   ├── shipNames.json    # 500 nombres de astronaves
  │   ├── personnelNames.json # 1.000 nombres de tripulantes
  │   ├── planets.json      # Catálogo de 216 planetas (códigos 111-666)
  │   ├── positionsCatalog.ts # 25 puestos clasificados por tecnología, salario y dificultad
  │   └── tradeProducts.ts  # 13 mercancías con precios base y días de cooldown
  ├── engine/               # Motor puro de reglas del juego (TypeScript sin UI)
  │   ├── administration.ts # Liquidación mensual (día 35), nóminas, préstamos y quiebra
  │   ├── auditLog.ts       # Bitácora detallada de auditoría
  │   ├── calendar.ts       # Calendario de 35 días/mes y 12 meses/año
  │   ├── company.ts        # Gestión de compañía, tripulación, moral y daños de nave
  │   ├── dice.ts           # Motor de tiradas 2D6, 3D6 y modificadores
  │   ├── eventQueue.ts     # Gestor de eventos temporales y avance a hitos
  │   ├── flightManeuvers.ts# Aterrizaje en mundo, amarre orbital y tránsito a hiperdisparo
  │   ├── hiring.ts         # Contratación y agenda de tareas del Director Gerente
  │   ├── navigation.ts     # Creación de universo, hipersaltos y desembarco
  │   ├── spaceport.ts      # Amarre en muelle, repostaje y reparaciones en astillero
  │   ├── storage.ts        # Serialización de partidas, migración y borrado
  │   ├── trade.ts          # Compra, venta y transporte de pasajeros
  │   ├── tradeLogistics.ts # Estiba de operarios, cooldowns de demanda y límite de 25 filas
  │   └── universe.ts       # Validación de planetas y búsqueda consecutiva
  └── types/                # Interfaces y tipos de dominio fuertemente tipados
  ```

---

## ✅ 3. Módulos Implementados al Detalle

### A. Setup de Partida Reglamentario (`SetupWizard.tsx`)
* **Paso 1: Identificación & Dificultad:**
  - Valores por defecto oficiales del tutorial: Compañía `Starblack`, Nave `Astronave I`.
  - Botones para sugerir nombres aleatorios no repetidos desde los datasets CSV/JSON.
  - 3 niveles de dificultad con saldo inicial exacto: **Fácil (600 SC)**, **Normal (500 SC)**, **Difícil (400 SC)**.
* **Paso 2: Área, Densidad y Cuadrante Inicial:**
  - Tiradas en blanco al entrar (el jugador decide si tirar en Automático o introducir sus dados físicos).
  - Bloqueo persistente de relanzamiento en dificultades Normal y Difícil.
  - Determinación reglamentaria de cuadrante por dados (1D6 Columna A-F y 1D6 Fila 1-6). Grid 6x6 visual de solo lectura.
* **Paso 3: Planeta de Origen (3D6):**
  - Tirador 3D6 animado o entrada manual.
  - Validación automática de los 5 requisitos de inicio: Población $>1.000$, Tecnología compatible, Soporte vital compatible, Convenio Spacegom y Producción comercial.
  - Búsqueda consecutiva automática ($111 \rightarrow 112 \rightarrow 113...$) si el código sacado no es apto.
  - Posibilidad de editar o completar datos del planeta directamente desde el setup.
* **Paso 4: Tripulación Inicial Fija (11 miembros, 76 SC/mes):**
  - Widaker Farq (Director, 20 SC, veterano, alta), Samantha Warm (Comandante, 15 SC, veterano, media), Thomas Muller (Computacional, 4 SC, novato, baja), Walter Lopez (Astronavegación, 8 SC, novato, baja), Jeffrey Cook (Repostaje, 8 SC, estándar, baja), Danielle Rivers (Piloto, 10 SC, estándar, baja), Isaac Peterson (Logística, 1 SC, novato, baja), Katherine Smith (Contabilidad, 3 SC, estándar, media), Jason Wilson (Suministros de manutención, 3 SC, estándar, baja), Sam Hernández (Cocinero, 3 SC, estándar, media), Alexandra Adams (Asistente doméstico, 1 SC, estándar, baja).

### B. Calendario y Gestor de Eventos (`calendar.ts` y `eventQueue.ts`)
* **Meses de 35 días:** 5 semanas de 7 días, 12 meses por año.
* **Cierre en Día 35:** Las nóminas de toda la plantilla, cuotas de préstamos bancarios, mantenimiento de casco y gastos burocráticos se cobran estrictamente el día 35. Si la tesorería entra en saldo negativo, se declara la **quiebra** (`isBankrupt: true`).
* **Motor `EventQueue`:** Las tareas temporales se ordenan cronológicamente. El botón **"Avanzar al Hito"** avanza el calendario hasta el evento más cercano; si el día 35 ocurre antes, se detiene primero para aplicar la administración mensual.

### C. Contratación y Agenda del Director Gerente (`hiring.ts` y `DirectorTaskQueuePanel.tsx`)
* **Catálogo de 25 puestos:** Clasificados según el nivel tecnológico del planeta (Rudimentario, Espacial, Avanzado).
* **Escalado por experiencia del candidato:** Novato (mitad tiempo y salario, -1 tirada), Estándar (base), Veterano (doble tiempo y salario, +1 tirada).
* **Tiradas sin trampa ni relanzamiento oculto:** El tiempo de búsqueda se tira con dados visuales o manuales en `HiringModal`, y esos días exactos se usan en el motor.
* **Cola de Tareas Secuencial:** Si el Director ya está ocupado, el jugador puede **encolar nuevos encargos**. Al resolverse el actual mediante la tirada de contratación ($2\text{D6} + \text{mods}$), el motor promueve automáticamente el siguiente encargo de la agenda.

### D. Transporte de Pasajeros (`trade.ts` y `PassengerTransportModal.tsx`)
* **Captación 2D6:** $<7$ mitad promedio, $7-9$ promedio exacto, $\ge 10$ doble del promedio (columna `*9` del planeta).
* **Tarifas por Auxiliares de Vuelo:** 0 aux ($1\text{ SC}$), 1 aux ($2\text{ SC}$), 2 aux ($3\text{ SC}$), 3 aux ($4\text{ SC}$/viajero). Ajustes por experiencia: $-5\text{ SC}$ por auxiliar novato, $+5\text{ SC}$ por veterano. Cobro anticipado.
* **Restricción y Desembarco:** Máximo 1 captación por visita al mundo. Los pasajeros desembarcan automáticamente al descender a la superficie de un nuevo planeta (`passengersCurrent = 0`).

### E. Comercio de Mercancías (`tradeLogistics.ts`, `TradeBuyModal.tsx`, `TradeSellModal.tsx`)
* **Cesta de Negociación Previa:** 1 día de trabajo del negociador por cada producto a negociar. Tirada 2D6 ($<7 \rightarrow \times 1.2$, $7-9 \rightarrow \times 1.0$, $\ge 10 \rightarrow \times 0.8$).
* **Estiba en Almacén:** Cada operario de logística tira 2D6 ($\ge 7 \rightarrow 10\text{ UCN/día}$, $<7 \rightarrow 5\text{ UCN/día}$; sin operarios: $5\text{ UCN/día}$).
* **Cooldowns:** Bloquea compra o venta si el planeta está en período de reposición (`daysToProduce` o `daysToDemand`).
* **Libro Oficial de 25 Filas:** Registro reglamentario del Área actual, control de cupo (25 filas máx.) y trazabilidad del Convenio Spacegom (venta obligatoria en bloque en mundos con convenio vs. ventas parciales ilegales en mundos sin convenio).

### F. Operaciones de Espaciopuerto y Astillero (`spaceport.ts`)
* **Amarre del Piloto (`SpaceportDockingModal`):** 2D6 + mods ($\ge 7$ limpio; $\le 6$ tirada 1D6: 1-5 leve, 6 moderado). Deduce tasa de amarre (`docking_price`).
* **Repostaje (`SpaceportRefuelModal`):** $3\text{ SC/unidad}$ + $1\text{ SC/día}$ de ocupación. Tiempo según densidad (DB 1 u/d, DM 5 u/d, DA 10 u/d). Chequeo de pureza técnica ($<7 \rightarrow 1\text{ daño leve}$).
* **Astillero (`SpaceportRepairModal`):** Categorías por calidad (BAS: leves, MED: leves+mod, NOT/EXC: leves+mod+graves). Costes base: leve 5 SC / 1d, mod 20 SC / 1D6d, grave 50 SC / 2D6d. Técnico de mantenimiento con tirada $\ge 7$ reduce costes y tiempos al 50%.

### G. Maniobras de Vuelo y Navegación (`flightManeuvers.ts` y `FlightManeuverModal.tsx`)
* Maniobra de aproximación y aterrizaje en superficie de MUNDO (con desembarco de viajeros).
* Maniobra de amarre en Instalaciones Orbitales.
* Tránsito sublumínico a Estación de Hiperdisparo consumiendo días según columna `*5` y combustible ($1\text{ U}$ cada 5 días al alza).

### H. Pantalla de Sector y Navegación (`SectorMapView.tsx`)
* **Mapa 6x6 Cósmico:** Fondo estrellado con cabeceras exteriores A-F y 1-6.
* **Niebla de guerra:** Cuadrantes inexplorados mostrados en tono brumoso / blanco sucio translúcido con su coordenada visible.
* **Iconos y Planeta de Origen:** Planetas con icono y código numérico visible (`#111`). Planeta de Origen permanentemente marcado con distintivo dorado `★ BASE` y halo de luz. Indicador animado de la posición de la astronave.
* **Ficha Exhaustiva de Planeta (`PlanetFullCard.tsx`):** Desglose completo de los 18 campos oficiales más las 13 mercancías (verde = compra, azul = venta).
* **Navegación Intersectorial:** Selector de sectores 2 al 12 e hipersalto intersectorial a sectores adyacentes.

### I. Registro Oficial de Misiones (`MissionsView.tsx`)
* Separación de pestañas: **Objetivos de Campaña** vs. **Misiones Especiales**.
* **Objetivo de Campaña nº 1 (Contratación de Plantilla):** Activación con un clic en el mundo natal y checklist en tiempo real del estado de contratación de los 6 puestos clave.
* Controles manuales para que el jugador informe del resultado (`En curso`, `✓ Éxito`, `✗ Fracaso`).
* Formulario oficial para registrar contratos secundarios de Misiones Especiales (página del libro y recompensa).

---

## 🔮 4. Próximos Pasos (Roadmap para cuando se retome)

1. **Servicios en Instalaciones Orbitales (según la ficha de cada planeta):**
   * **Centro Cartográfico (CC):** Pago de 10 SC y tirada del ingeniero computacional para revelar todos los cuadrantes del sector o los 5 adyacentes.
   * **Depósito de Suministros (DS):** Compra de trajes espaciales, respiradores y máscaras de oxígeno.
   * **Academia de Astronavegación (AA):** Cursos de formación para subir experiencia a pilotos e ingenieros.
   * **Piratas Informáticos (PI):** Blanqueo de mercancías ilegales o alteración de registros.
2. **Tablón de Misiones Especiales Procedurales:**
   * En mundos con misiones (columna `*10`), tirada 2D6 para generar o consultar encargos secundarios aleatorios según el Libro de Campaña.
3. **Peligros de Navegación y Encuentros en el Sector:**
   * Riesgo de contagio biológico local (columna `*3`): chequeo y tratamiento con el Médico.
   * Cuadrantes con presencia de Megacorporaciones rivales o piratas armados (uso de armas y soldados mercenarios).
4. **Mercado de Astronaves:**
   * Compraventa de los 10 modelos de naves de Spacegom (cargueros pesados, exploradores de largo alcance, etc.).

---

## 💻 5. Instrucciones para Ejecutar y Retomar en Otro Entorno

### Requisitos Previos
* **Node.js** (v18 o superior) o **Bun**.
* **npm** o **pnpm**.

### Puesta en Marcha
```bash
# 1. Clonar el repositorio o copiar el directorio
cd spacegom-omp

# 2. Instalar dependencias
npm install

# 3. Ejecutar los tests para verificar integridad
npm test -- --run

# 4. Compilar en producción para verificar tipos TypeScript
npm run build

# 5. Arrancar el servidor de desarrollo local
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173/` (o el puerto que asigne Vite). La contraseña de la puerta de acceso inicial es `admin` (o la configurada en `AccessGate.tsx`).

---

## 📜 6. Historial de Commits Destacados

* `84abd96` `feat(hiring): implement Director Gerente task queue for sequential hiring planning`
* `8a4ecf7` `fix(hiring): integrate DiceRollerVisual for search duration and pass exact rolled days`
* `ef8d6fc` `feat(missions): implement Campaign Objectives system and one-click activation of Objective 1`
* `6c2a3ac` `fix(sector): ensure origin planet is always represented with fallback and prominent badge`
* `c072f64` `style(map): render unconfigured quadrants with misty fog color instead of text`
* `db31a28` `feat(sector): overhaul Sector and Navigation view with full planet data, starry map, and inter-sector travel`
* `39a901a` `fix(setup): require manual/auto roll, persistent difficulty lock, and quadrant dice`
* `2fb385a` `fix(setup): fix white-on-white inputs, add manual/auto dice with animation, and align official crew`
* `0c1f4cc` `feat(navigation): implement flight maneuvers for landing, orbital docking, and sublight transit`
* `8f0593d` `feat(spaceport): implement docking maneuvers, refueling, and shipyard repairs`
* `05ab92f` `feat(trade): implement merchandise trade system with negotiation basket, warehouse logistics, and area ledger`
* `dabcbd7` `feat(passengers): implement passenger transport with flight attendant rates and disembarkation`
* `a8a98b6` `feat(hiring): implement 25 positions catalog and Director Gerente hiring workflow`
* `65ec53d` `feat(calendar): update month to 35 days and implement EventQueue engine`
* `f853bb3` `feat(setup): implement 4-step game setup, datasets, and starting planet validation`
