# Fertility Tracker — Web

Seguimiento de fertilidad por método **sintotérmico (Sensiplan + Döring)**, portado
desde la app Android Kotlin a una webapp Next.js desplegable en Vercel.

- **Motor idéntico**: la lógica (`src/domain/fertilityEngine.ts`) es un puerto fiel,
  línea por línea, del `FertilityEngine.kt` original. Puro TypeScript, sin dependencias
  de framework.
- **100% local**: los datos se guardan en `localStorage` del navegador (igual que el
  Room on-device del original). Sin backend, sin nube, sin telemetría.
- **4 pantallas**: Calendario, Registro diario, Tendencias (gráficas SVG), Ajustes.
- **Perfiles locales**: nombre de usuaria + PIN de 4 dígitos. Permite que varias
  personas usen el mismo navegador con datos separados.

> ⚠️ El PIN es un **cerrojo de conveniencia**, no seguridad real: los datos no se
> cifran ni salen del dispositivo. Cualquiera con acceso al navegador puede leerlos.

## Desarrollo

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

## Despliegue en Vercel

Este proyecto vive en el subdirectorio `web/` del repositorio.

**Opción A — Dashboard de Vercel**
1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. En *Root Directory*, selecciona **`web`**.
3. Framework: *Next.js* (autodetectado). Deploy.

**Opción B — CLI**
```bash
cd web
npx vercel          # primer deploy / preview
npx vercel --prod   # producción
```

## Estructura

```
web/src/
  lib/date.ts             Utilidades de fecha ISO (sin dependencias)
  domain/types.ts         Tipos, enums y paleta de estados
  domain/fertilityEngine.ts  Motor Sensiplan (puerto del .kt)
  data/store.ts           Persistencia localStorage + hook React (≈ ViewModel)
  components/             Pantallas y componentes de UI estilo iOS
  app/                    Next.js App Router (layout + page)
```

## Aviso

Herramienta de apoyo informativo. **No sustituye el consejo médico profesional** ni
debe usarse como único método anticonceptivo.
