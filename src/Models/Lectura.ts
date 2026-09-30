export interface Lectura {
  lecturaId: string;
  campoId: string;
  campoNombre: string;
  dispositivoId: string;
  zona: string;
  cultivo: string;
  ph: number;
  conductividad: number;
  humedad: number;
  orp: number;
  temperatura: number;
  fechaCaptura: string;
  fechaRecepcion: string;
  origen: string;
  estado: "optimo" | "advertencia" | "critico";
  procesado: boolean;
}

export interface RespuestaLecturas {
  total: number;
  lecturas: Lectura[];
}
