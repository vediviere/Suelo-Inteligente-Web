import {
  Activity,
  Cloud,
  Droplets,
  FlaskConical,
  Gauge,
  Leaf,
  Moon,
  RefreshCw,
  Sun,
  Thermometer,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import type { Lectura } from "./Models/Lectura";
import {
  obtenerEstadoApi,
  obtenerLecturas,
  obtenerUltimoAnalisis,
} from "./Services/LecturaService";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Analisis } from "./Models/Analisis";

export default function App() {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [ultimoAnalisis, setUltimoAnalisis] = useState<Analisis | null>(null);
  const [apiDisponible, setApiDisponible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem("tema") === "oscuro",
  );

  const cargarDatos = useCallback(async () => {
    try {
      const [disponible, datos, analisis] = await Promise.all([
        obtenerEstadoApi(),
        obtenerLecturas(),
        obtenerUltimoAnalisis(),
      ]);

      setApiDisponible(disponible);
      setLecturas(datos);
      setUltimoAnalisis(analisis);
    } catch {
      setApiDisponible(false);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const cargaInicial = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    const intervalo = window.setInterval(() => {
      void cargarDatos();
    }, 5000);

    return () => {
      window.clearTimeout(cargaInicial);
      window.clearInterval(intervalo);
    };
  }, [cargarDatos]);

  useEffect(() => {
    document.documentElement.dataset.tema = oscuro ? "oscuro" : "claro";
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
  }, [oscuro]);

  const ultima = lecturas[0];

  const datosGrafica = [...lecturas].reverse().map((lectura) => ({
    ...lectura,
    hora: new Date(lectura.fechaRecepcion).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  }

  function textoEstado(estado: Lectura["estado"]) {
    if (estado === "optimo") {
      return "Óptimo";
    }

    if (estado === "advertencia") {
      return "Advertencia";
    }

    return "Crítico";
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="marca">
          <div className="logo">
            <Leaf size={25} />
          </div>

          <div>
            <strong>Suelo Inteligente</strong>
            <span>Panel de monitoreo</span>
          </div>
        </div>

        <nav>
          <button className="navActivo">
            <Gauge size={20} />
            Dashboard
          </button>
        </nav>

        <div className="estadoApi">
          <span className={apiDisponible ? "punto conectado" : "punto"} />
          <div>
            <strong>
              {apiDisponible ? "API conectada" : "API sin conexión"}
            </strong>
            <span>Render</span>
          </div>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <h1>Monitoreo del suelo</h1>
            <p>Lecturas recibidas desde la aplicación móvil</p>
          </div>

          <div className="acciones">
            <button
              className="botonIcono"
              onClick={() => setOscuro(!oscuro)}
              title="Cambiar tema"
            >
              {oscuro ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="actualizar" onClick={cargarDatos}>
              <RefreshCw size={18} />
              Actualizar
            </button>
          </div>
        </header>

        {cargando ? (
          <div className="mensaje">
            <RefreshCw className="girando" size={28} />
            <p>Conectando con la API...</p>
            <span>Render puede tardar unos segundos en iniciar.</span>
          </div>
        ) : !ultima ? (
          <div className="mensaje">
            <Cloud size={34} />
            <p>Todavía no existen lecturas</p>
            <span>Envía una lectura desde la aplicación móvil.</span>
          </div>
        ) : (
          <>
            <section className="resumen">
              <Tarjeta
                titulo="pH"
                valor={ultima.ph}
                unidad=""
                icono={<FlaskConical />}
                color="azul"
              />

              <Tarjeta
                titulo="Humedad"
                valor={ultima.humedad}
                unidad="%"
                icono={<Droplets />}
                color="celeste"
              />

              <Tarjeta
                titulo="Temperatura"
                valor={ultima.temperatura}
                unidad="°C"
                icono={<Thermometer />}
                color="rojo"
              />

              <Tarjeta
                titulo="Conductividad"
                valor={ultima.conductividad}
                unidad=" mS/cm"
                icono={<Zap />}
                color="amarillo"
              />

              <Tarjeta
                titulo="ORP"
                valor={ultima.orp}
                unidad=" mV"
                icono={<Activity />}
                color="morado"
              />
            </section>

            <section className="panelUltima">
              <div>
                <span className="etiqueta">Última lectura recibida</span>
                <h2>{ultima.cultivo}</h2>
                <p>
                  Dispositivo: <strong>{ultima.dispositivoId}</strong>
                </p>
              </div>

              <div className="ultimaDerecha">
                <span className={`estado ${ultima.estado}`}>
                  {textoEstado(ultima.estado)}
                </span>
                <small>{formatearFecha(ultima.fechaRecepcion)}</small>
              </div>
            </section>

            {ultimoAnalisis && (
              <section className="analisisPanel">
                <div className="puntaje">
                  <span>Puntaje general</span>

                  <div
                    className={`puntajeCirculo ${ultimoAnalisis.estado_general}`}
                  >
                    <strong>{ultimoAnalisis.puntaje_general}</strong>
                    <small>/100</small>
                  </div>

                  <span className={`estado ${ultimoAnalisis.estado_general}`}>
                    {textoEstado(ultimoAnalisis.estado_general)}
                  </span>
                </div>

                <div className="detalleAnalisis">
                  <div className="encabezadoAnalisis">
                    <div>
                      <span className="etiqueta">Análisis generado por C#</span>
                      <h2>Evaluación de la última lectura</h2>
                    </div>

                    {ultimoAnalisis.alertas.length === 0 ? (
                      <CheckCircle2 className="iconoCorrecto" size={30} />
                    ) : (
                      <AlertTriangle className="iconoAlerta" size={30} />
                    )}
                  </div>

                  {ultimoAnalisis.alertas.length === 0 ? (
                    <div className="sinAlertas">
                      <CheckCircle2 size={20} />
                      Todas las variables se encuentran dentro de los rangos
                      recomendados.
                    </div>
                  ) : (
                    <div className="listaAlertas">
                      {ultimoAnalisis.alertas.map((alerta) => (
                        <div
                          className={`alertaItem ${alerta.nivel}`}
                          key={`${alerta.variable}-${alerta.mensaje}`}
                        >
                          <AlertTriangle size={18} />

                          <div>
                            <strong>{alerta.variable}</strong>
                            <p>{alerta.mensaje}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {ultimoAnalisis.recomendaciones[0] && (
                    <div className="recomendacion">
                      <Lightbulb size={21} />

                      <div>
                        <strong>
                          {ultimoAnalisis.recomendaciones[0].titulo}
                        </strong>
                        <p>{ultimoAnalisis.recomendaciones[0].descripcion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="graficaPanel">
              <div className="tituloGrafica">
                <div>
                  <h2>Tendencia de mediciones</h2>
                  <p>Comportamiento de las últimas lecturas recibidas</p>
                </div>

                <span>{lecturas.length} mediciones</span>
              </div>

              <div className="grafica">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={datosGrafica}
                    margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="var(--borde)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="hora"
                      stroke="var(--texto-suave)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />

                    <YAxis
                      stroke="var(--texto-suave)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        color: "var(--texto)",
                        background: "var(--panel)",
                        border: "1px solid var(--borde)",
                        borderRadius: "12px",
                        boxShadow: "var(--sombra)",
                      }}
                      labelStyle={{
                        color: "var(--texto-suave)",
                        marginBottom: "7px",
                      }}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="ph"
                      name="pH"
                      stroke="#3478F6"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="humedad"
                      name="Humedad"
                      stroke="#00ACC1"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="temperatura"
                      name="Temperatura"
                      stroke="#E85D3F"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="tablaPanel">
              <div className="tituloTabla">
                <div>
                  <h2>Historial de lecturas</h2>
                  <p>Últimas {lecturas.length} lecturas recibidas</p>
                </div>

                <span>Actualización automática cada 5 segundos</span>
              </div>

              <div className="tablaContenedor">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Dispositivo</th>
                      <th>Cultivo</th>
                      <th>pH</th>
                      <th>Humedad</th>
                      <th>Temperatura</th>
                      <th>Conductividad</th>
                      <th>ORP</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lecturas.map((lectura) => (
                      <tr key={lectura.lecturaId}>
                        <td>{formatearFecha(lectura.fechaRecepcion)}</td>
                        <td>{lectura.dispositivoId}</td>
                        <td>{lectura.cultivo}</td>
                        <td>{lectura.ph}</td>
                        <td>{lectura.humedad}%</td>
                        <td>{lectura.temperatura} °C</td>
                        <td>{lectura.conductividad}</td>
                        <td>{lectura.orp}</td>
                        <td>
                          <span className={`estado ${lectura.estado}`}>
                            {textoEstado(lectura.estado)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

interface TarjetaProps {
  titulo: string;
  valor: number;
  unidad: string;
  icono: React.ReactNode;
  color: string;
}

function Tarjeta({ titulo, valor, unidad, icono, color }: TarjetaProps) {
  return (
    <article className="tarjeta">
      <div className={`tarjetaIcono ${color}`}>{icono}</div>

      <div>
        <span>{titulo}</span>
        <strong>
          {valor}
          <small>{unidad}</small>
        </strong>
      </div>
    </article>
  );
}
