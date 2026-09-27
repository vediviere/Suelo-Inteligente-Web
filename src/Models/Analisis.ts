export type EstadoAnalisis = "optimo" | "advertencia" | "critico";

export interface ResultadoVariable {
  variable: string;
  nombre: string;
  valor: number;
  unidad: string;
  estado: EstadoAnalisis;
  rango_recomendado: {
    min: number;
    max: number;
  };
  mensaje: string;
}

export interface AlertaAnalisis {
  nivel: EstadoAnalisis;
  variable: string;
  mensaje: string;
}

export interface Recomendacion {
  prioridad: "baja" | "media" | "alta";
  titulo: string;
  descripcion: string;
}

export interface Analisis {
  analisis_id: string;
  lectura_id: string;
  fecha_procesamiento: string;
  estado_general: EstadoAnalisis;
  puntaje_general: number;
  resultados: ResultadoVariable[];
  alertas: AlertaAnalisis[];
  recomendaciones: Recomendacion[];
}
