# TLALCANI — Aplicación web

Panel web desarrollado con React, TypeScript y Vite para consultar las lecturas y análisis de suelo procesados por la API de TLALCANI.

## Funcionalidades

- Inicio de sesión.
- Dashboard general.
- Estado de conexión con la API.
- Visualización de la última lectura.
- Índice general del suelo.
- Detalle de variables.
- Historial de lecturas.
- Búsqueda y filtros.
- Diseño adaptable para computadora y dispositivos móviles.
- Interpretación generada mediante inteligencia artificial.
- Tema claro y oscuro.

## Tecnologías

- React
- TypeScript
- Vite
- Recharts
- Lucide React

## Requisitos

- Node.js 22 o compatible.
- npm.
- Acceso a la API de TLALCANI.

## Instalación

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` en la carpeta principal:

```env
VITE_API_URL=https://api-suelo-inteligente.onrender.com
VITE_API_ORIGEN=Render
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | Dirección de la API utilizada por la aplicación web. |
| `VITE_API_ORIGEN` | Identifica el origen de la información mostrada. |

Para trabajar con la API local:

```env
VITE_API_URL=http://localhost:5025
VITE_API_ORIGEN=Local
```

## Ejecución local

```bash
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

## Credenciales de demostración

```text
Correo: admin@tlalcani.mx
Contraseña: admin123
```

## Compilación

```bash
npm run build
```

Los archivos generados se guardarán en:

```text
dist/
```

Para probar la compilación:

```bash
npm run preview
```

## Configuración en Render

```text
Build Command: npm install && npm run build
Publish Directory: dist
```

Variables necesarias:

```env
VITE_API_URL=https://api-suelo-inteligente.onrender.com
VITE_API_ORIGEN=Render
```

> Después de modificar una variable `VITE_*`, es necesario realizar un nuevo despliegue.

## Flujo de información

1. La aplicación móvil registra una lectura.
2. La lectura se envía a la API.
3. La API procesa la información.
4. La aplicación web consulta las lecturas y análisis.
5. El dashboard muestra los datos recibidos.
6. La sección de análisis solicita la interpretación inteligente.
7. El historial permite cotejar las mediciones registradas.

## Consideraciones

- La aplicación web no procesa directamente las lecturas.
- Las reglas de análisis se encuentran en la API.
- Render puede tardar algunos segundos en activar el servicio.
- Las variables `VITE_*` son visibles desde el navegador.
- Nunca se debe colocar la clave de Groq en la aplicación web.