# Spacegom - Asistente y Soporte Integral de Campaña

Aplicación web modular diseñada para sustituir las hojas de papel del librojuego **Spacegom** de Juan Vicente Pérez Javaloyes, implementando con rigor sus mecánicas y reglas según los manuales oficiales, erratas y descargables.

Diseñada con TypeScript, Vite, React y Tailwind CSS, preparada tanto para su ejecución en local como para despliegue serverless en AWS (CloudFront, S3/Amplify, Lambdas y DynamoDB).

---

## 🚀 Inicio Rápido en Local

1. **Instalación de dependencias:**
   ```bash
   npm install
   ```

2. **Ejecución en desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

3. **Código de Acceso:**
   - La pantalla de seguridad solicita un código de autorización.
   - Código predeterminado: `SPACEGOM2880` (o `1234`).

4. **Ejecución de Tests y Simulación:**
   ```bash
   npm test
   ```

5. **Compilación de Producción:**
   ```bash
   npm run build
   ```

---

## 🌌 Arquitectura y Módulos Implementados

### 1. Núcleo y Calendario Estelar (`src/engine/calendar.ts`)
- Año estelar compuesto por **12 meses de 28 días** (iniciando en Día 01 / Mes 01 / Año 2880).
- Detección automática de **Administración Semanal** (días 7, 14, 21 y 28).
- Detección automática de **Fin de Mes** (día 28) para salarios, suministros y mantenimiento.
- Conversión bidireccional determinista a días absolutos.

### 2. Módulo de Dados Manual y Automático (`src/engine/dice.ts`, `src/components/DiceModal.tsx`)
- Soporte para tiradas automáticas calculadas por la aplicación o manuales introducidas por el jugador (tras lanzar en mesa).
- Soporte de 1D6, 2D6, 3D6 con cálculo de modificadores por moral, experiencia y estado de nave.
- Detección automática de doble 6 (mejora de experiencia) y doble 1.

### 3. Bitácora de Auditoría y Traslado a Papel (`src/engine/auditLog.ts`, `src/components/AuditLogModal.tsx`)
- Registro de cada cambio de tesorería, posición, tirada, compra/venta, daño o contrato.
- Filtros por categorías y exportación a archivo `.txt` para trasladar o auditar la partida en papel en cualquier momento.

### 4. Generación y Mapeo del Universo (`src/engine/universe.ts`, `src/engine/navigation.ts`)
- Base de datos con los **216 planetas** del inventario interestelar de Spacegom (`src/data/planets.json`).
- Generación de sectores y cuadrantes (matriz 6x6 A1-F6) según densidad del área (Baja 9+, Media 8+, Alta 7+).
- Validación de mundos iniciales de campaña según tutorial (Convenio Spacegom, población > 1000, soporte vital, nivel tecnológico).
- Gestión de posiciones de la astronave: En el Mundo, Espaciopuerto, Instalación Orbital, Estación de Hiperdisparo o En Tránsito.

### 5. Gestión de la Compañía y Nave (`src/engine/company.ts`, `src/engine/administration.ts`)
- Plantilla con sueldos, niveles de experiencia (`novato`, `estandar`, `veterano`), moral (`baja`, `media`, `alta`) y cálculos dinámicos de modificadores.
- Evolución automática de moral y experiencia tras tiradas.
- Contratación de personal y despido (con o sin indemnización reglamentaria).
- Nave espacial: combustible, aforo de pasajeros, capacidad de almacén en UCN, progresión de daños (3 leves = 1 moderado; 2 moderados = 1 grave) y penalizadores a tiradas.
- Inventario de soporte vital (oxígeno, máscaras, respiradores, trajes) y salubridad.
- Préstamos bancarios (hasta 10 en campaña, máx 2 simultáneos de 100 SC a devolver en 20 cuotas de 10 SC).

### 6. Comercio de Mercancías (`src/engine/trade.ts`, `src/data/tradeProducts.ts`)
- 13 productos oficiales de Spacegom: `INDU`, `BASI`, `ALIM`, `MADE`, `AGUA`, `MICO`, `MIRA`, `MIPR`, `PAVA`, `A`, `AE`, `AEI`, `COM`.
- Factor de negociación de compra y venta según tirada del negociador de compraventa.
- Control estricto de capacidad de almacén y pedidos.

### 7. Transporte de Pasajeros (`src/engine/trade.ts`)
- Cálculo de pasajeros por planeta y aforo de la astronave.
- Tarifas según número de auxiliares de vuelo y bonificaciones por experiencia. Cobro anticipado.

### 8. Operaciones en Espaciopuerto e Instalaciones Orbitales (`src/engine/spaceport.ts`)
- Repostaje de combustible considerando densidad del espaciopuerto y días de amarre.
- Reparación de averías (leves, moderadas y graves) con reducción del 50% en tiempo y coste mediante tirada de técnico de mantenimiento.
- Acceso a Centros Cartográficos, Depósitos de Suministros y Academias de Astronavegación.

### 9. Subsistema de Misiones y Objetivos (`src/components/tabs/MissionsView.tsx`)
- Registro de objetivos de campaña y misiones especiales con referencia directa a las páginas del libro.
- Seguimiento de recompensas, plazos máximos y resolución con impacto en reputación y tesorería.

---

## 🧪 Verificación Automatizada

El proyecto incluye una suite completa de pruebas unitarias y de integración que reproduce el tutorial paso a paso:
- `src/engine/core.test.ts`: Pruebas de dados, fechas, paso del tiempo y bitácora.
- `src/engine/universe.test.ts`: Base de datos de 216 mundos, configuración procedural de cuadrantes y navegación.
- `src/engine/company.test.ts`: Daños de nave, modificadores de tripulantes, contrataciones y ciclos semanales/mensuales.
- `src/engine/trade.test.ts`: Compraventa con márgenes, pasajeros, repostaje y reparaciones.
- `src/engine/tutorialSimulation.test.ts`: Simulación completa determinista del tutorial de campaña.

Ejecutar:
```bash
npm test
```
Resultados:
```
 ✓ src/engine/core.test.ts (7 tests)
 ✓ src/engine/universe.test.ts (4 tests)
 ✓ src/engine/company.test.ts (7 tests)
 ✓ src/engine/trade.test.ts (4 tests)
 ✓ src/engine/tutorialSimulation.test.ts (1 test)

 Test Files  5 passed (5)
      Tests  23 passed (23)
```

---

## ☁️ Preparación para Despliegue en AWS (Free Tier)

La aplicación almacena el estado completo de forma desacoplada y serializada (`GameSave`), compatible directamente con almacenamiento en DynamoDB (particionado por `id` de partida).

Para producción serverless:
1. **Frontend:** Los archivos generados en `dist/` pueden alojarse en un bucket S3 servido por CloudFront.
2. **Backend/API (Opcional):** Si se desea sincronización multi-dispositivo en la nube, las funciones en `src/engine/` pueden empaquetarse directamente como Lambdas con Node.js / TypeScript conectadas a DynamoDB.
