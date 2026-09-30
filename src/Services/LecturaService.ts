import type { Analisis, InterpretacionIa } from "../Models/Analisis";
import type { Lectura, RespuestaLecturas } from "../Models/Lectura";

const API_URL = import.meta.env.VITE_API_URL;

export const ORIGEN_API =
  import.meta.env.VITE_API_ORIGEN ?? "API no identificada";

if (!API_URL) {
  throw new Error("No se configuró VITE_API_URL.");
}

export async function obtenerEstadoApi(): Promise<boolean> {
  try {
    const respuesta = await fetch(`${API_URL}/health`);
    return respuesta.ok;
  } catch {
    return false;
  }
}

export async function obtenerLecturas(cantidad = 20): Promise<Lectura[]> {
  const respuesta = await fetch(`${API_URL}/api/lecturas?cantidad=${cantidad}`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener las lecturas.");
  }

  const datos: RespuestaLecturas = await respuesta.json();
  return datos.lecturas;
}

export async function obtenerUltimoAnalisis(): Promise<Analisis | null> {
  const respuesta = await fetch(`${API_URL}/api/lecturas/analisis/ultimo`);

  if (respuesta.status === 404) {
    return null;
  }

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener el último análisis.");
  }

  return respuesta.json();
}

export async function obtenerInterpretacionIa(
  analisisId: string,
): Promise<InterpretacionIa> {
  const respuesta = await fetch(
    `${API_URL}/api/lecturas/analisis/${analisisId}/interpretacion-ia`,
    {
      method: "POST",
    },
  );

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener la interpretación inteligente.");
  }

  return await respuesta.json();
}
