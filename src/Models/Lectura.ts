export interface Lectura {
  lecturaId: string;
  dispositivoId: string;
  cultivo: string;
  ph: number;
  conductividad: number;
  humedad: number;
  orp: number;
  temperatura: number;
  fechaRecepcion: string;
  origen: string;
  estado: "optimo" | "advertencia" | "critico";
  procesado: boolean;
}

export interface RespuestaLecturas {
  total: number;
  lecturas: Lectura[];
}
