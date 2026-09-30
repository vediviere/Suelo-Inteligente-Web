export type EstadoAnalisis = "optimo" | "advertencia" | "critico";
export type CondicionVariable = "bajo" | "optimo" | "alto";

export interface ResultadoVariable {
  variable: string;
  nombre: string;
  valor: number;
  unidad: string;
  estado: EstadoAnalisis;
  condicion: CondicionVariable;
  diferencia_para_rango: number;
  rango_recomendado: {
    min: number;
    optimo: number;
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

export interface InterpretacionIa {
  analisis_id: string;
  resumen: string;
  prioridad: "baja" | "media" | "alta";
  variable_prioritaria: string;
  acciones: string[];
  advertencia: string;
  generado_por: string;
  fecha_generacion: string;
}