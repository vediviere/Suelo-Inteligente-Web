import type { Lectura, RespuestaLecturas } from "../Models/Lectura";
import type { Analisis } from "../Models/Analisis";

const API_URL = "https://api-suelo-inteligente.onrender.com";

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
  try {
    const respuesta = await fetch(`${API_URL}/api/lecturas/analisis/ultimo`);

    if (respuesta.status === 404) {
      return null;
    }

    if (!respuesta.ok) {
      throw new Error("No fue posible obtener el último análisis.");
    }

    return await respuesta.json();
  } catch {
    return null;
  }
}
