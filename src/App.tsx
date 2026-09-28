import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Cloud,
  Droplets,
  FlaskConical,
  Gauge,
  History,
  Leaf,
  Lightbulb,
  Moon,
  RefreshCw,
  Sun,
  Thermometer,
  Zap,
  Download,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
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
import "./App.css";
import type { Analisis } from "./Models/Analisis";
import type { Lectura } from "./Models/Lectura";
import {
  obtenerEstadoApi,
  obtenerLecturas,
  obtenerUltimoAnalisis,
} from "./Services/LecturaService";

type Vista = "dashboard" | "analisis" | "historial";

const encabezados: Record<Vista, { titulo: string; descripcion: string }> = {
  dashboard: {
    titulo: "Monitoreo del suelo",
    descripcion: "Resumen de las lecturas recibidas desde la aplicación móvil",
  },
  analisis: {
    titulo: "Análisis del suelo",
    descripcion: "Resultados, alertas y recomendaciones generadas por TLALCANI",
  },
  historial: {
    titulo: "Historial de lecturas",
    descripcion: "Consulta de las últimas mediciones recibidas",
  },
};

export default function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [ultimoAnalisis, setUltimoAnalisis] = useState<Analisis | null>(null);
  const [apiDisponible, setApiDisponible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem("tema") === "oscuro",
  );
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | Lectura["estado"]>(
    "todos",
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
  const encabezado = encabezados[vista];

  const datosGrafica = [...lecturas].reverse().map((lectura) => ({
    ...lectura,
    hora: new Date(lectura.fechaRecepcion).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const lecturasFiltradas = lecturas.filter((lectura) => {
    const texto = busqueda.toLowerCase().trim();

    const contenidoLectura = [
      lectura.lecturaId,
      lectura.dispositivoId,
      lectura.cultivo,
      lectura.ph,
      lectura.humedad,
      lectura.temperatura,
      lectura.conductividad,
      lectura.orp,
      lectura.estado,
      textoEstado(lectura.estado),
      formatearFecha(lectura.fechaRecepcion),
    ]
      .join(" ")
      .toLowerCase();

    const coincideBusqueda =
      texto.length === 0 || contenidoLectura.includes(texto);

    const coincideEstado =
      filtroEstado === "todos" || lectura.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

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

  function exportarCsv() {
    const encabezadosCsv = [
      "Fecha",
      "Lectura",
      "Dispositivo",
      "Cultivo",
      "pH",
      "Humedad",
      "Temperatura",
      "Conductividad",
      "ORP",
      "Estado",
    ];

    const filas = lecturasFiltradas.map((lectura) => [
      formatearFecha(lectura.fechaRecepcion),
      lectura.lecturaId,
      lectura.dispositivoId,
      lectura.cultivo,
      lectura.ph,
      lectura.humedad,
      lectura.temperatura,
      lectura.conductividad,
      lectura.orp,
      textoEstado(lectura.estado),
    ]);

    const contenido = [encabezadosCsv, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const archivo = new Blob([`\uFEFF${contenido}`], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `lecturas-suelo-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
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
          <button
            className={vista === "dashboard" ? "navActivo" : ""}
            onClick={() => setVista("dashboard")}
          >
            <Gauge size={20} />
            Dashboard
          </button>

          <button
            className={vista === "analisis" ? "navActivo" : ""}
            onClick={() => setVista("analisis")}
          >
            <BarChart3 size={20} />
            Análisis
          </button>

          <button
            className={vista === "historial" ? "navActivo" : ""}
            onClick={() => setVista("historial")}
          >
            <History size={20} />
            Historial
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
        <div className="navegacionMovil">
          <button
            className={vista === "dashboard" ? "activo" : ""}
            onClick={() => setVista("dashboard")}
          >
            <Gauge size={19} />
            Inicio
          </button>

          <button
            className={vista === "analisis" ? "activo" : ""}
            onClick={() => setVista("analisis")}
          >
            <BarChart3 size={19} />
            Análisis
          </button>

          <button
            className={vista === "historial" ? "activo" : ""}
            onClick={() => setVista("historial")}
          >
            <History size={19} />
            Historial
          </button>
        </div>

        <header>
          <div>
            <h1>{encabezado.titulo}</h1>
            <p>{encabezado.descripcion}</p>
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
            {vista === "dashboard" && (
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
                    unidad=" °C"
                    icono={<Thermometer />}
                    color="rojo"
                  />

                  <Tarjeta
                    titulo="Conductividad"
                    valor={ultima.conductividad}
                    unidad=" dS/m"
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
              </>
            )}

            {vista === "analisis" && (
              <>
                {ultimoAnalisis ? (
                  <>
                    <section className="analisisPanel">
                      <div className="puntaje">
                        <span>Puntaje general</span>

                        <div
                          className={`puntajeCirculo ${ultimoAnalisis.estado_general}`}
                        >
                          <strong>{ultimoAnalisis.puntaje_general}</strong>
                          <small>/100</small>
                        </div>

                        <span
                          className={`estado ${ultimoAnalisis.estado_general}`}
                        >
                          {textoEstado(ultimoAnalisis.estado_general)}
                        </span>
                      </div>

                      <div className="detalleAnalisis">
                        <div className="encabezadoAnalisis">
                          <div>
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
                            Todas las variables se encuentran dentro de los
                            rangos recomendados.
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
                              <p>
                                {ultimoAnalisis.recomendaciones[0].descripcion}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="tablaPanel">
                      <div className="tituloTabla">
                        <div>
                          <h2>Detalle de variables</h2>
                          <p>Comparación con los rangos recomendados</p>
                        </div>

                        <span>
                          {formatearFecha(ultimoAnalisis.fecha_procesamiento)}
                        </span>
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="mensaje">
                    <BarChart3 size={34} />
                    <p>Todavía no existe un análisis</p>
                    <span>Envía una lectura desde la aplicación móvil.</span>
                  </div>
                )}
              </>
            )}

            {vista === "historial" && (
              <section className="tablaPanel">
                <div className="tituloTabla tituloHistorial">
                  <div>
                    <h2>Lecturas recibidas</h2>
                    <p>
                      Mostrando {lecturasFiltradas.length} de {lecturas.length}{" "}
                      mediciones
                    </p>
                  </div>

                  <div className="herramientasHistorial">
                    <label className="buscador">
                      <Search size={17} />

                      <input
                        type="search"
                        placeholder="Buscar en las lecturas"
                        value={busqueda}
                        onChange={(evento) => setBusqueda(evento.target.value)}
                      />
                    </label>

                    <select
                      value={filtroEstado}
                      onChange={(evento) =>
                        setFiltroEstado(
                          evento.target.value as "todos" | Lectura["estado"],
                        )
                      }
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="optimo">Óptimo</option>
                      <option value="advertencia">Advertencia</option>
                      <option value="critico">Crítico</option>
                    </select>

                    <button
                      className="exportar"
                      onClick={exportarCsv}
                      disabled={lecturasFiltradas.length === 0}
                    >
                      <Download size={17} />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="tablaContenedor tablaHistorialDesktop">
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
                      {lecturasFiltradas.map((lectura) => (
                        <tr key={lectura.lecturaId}>
                          <td>{formatearFecha(lectura.fechaRecepcion)}</td>
                          <td>{lectura.dispositivoId}</td>
                          <td>{lectura.cultivo}</td>
                          <td>{lectura.ph}</td>
                          <td>{lectura.humedad}%</td>
                          <td>{lectura.temperatura} °C</td>
                          <td>{lectura.conductividad} dS/m</td>
                          <td>{lectura.orp} mV</td>
                          <td>
                            <span className={`estado ${lectura.estado}`}>
                              {textoEstado(lectura.estado)}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {lecturasFiltradas.length === 0 && (
                        <tr>
                          <td className="sinResultados" colSpan={9}>
                            No existen lecturas que coincidan con los filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="historialMovil">
                  {lecturasFiltradas.map((lectura) => (
                    <article className="lecturaMovil" key={lectura.lecturaId}>
                      <div className="lecturaMovilEncabezado">
                        <div>
                          <strong>{lectura.cultivo}</strong>
                          <span>{lectura.dispositivoId}</span>
                        </div>

                        <span className={`estado ${lectura.estado}`}>
                          {textoEstado(lectura.estado)}
                        </span>
                      </div>

                      <div className="lecturaMovilFecha">
                        {formatearFecha(lectura.fechaRecepcion)}
                      </div>

                      <div className="lecturaMovilDatos">
                        <div>
                          <span>pH</span>
                          <strong>{lectura.ph}</strong>
                        </div>

                        <div>
                          <span>Humedad</span>
                          <strong>{lectura.humedad}%</strong>
                        </div>

                        <div>
                          <span>Temperatura</span>
                          <strong>{lectura.temperatura} °C</strong>
                        </div>
                      </div>
                    </article>
                  ))}

                  {lecturasFiltradas.length === 0 && (
                    <div className="sinResultadosMovil">
                      No existen lecturas que coincidan con los filtros.
                    </div>
                  )}
                </div>
              </section>
            )}
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
  icono: ReactNode;
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
