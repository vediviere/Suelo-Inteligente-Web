import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Gauge,
  History,
  Moon,
  RefreshCw,
  Sun,
  Download,
  Search,
  Database,
  LogOut,
  Radio,
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
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
import type { Analisis, InterpretacionIa } from "./Models/Analisis";
import type { Lectura } from "./Models/Lectura";
import {
  ORIGEN_API,
  obtenerEstadoApi,
  obtenerInterpretacionIa,
  obtenerLecturas,
  obtenerUltimoAnalisis,
} from "./Services/LecturaService";
import spinner from "./assets/arbolSpinner.svg";

type Vista = "dashboard" | "analisis" | "historial";

const USUARIO_DEMO = "admin@tlalcani.mx";
const CLAVE_DEMO = "admin123";

const iconosVariables: Record<string, string> = {
  ph: "/iconos/ph.png",
  conductividad: "/iconos/conductividad.png",
  ce: "/iconos/conductividad.png",
  humedad: "/iconos/humedad.png",
  orp: "/iconos/orp.png",
  temperatura: "/iconos/temperatura.png",
};


const encabezados: Record<Vista, { titulo: string; descripcion: string }> = {
  dashboard: {
    titulo: "Centro de monitoreo",
    descripcion:
      "Supervisión técnica de campos, sensores y variables del suelo",
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
  const [sesionActiva, setSesionActiva] = useState(
    () => sessionStorage.getItem("tlalcani_sesion") === "activa",
  );
  const [usuario, setUsuario] = useState(USUARIO_DEMO);
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [vista, setVista] = useState<Vista>("dashboard");
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [ultimoAnalisis, setUltimoAnalisis] = useState<Analisis | null>(null);
  const [interpretacionIa, setInterpretacionIa] =
    useState<InterpretacionIa | null>(null);

  const [cargandoInterpretacion, setCargandoInterpretacion] = useState(false);
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
      await new Promise((resolve) => setTimeout(resolve, 4000));

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
    if (!sesionActiva) {
      return;
    }

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
  }, [cargarDatos, sesionActiva]);

  const analisisIdActual = ultimoAnalisis?.analisis_id;

  useEffect(() => {
    if (vista !== "analisis" || !analisisIdActual) {
      return;
    }

    let cancelado = false;

    setInterpretacionIa(null);
    setCargandoInterpretacion(true);

    obtenerInterpretacionIa(analisisIdActual)
      .then((resultado) => {
        if (!cancelado) {
          setInterpretacionIa(resultado);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setInterpretacionIa(null);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoInterpretacion(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [vista, analisisIdActual]);

  useEffect(() => {
    document.documentElement.dataset.tema = oscuro ? "oscuro" : "claro";
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
  }, [oscuro]);

  const ultima = lecturas[0];
  const encabezado = encabezados[vista];

  const puntajeSuelo = Math.max(
    0,
    Math.min(ultimoAnalisis?.puntaje_general ?? 0, 100),
  );

  const estadoIndice =
    ultimoAnalisis?.estado_general ?? ultima?.estado ?? "optimo";

  const imagenIndice =
    estadoIndice === "critico"
      ? "/iconos/indice-critico.png"
      : estadoIndice === "advertencia"
        ? "/iconos/indice-advertencia.png"
        : "/iconos/indice-optimo.png";

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
      lectura.campoId,
      lectura.campoNombre,
      lectura.zona,
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

  function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (usuario.trim().toLowerCase() !== USUARIO_DEMO || clave !== CLAVE_DEMO) {
      setErrorLogin("El correo o la contraseña no son correctos.");
      return;
    }

    sessionStorage.setItem("tlalcani_sesion", "activa");
    setErrorLogin("");
    setCargando(true);
    setSesionActiva(true);
  }

  function cerrarSesion() {
    sessionStorage.removeItem("tlalcani_sesion");
    setClave("");
    setVista("dashboard");
    setSesionActiva(false);
  }

  function exportarCsv() {
    const encabezadosCsv = [
      "Fecha de captura",
      "Fecha de recepción",
      "Lectura",
      "Campo",
      "Identificador del campo",
      "Zona",
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
      formatearFecha(lectura.fechaCaptura),
      formatearFecha(lectura.fechaRecepcion),
      lectura.lecturaId,
      lectura.campoNombre,
      lectura.campoId,
      lectura.zona || "Zona no identificada",
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

  if (!sesionActiva) {
    return (
      <div className="loginPagina">
        <div className="particulasLogin" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, indice) => (
            <img key={indice} src="/semilla.png" alt="" draggable={false} />
          ))}
        </div>

        <section className="loginAcceso">
          <form className="loginFormulario" onSubmit={iniciarSesion}>
            <div className="loginEstado">
              <span />
              Sistema de monitoreo activo
            </div>

            <div className="loginFormularioEncabezado">
              <div className="loginLogo">
                <img src="/tlalcani-logo.png" alt="TLALCANI" />
              </div>

              <strong className="loginNombre">TLALCANI</strong>

              <span className="loginDescripcion">
                Inteligencia aplicada al suelo
              </span>

              <h1>Bienvenido</h1>

              <p>
                Supervisa tus campos, mediante sensores y análisis desde un solo
                lugar.
              </p>
            </div>

            <div className="separadorLogin">
              <span />
              <strong>Acceso al sistema</strong>
              <span />
            </div>

            <label>
              Correo electrónico
              <div className="campoLogin">
                <Mail size={19} />

                <input
                  type="email"
                  value={usuario}
                  onChange={(evento) => setUsuario(evento.target.value)}
                  autoComplete="username"
                  placeholder="correo@tlalcani.mx"
                  required
                />
              </div>
            </label>

            <label>
              Contraseña
              <div className="campoLogin">
                <LockKeyhole size={19} />

                <input
                  type="password"
                  value={clave}
                  onChange={(evento) => setClave(evento.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
            </label>

            {errorLogin && <div className="loginError">{errorLogin}</div>}

            <button type="submit" className="loginBoton">
              <span>Iniciar sesión</span>
              <ArrowRight size={19} />
            </button>

            <div className="loginPie">
              <ShieldCheck size={16} />
              <span>Acceso protegido al centro de monitoreo</span>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="marca">
          <div className="logo">
            <img src="/tlalcani-logo.png" alt="TLALCANI" />
          </div>

          <div>
            <strong>TLALCANI</strong>
            <span>Monitoreo agrícola</span>
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
            <span>{ORIGEN_API}</span>
          </div>
        </div>

        <button className="cerrarSesion" onClick={cerrarSesion}>
          <LogOut size={17} />
          Cerrar sesión
        </button>
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
          <div className="encabezadoPrincipal">
            <span className="encabezadoEtiqueta">
              TLALCANI / OPERACIÓN AGRÍCOLA
            </span>

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

            <button
              className="botonIcono cerrarMovil"
              onClick={cerrarSesion}
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {cargando ? (
          <div className="mensaje">
            <img
              className="spinnerPersonalizado"
              src={spinner}
              alt="Cargando información"
            />
            <p>Conectando con la API...</p>
            <span>
              {ORIGEN_API === "Render"
                ? "Render puede tardar unos segundos en iniciar."
                : "Verificando el servidor local..."}
            </span>
          </div>
        ) : !ultima ? (
          <section className="estadoVacio">
            <div className="estadoVacioVisual">
              <Radio size={36} />
            </div>

            <span className="estadoVacioEtiqueta">SIN TELEMETRÍA RECIBIDA</span>

            <h2>Esperando la primera lectura</h2>

            <p className="estadoVacioDescripcion">
              TLALCANI está listo para recibir y procesar la información enviada
              desde la aplicación móvil.
            </p>

            <div className="flujoVacio">
              <div>
                <span>
                  <span className="numeroPaso">1</span>
                  <Radio size={21} />
                </span>

                <strong>Sensor</strong>
                <small>Captura los datos</small>
              </div>

              <div>
                <span>
                  <span className="numeroPaso">2</span>
                  <RefreshCw size={21} />
                </span>

                <strong>Aplicación móvil</strong>
                <small>Sincroniza la lectura</small>
              </div>

              <div>
                <span>
                  <span className="numeroPaso">3</span>
                  <Database size={21} />
                </span>

                <strong>TLALCANI</strong>
                <small>Procesa y analiza</small>
              </div>
            </div>

            <div className="estadoVacioNota">
              <span className={apiDisponible ? "punto conectado" : "punto"} />

              {apiDisponible
                ? "API disponible. La vista se actualizará automáticamente."
                : "No se ha podido establecer conexión con la API."}
            </div>
          </section>
        ) : (
          <>
            {vista === "dashboard" && (
              <>
                {/* ESTADO DE SISTEMA */}
                <section className="barraEstadoSistema">
                  <div>
                    <img
                      className="iconoEstadoSistema"
                      src="/iconos/servicio.png"
                      alt=""
                      aria-hidden="true"
                    />

                    <div>
                      <small>Servicio de datos</small>
                      <strong>
                        {apiDisponible ? "Operativo" : "Sin conexión"}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <img
                      className="iconoEstadoSistema"
                      src="/iconos/sensor.png"
                      alt=""
                      aria-hidden="true"
                    />

                    <div>
                      <small>Sensor activo</small>
                      <strong>{ultima.dispositivoId}</strong>
                    </div>
                  </div>

                  <div>
                    <img
                      className="iconoEstadoSistema"
                      src="/iconos/registros.png"
                      alt=""
                      aria-hidden="true"
                    />

                    <div>
                      <small>Lecturas disponibles</small>
                      <strong>{lecturas.length} registros</strong>
                    </div>
                  </div>

                  <div>
                    <img
                      className="iconoEstadoSistema"
                      src="/iconos/ultimaRecepcion.png"
                      alt=""
                      aria-hidden="true"
                    />

                    <div>
                      <small>Última recepción</small>
                      <strong>{formatearFecha(ultima.fechaRecepcion)}</strong>
                    </div>
                  </div>
                </section>

                {/* LECTURA ACTUAL */}
                <section className="panelLecturaActual">
                  <div className="lecturaActualPrincipal">
                    <div className="lecturaActualEncabezado">
                      <div>
                        <span className="etiqueta">LECTURA ACTUAL</span>
                        <h2>{ultima.campoNombre}</h2>
                        <p>{ultima.campoId}</p>
                      </div>

                      <span className={`estado ${ultima.estado}`}>
                        {textoEstado(ultima.estado)}
                      </span>
                    </div>

                    <div className="fechaCaptura">
                      <img
                        className="iconoLectura"
                        src="/iconos/reloj.png"
                        alt=""
                        aria-hidden="true"
                      />
                      <span>
                        Capturada: {formatearFecha(ultima.fechaCaptura)}
                      </span>
                    </div>

                    <div className="metadatosLectura">
                      <div>
                        <img
                          className="iconoLectura"
                          src="/iconos/campo.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Campo</span>
                        <strong>{ultima.campoNombre}</strong>
                      </div>

                      <div>
                        <img
                          className="iconoLectura"
                          src="/iconos/zona.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Zona</span>
                        <strong>{ultima.zona || "Zona no identificada"}</strong>
                      </div>

                      <div>
                        <img
                          className="iconoLectura"
                          src="/iconos/cultivoL.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Cultivo</span>
                        <strong>{ultima.cultivo}</strong>
                      </div>

                      <div>
                        <img
                          className="iconoLectura"
                          src="/iconos/sensor.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Dispositivo</span>
                        <strong>{ultima.dispositivoId}</strong>
                      </div>

                      <div>
                        <img
                          className="iconoLectura"
                          src="/iconos/origen.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Origen</span>
                        <strong>{ultima.origen}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="saludSuelo">
                    <span>Índice del suelo</span>

                    <div
                      className="circuloIndiceSuelo"
                      style={
                        {
                          "--progreso": `${puntajeSuelo * 3.6}deg`,
                        } as CSSProperties
                      }
                    >
                      <img
                        className="indiceSueloBase"
                        src={imagenIndice}
                        alt=""
                        aria-hidden="true"
                      />

                      <img
                        className="indiceSueloProgreso"
                        src={imagenIndice}
                        alt=""
                        aria-hidden="true"
                      />

                      <div className="contenidoIndiceSuelo">
                        <strong>
                          {ultimoAnalisis?.puntaje_general ?? "--"}
                        </strong>
                        <small>de 100 puntos</small>
                      </div>
                    </div>

                    <div className={`nivelSalud ${ultima.estado}`}>
                      {textoEstado(ultima.estado)}
                    </div>
                  </div>
                </section>

                <section className="dashboardColumnas">
                  <div className="graficaPanel graficaTecnica">
                    <div className="tituloGrafica">
                      <div>
                        <h2>Tendencia de variables</h2>
                        <p>pH, humedad y temperatura por hora</p>
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
                  </div>

                  {/* #region PANEL ACTIVIDAD RECIENTE */}
                  {/* <div className="actividadPanel">
                    <div className="actividadEncabezado">
                      <div>
                        <h2>Actividad reciente</h2>
                        <p>Últimas lecturas sincronizadas</p>
                      </div>
                      <History size={21} />
                    </div>

                    <div className="actividadLista">
                      {lecturas.slice(0, 5).map((lectura) => (
                        <div className="actividadItem" key={lectura.lecturaId}>
                          <span
                            className={`actividadPunto ${lectura.estado}`}
                          />
                          <div>
                            <strong>{lectura.campoNombre}</strong>
                            <span>
                              {lectura.dispositivoId} · {lectura.cultivo}
                            </span>
                          </div>
                          <time>
                            {new Date(lectura.fechaCaptura).toLocaleTimeString(
                              "es-MX",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </time>
                        </div>
                      ))}
                    </div>

                    <button
                      className="verHistorial"
                      onClick={() => setVista("historial")}
                    >
                      Ver historial completo
                    </button>
                  </div> */}

                  <section className="variablesDashboard">
                    <div className="variablesDashboardEncabezado">
                      <strong>Variables Medidas</strong>
                      <span>Últimos valores recibidos</span>
                    </div>

                    <div className="resumen resumenTecnico">
                      <Tarjeta
                        titulo="pH"
                        valor={ultima.ph}
                        unidad=""
                        icono={
                          <img
                            className="iconoVariableDashboard"
                            src="/iconos/ph.png"
                            alt="pH"
                          />
                        }
                        color="verde"
                      />

                      <Tarjeta
                        titulo="Humedad"
                        valor={ultima.humedad}
                        unidad="%"
                        icono={
                          <img
                            className="iconoVariableDashboard"
                            src="/iconos/humedad.png"
                            alt="Humedad"
                          />
                        }
                        color="celeste"
                      />

                      <Tarjeta
                        titulo="Temperatura"
                        valor={ultima.temperatura}
                        unidad=" °C"
                        icono={
                          <img
                            className="iconoVariableDashboard"
                            src="/iconos/temperatura.png"
                            alt="Temperatura"
                          />
                        }
                        color="naranja"
                      />

                      <Tarjeta
                        titulo="Conductividad"
                        valor={ultima.conductividad}
                        unidad=" dS/m"
                        icono={
                          <img
                            className="iconoVariableDashboard"
                            src="/iconos/conductividad.png"
                            alt="Conductividad"
                          />
                        }
                        color="morado"
                      />

                      <Tarjeta
                        titulo="ORP"
                        valor={ultima.orp}
                        unidad=" mV"
                        icono={
                          <img
                            className="iconoVariableDashboard"
                            src="/iconos/orp.png"
                            alt="ORP"
                          />
                        }
                        color="morado"
                      />
                    </div>
                  </section>
                </section>

                {/* Diagnóstico más reciente */}
                {/* {ultimoAnalisis && (
                  <section
                    className={`diagnosticoDashboard ${ultimoAnalisis.estado_general}`}
                  >
                    {ultimoAnalisis.alertas.length > 0 ? (
                      <AlertTriangle size={25} />
                    ) : (
                      <CheckCircle2 size={25} />
                    )}

                    <div>
                      <span>Diagnóstico más reciente</span>
                      <strong>
                        {ultimoAnalisis.alertas[0]?.mensaje ??
                          "Las variables se encuentran dentro de los rangos recomendados."}
                      </strong>
                      {ultimoAnalisis.recomendaciones[0] && (
                        <p>{ultimoAnalisis.recomendaciones[0].descripcion}</p>
                      )}
                    </div>

                    <button onClick={() => setVista("analisis")}>
                      Ver análisis
                    </button>
                  </section>
                )} */}
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
                          className="circuloIndiceSuelo circuloIndiceAnalisis"
                          style={
                            {
                              "--progreso": `${puntajeSuelo * 3.6}deg`,
                            } as CSSProperties
                          }
                        >
                          <img
                            className="indiceSueloBase"
                            src={imagenIndice}
                            alt=""
                            aria-hidden="true"
                          />

                          <img
                            className="indiceSueloProgreso"
                            src={imagenIndice}
                            alt=""
                            aria-hidden="true"
                          />

                          <div className="contenidoIndiceSuelo">
                            <strong>{ultimoAnalisis.puntaje_general}</strong>
                            <small>/100</small>
                          </div>
                        </div>

                        <span
                          className={`estado ${ultimoAnalisis.estado_general}`}
                        >
                          {textoEstado(ultimoAnalisis.estado_general)}
                        </span>
                      </div>

                      <div className="detalleAnalisis interpretacionInteligente">
                        <div className="encabezadoAnalisis">
                          <div>
                            <span className="etiqueta">ANÁLISIS TLALCANI</span>
                            <h2>Interpretación inteligente</h2>
                          </div>

                          <BrainCircuit size={31} />
                        </div>

                        {cargandoInterpretacion ? (
                          <div className="cargandoInterpretacion">
                            <img src={spinner} alt="" />
                            <span>
                              Interpretando las condiciones del suelo...
                            </span>
                          </div>
                        ) : interpretacionIa ? (
                          <>
                            <div className="resumenInterpretacion">
                              <div className="cabeceraPrioridad">
                                <strong>
                                  {interpretacionIa.variable_prioritaria}
                                </strong>

                                <span
                                  className={`prioridadIa ${interpretacionIa.prioridad}`}
                                >
                                  Prioridad {interpretacionIa.prioridad}
                                </span>
                              </div>

                              <p>{interpretacionIa.resumen}</p>
                            </div>

                            <div className="accionesIa">
                              <strong>Acciones sugeridas</strong>

                              {interpretacionIa.acciones.map(
                                (accion, indice) => (
                                  <div
                                    className="accionIa"
                                    key={`${indice}-${accion}`}
                                  >
                                    <CheckCircle2 size={18} />
                                    <span>{accion}</span>
                                  </div>
                                ),
                              )}
                            </div>

                            <small className="advertenciaIa">
                              {interpretacionIa.advertencia}
                            </small>
                          </>
                        ) : (
                          <div className="interpretacionNoDisponible">
                            <AlertTriangle size={21} />

                            <div>
                              <strong>
                                Interpretación inteligente no disponible
                              </strong>
                              <p>
                                Se muestra la recomendación calculada por el
                                análisis regional.
                              </p>

                              {ultimoAnalisis.recomendaciones[0] && (
                                <p>
                                  {
                                    ultimoAnalisis.recomendaciones[0]
                                      .descripcion
                                  }
                                </p>
                              )}
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

                      <div className="detalleVariables">
                        {ultimoAnalisis.resultados.map((resultado) => (
                          <article
                            className={`variableAnalisis ${resultado.estado}`}
                            key={resultado.variable}
                          >
                            <div className="variableAnalisisEncabezado">
                              <div className="variableAnalisisIdentidad">
                                <img
                                  className="iconoVariableAnalisis"
                                  src={
                                    iconosVariables[
                                      resultado.variable.toLowerCase()
                                    ] ?? "/iconos/suelo.png"
                                  }
                                  alt={`Icono de ${resultado.nombre}`}
                                />

                                <div>
                                  <span>Variable medida</span>
                                  <h3>{resultado.nombre}</h3>
                                </div>
                              </div>
                              <span className={`estado ${resultado.estado}`}>
                                {textoEstado(resultado.estado)}
                              </span>
                            </div>

                            <div className="variableAnalisisValor">
                              <strong>{resultado.valor}</strong>
                              <span>{resultado.unidad}</span>
                            </div>

                            <div className="rangoVariable">
                              <div>
                                <span>Mínimo</span>
                                <strong>
                                  {resultado.rango_recomendado.min}{" "}
                                  {resultado.unidad}
                                </strong>
                              </div>

                              <div className="rangoOptimo">
                                <span>Óptimo</span>
                                <strong>
                                  {resultado.rango_recomendado.optimo}{" "}
                                  {resultado.unidad}
                                </strong>
                              </div>

                              <div>
                                <span>Máximo</span>
                                <strong>
                                  {resultado.rango_recomendado.max}{" "}
                                  {resultado.unidad}
                                </strong>
                              </div>
                            </div>

                            <div
                              className={`condicionVariable ${resultado.condicion}`}
                            >
                              <span>
                                {resultado.condicion === "bajo"
                                  ? "Por debajo del rango"
                                  : resultado.condicion === "alto"
                                    ? "Por encima del rango"
                                    : "Dentro del rango"}
                              </span>

                              <strong>
                                {resultado.condicion === "bajo"
                                  ? `Faltan ${resultado.diferencia_para_rango} ${resultado.unidad}`
                                  : resultado.condicion === "alto"
                                    ? `Excede ${resultado.diferencia_para_rango} ${resultado.unidad}`
                                    : "Sin ajuste necesario"}
                              </strong>
                            </div>

                            <p className="mensajeVariable">
                              {resultado.mensaje}
                            </p>
                          </article>
                        ))}
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
                        <th>Captura</th>
                        <th>Campo</th>
                        <th>Zona</th>
                        <th>Dispositivo</th>
                        <th>Cultivo</th>
                        <th>pH</th>
                        <th>Humedad</th>
                        <th>Temp</th>
                        <th>Conductividad</th>
                        <th>ORP</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {lecturasFiltradas.map((lectura) => (
                        <tr key={lectura.lecturaId}>
                          <td>{formatearFecha(lectura.fechaCaptura)}</td>
                          <td>{lectura.campoNombre}</td>
                          <td>{lectura.zona || "Zona no identificada"}</td>
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
                          <td className="sinResultados" colSpan={11}>
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
                          <strong>{lectura.campoNombre}</strong>
                          <span>
                            {lectura.zona || "Zona no identificada"} ·{" "}
                            {lectura.cultivo}
                          </span>
                          <span>{lectura.dispositivoId}</span>
                        </div>

                        <span className={`estado ${lectura.estado}`}>
                          {textoEstado(lectura.estado)}
                        </span>
                      </div>

                      <div className="lecturaMovilFecha">
                        Capturada: {formatearFecha(lectura.fechaCaptura)}
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
