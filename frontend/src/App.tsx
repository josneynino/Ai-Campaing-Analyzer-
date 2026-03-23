import type { ReactNode, ReactElement } from "react";
import { useEffect, useState } from "react";
import {
  Route,
  Routes,
  Navigate,
  Link,
  NavLink,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import { getApiErrorMessage } from "./lib/axiosError";
import { useFormValidation } from "./lib/useFormValidation";
import { loginSchema, registerSchema, analyzeUrlSchema, analyzeTextSchema } from "./lib/validation";
import PhotoEditorPage from "./pages/PhotoEditorPage";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { errors, validate } = useFormValidation(loginSchema);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({ email, password })) return;

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError("No se pudo iniciar sesión. Revisa tus credenciales.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <span className="auth-brand-mark" aria-hidden />
            <h1 className="auth-brand-title">Campaign Intelligence</h1>
          </div>
          <p className="auth-brand-tagline">
            Plataforma corporativa para analizar campañas publicitarias con IA, comparar frente a
            competidores y priorizar mejoras accionables.
          </p>
          <ul className="auth-brand-bullets">
            <li>Análisis estructurado con métricas claras (1–10)</li>
            <li>Contexto competitivo cuando hay datos disponibles</li>
            <li>Historial y trazabilidad por usuario</li>
          </ul>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <h1>Iniciar sesión</h1>
          <p>Accede al panel con tu cuenta corporativa.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="auth-switch">
            ¿No tiene cuenta? <Link to="/register">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { errors, validate } = useFormValidation(registerSchema);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({ email, password, firstName, lastName, phone })) return;

    setLoading(true);
    setError(null);
    try {
      await register(email, password, firstName, lastName, phone);
      navigate("/app", { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { status?: number } })?.response?.status === 409
          ? "Este email ya está registrado."
          : "No se pudo crear la cuenta.";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <span className="auth-brand-mark" aria-hidden />
            <h1 className="auth-brand-title">Campaign Intelligence</h1>
          </div>
          <p className="auth-brand-tagline">
            Onboarding rápido para equipos de marketing y growth. Centraliza análisis y reduce
            idas y venidas con agencias o herramientas sueltas.
          </p>
          <ul className="auth-brand-bullets">
            <li>Cuenta única por organización (email corporativo)</li>
            <li>Datos aislados por usuario en la base de la aplicación</li>
            <li>Listo para integrar con su flujo de trabajo actual</li>
          </ul>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <h1>Unete ahora</h1>
          <p>Potencia tus campañas publicitarias con IA.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Nombre
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Juan"
                required
              />
              {errors.firstName && <p className="error-text">{errors.firstName}</p>}
            </label>
            <label>
              Apellido
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Pérez"
                required
              />
              {errors.lastName && <p className="error-text">{errors.lastName}</p>}
            </label>
            <label>
              Número telefónico
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </label>
            <label>
              Correo corporativo
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@empresa.com"
                required
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </label>
            <label>
              Contraseña segura
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </form>
          <p className="auth-switch">
            ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function getPageMeta(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith("/app/analysis/")) {
    return {
      title: "Detalle del análisis",
      subtitle: "Revisión completa de la campaña original y el informe generado.",
    };
  }
  switch (pathname) {
    case "/app/analyze":
      return {
        title: "Nuevo análisis",
        subtitle:
          "Envíe una URL pública o pegue el texto del anuncio. El procesamiento puede tardar unos minutos.",
      };
    case "/app/history":
      return {
        title: "Historial",
        subtitle: "Consulte análisis previos, puntuaciones y acciones realizadas.",
      };
    case "/app/swipe-file":
      return {
        title: "Swipe File",
        subtitle: "Biblioteca de anuncios guardados para inspiración y contra-campañas.",
      };
    case "/app/photo-ai":
      return {
        title: "AI Studio Visual",
        subtitle: "Sube o recorta imágenes automáticamente con Inteligencia Artificial para adaptarlas a distintas plataformas.",
      };
    case "/app":
    default:
      return {
        title: "Resumen",
        subtitle: "Vista general del workspace y accesos rápidos a las tareas habituales.",
      };
  }
}

function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { title, subtitle } = getPageMeta(location.pathname);

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <span className="sidebar-logo-mark" aria-hidden />
              Campaign Intelligence
            </div>
            <span className="sidebar-product">Análisis competitivo de campañas</span>
          </div>
          <nav className="sidebar-nav" aria-label="Navegación principal">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              Resumen
            </NavLink>
            <NavLink
              to="/app/analyze"
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              Nuevo análisis
            </NavLink>
            <NavLink
              to="/app/history"
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              Historial
            </NavLink>
            <NavLink
              to="/app/swipe-file"
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              Swipe File
            </NavLink>
            <NavLink
              to="/app/photo-ai"
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              AI Studio Visual
            </NavLink>
          </nav>
          <div className="sidebar-footer">
            Uso interno · Los informes dependen de la disponibilidad de APIs externas y de su clave
            de IA configurada en el servidor.
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="main-inner">
          <header className="main-header">
            <div className="main-header-text">
              <p className="main-header-eyebrow">Workspace</p>
              <h1>{title}</h1>
              <p className="main-header-sub">{subtitle}</p>
            </div>
            <div className="main-header-actions">
              <span className="user-chip" title={user?.email}>
                {user?.email}
              </span>
              <button className="secondary-button" type="button" onClick={logout}>
                Cerrar sesión
              </button>
              <Link to="/app/analyze" className="primary-button-link">
                Nuevo análisis
              </Link>
            </div>
          </header>
          <div className="page-section">{children}</div>
        </div>
      </main>
    </div>
  );
}

function DashboardHome() {
  return (
    <section className="page-section">
      <div className="stat-row">
        <div className="stat-card">
          <p className="stat-label">Flujo recomendado</p>
          <p className="stat-value">Analizar → Revisar scores → Aplicar mejoras</p>
          <p className="stat-hint">
            Use URL de landing pública o pegue el copy del anuncio para máxima fiabilidad.
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Contexto competitivo</p>
          <p className="stat-value">Meta Ads &amp; Google Transparency</p>
          <p className="stat-hint">
            Cuando hay datos disponibles, el informe incorpora referencias de competidores.
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Cola de procesamiento</p>
          <p className="stat-value">Asíncrono (BullMQ)</p>
          <p className="stat-hint">
            Los análisis se encolan; asegúrese de que Redis y el worker estén en ejecución en su
            entorno.
          </p>
        </div>
      </div>
      <div className="card-grid">
        <div className="card">
          <h2>Bienvenido al workspace</h2>
          <p>
            Desde aquí puede iniciar un nuevo informe o revisar el historial. La interfaz está
            pensada para equipos que necesitan decisiones rápidas y documentación clara.
          </p>
          <div className="quick-actions">
            <Link to="/app/analyze" className="primary-button-link">
              Iniciar análisis
            </Link>
            <Link to="/app/history" className="secondary-button-link">
              Ver historial
            </Link>
          </div>
        </div>
        <div className="card">
          <h2>Buenas prácticas</h2>
          <p>
            Para scraping por URL, prefiera páginas públicas sin login. Para redes sociales, pegue
            el texto del anuncio manualmente.
          </p>
          <p className="muted">
            Si el análisis falla, compruebe la conectividad con Redis, la API de Gemini y los
            límites de cuota de su proveedor de IA.
          </p>
        </div>
      </div>
    </section>
  );
}

type AnalysisResponse = {
  analysis: {
    id: number;
    summary: string;
    clarityScore: number;
    persuasionScore: number;
    differentiationScore: number;
    ctaScore: number;
    conversionScore: number;
    recommendations: string;
    optimizedVersion: string;
  };
};

type AnalyzeJobResponse = {
  jobId: string;
  status: "pending";
};

type JobStatusResponse = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    analysisId: number;
    campaignId: number;
  };
  error?: string;
};

const SCRAPE_ERROR_HINT =
  "No se pudo leer esta página (redes sociales o sitios protegidos suelen fallar). Usa una URL de landing pública o pega el texto del anuncio en «Pegar texto».";

const QUOTA_ERROR_HINT =
  "Cuota o límite de la API de desarrolladores (Google AI Studio), no la suscripción Gemini de la app. " +
  "Gemini Plus/Advanced no suma créditos a esta API. Cree o revise su clave en aistudio.google.com/apikey " +
  "y los límites del plan; para más uso puede activar facturación en Google Cloud (API Generative Language).";

function normalizeError(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "El análisis falló sin mensaje del servidor. Revise la terminal del worker (backend).";

  if (t === "SCRAPE_FAILED") return SCRAPE_ERROR_HINT;
  if (/429|quota|RESOURCE_EXHAUSTED|exceeded/i.test(t)) return QUOTA_ERROR_HINT;

  if (/GEMINI_API_KEY_NO_CONFIG|GEMINI_API_KEY/i.test(t)) {
    return (
      "Falta la clave de Gemini o no es válida. En la carpeta backend edite .env, " +
      "añada GEMINI_API_KEY=(su clave de Google AI Studio), guarde y reinicie el worker (npm run worker:analysis)."
    );
  }

  if (/INVALID_JSON|INVALID_SCHEMA|EMPTY_RESPONSE/i.test(t)) {
    return (
      "La IA devolvió un formato inesperado. Pruebe de nuevo o use «Pegar texto» con un anuncio más corto."
    );
  }

  // Evitar mostrar stack traces enormes en pantalla
  const oneLine = t.replace(/\s+/g, " ");
  return oneLine.length > 600 ? `${oneLine.slice(0, 600)}…` : oneLine;
}

function NewAnalysisPage() {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse["analysis"] | null>(null);

  const urlValidation = useFormValidation(analyzeUrlSchema);
  const textValidation = useFormValidation(analyzeTextSchema);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<
    JobStatusResponse["status"] | "idle"
  >("idle");
  /** Segundos desde que hay un job activo (para mensajes y avisos). */
  const [elapsedSec, setElapsedSec] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setJobId(null);
    setJobStatus("idle");
    // elapsed se reinicia en el useEffect al poner loading=true

    // Validar entrada
    const isValid = mode === "url" 
      ? urlValidation.validate({ url }) 
      : textValidation.validate({ text: pastedText.trim() });
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const body = mode === "url" ? { url } : { text: pastedText.trim() };
      const res = await api.post<AnalyzeJobResponse>("/analyze", body, {
        timeout: 25_000,
      });
      setJobId(res.data.jobId);
      setJobStatus(res.data.status);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo encolar el análisis. Inténtelo de nuevo en unos minutos.",
        ),
      );
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    async function pollStatus() {
      try {
        const res = await api.get<JobStatusResponse>(`/jobs/${jobId}`);
        if (cancelled) return;

        setJobStatus(res.data.status);

        if (res.data.status === "completed") {
          const analysisId = res.data.result?.analysisId;
          if (!analysisId) {
            if (!cancelled) {
              setError(
                "El trabajo terminó pero no hay resultado. Revise el worker y los logs del servidor.",
              );
              setLoading(false);
            }
            return;
          }
          const analysisRes = await api.get<AnalysisDetailResponse>(
            `/analyses/${analysisId}`,
          );
          if (!cancelled) {
            setResult(analysisRes.data.analysis);
            setLoading(false);
          }
          return;
        }

        if (res.data.status === "failed") {
          const rawError =
            res.data.error ?? "El análisis falló. Revise la terminal del worker en backend o GEMINI_API_KEY en .env.";
          setError(normalizeError(rawError));
          setLoading(false);
          return;
        }

        // pending o processing: seguir haciendo polling (más rápido si ya está procesando)
        const delay = res.data.status === "processing" ? 2000 : 2500;
        setTimeout(() => {
          void pollStatus();
        }, delay);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, "No se pudo consultar el estado del análisis."),
          );
          setLoading(false);
        }
      }
    }

    void pollStatus();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  /* Cuenta el tiempo desde que loading=true (incluye la fase POST antes de tener jobId). */
  useEffect(() => {
    if (!loading) return;
    // Diferir el reset para no disparar setState síncrono en el cuerpo del efecto (React Compiler / eslint)
    queueMicrotask(() => {
      setElapsedSec(0);
    });
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [loading]);

  const canSubmitText = pastedText.trim().length >= 30;

  const jobStatusLabel =
    jobStatus === "pending"
      ? "En cola"
      : jobStatus === "processing"
        ? "Procesando"
        : jobStatus === "completed"
          ? "Completado"
          : jobStatus === "failed"
            ? "Fallido"
            : "";

  const progressTitle = !jobId
    ? "Enviando solicitud"
    : jobStatus === "pending"
      ? "Trabajo en cola"
      : jobStatus === "processing"
        ? "Analizando su campaña"
        : "Actualizando estado";

  const progressLines: string[] = (() => {
    if (!jobId) {
      const lines = [
        "El navegador está llamando a POST /api/analyze. El servidor debe conectar a Redis para encolar el trabajo.",
      ];
      if (elapsedSec >= 5) {
        lines.push(
          "Si este paso tarda mucho, casi siempre es porque Redis no está en marcha (puerto 6379): sin Redis el backend puede quedar esperando y no devuelve el ID del job.",
        );
      }
      return lines;
    }
    if (jobStatus === "pending") {
      return [
        "El job está en la cola (Redis) hasta que el worker lo recoja.",
        "Si esto no avanza en ~1 minuto: abra otra terminal en la carpeta «backend» y ejecute npm run worker:analysis (y tenga Redis en el puerto 6379).",
      ];
    }
    if (jobStatus === "processing") {
      return [
        "El worker está ejecutando el flujo: scraping (si eligió URL), detección de nicho, búsqueda de contexto competitivo y generación del informe con Gemini.",
        "Es normal que tarde 1–4 minutos. No cierre esta página.",
      ];
    }
    return ["Consultando el estado del trabajo…"];
  })();

  return (
    <section className="card-grid">
      <div className="card">
        <div className="card-header-row">
          <div>
            <h2>Solicitud de análisis</h2>
            <p className="muted" style={{ margin: 0 }}>
              URL de landing pública o texto del anuncio (recomendado para redes sociales).
            </p>
          </div>
        </div>
        <div className="callout" role="note">
          <strong>Nota operativa:</strong> el análisis se procesa de forma asíncrona. Requiere Redis y el
          worker activos. Si el job permanece en cola, revise la infraestructura antes de reintentar.
        </div>
        <div className="analysis-tabs">
          <button
            type="button"
            className={mode === "url" ? "analysis-tab active" : "analysis-tab"}
            onClick={() => setMode("url")}
          >
            Por URL
          </button>
          <button
            type="button"
            className={mode === "text" ? "analysis-tab active" : "analysis-tab"}
            onClick={() => setMode("text")}
          >
            Pegar texto
          </button>
        </div>
        <form onSubmit={handleSubmit} className="analysis-form">
          {mode === "url" ? (
            <>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com/landing-campania"
                required
              />
              {urlValidation.errors.url && <p className="error-text">{urlValidation.errors.url}</p>}
            </>
          ) : (
            <>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Pega aquí el copy del anuncio (mín. 30 caracteres)..."
                rows={6}
                minLength={30}
                required={mode === "text"}
                className="analysis-textarea"
              />
              {textValidation.errors.text && <p className="error-text">{textValidation.errors.text}</p>}
            </>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={loading || (mode === "text" && !canSubmitText)}
          >
            {loading
              ? "Procesando..."
              : mode === "url"
              ? "Analizar desde URL"
              : "Analizar texto"}
          </button>
        </form>

        {error && !loading ? (
          <div className="analysis-error-banner" role="alert">
            <p className="analysis-error-banner-title">Análisis no completado</p>
            <p className="analysis-error-banner-text">{error}</p>
          </div>
        ) : null}

        {loading && (
          <div className="analysis-progress" role="status" aria-live="polite">
            <div className="analysis-progress-spinner" aria-hidden />
            <div className="analysis-progress-body">
              <p className="analysis-progress-title">{progressTitle}</p>
              <ul className="analysis-progress-list">
                {progressLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              <p className="analysis-progress-meta">
                {jobId ? (
                  <>
                    ID de trabajo: <code>{jobId}</code> ·{" "}
                  </>
                ) : (
                  <>Aún sin ID de job · </>
                )}
                Tiempo: {elapsedSec}s
              </p>
              {!jobId && elapsedSec > 10 ? (
                <p className="analysis-progress-hint analysis-progress-hint--warn">
                  Sigue sin respuesta: arranque <strong>Redis</strong> (p. ej.{" "}
                  <code>docker run -d -p 6379:6379 redis:7-alpine</code>) y reinicie{" "}
                  <code>npm run dev</code> en la carpeta <code>backend</code>.
                </p>
              ) : null}
              {jobId && jobStatus === "pending" && elapsedSec > 45 ? (
                <p className="analysis-progress-hint analysis-progress-hint--warn">
                  Sigue en cola: confirme que Redis está en ejecución y que en «backend» está activo{" "}
                  <code>npm run worker:analysis</code>.
                </p>
              ) : null}
              {jobId && jobStatus === "processing" && elapsedSec > 120 ? (
                <p className="analysis-progress-hint">
                  Lleva varios minutos: el scraping o la API de Gemini pueden estar lentos. Si supera
                  ~10 minutos, revise la clave GEMINI_API_KEY y los logs del worker.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {!loading && jobStatus !== "idle" && (
          <div className="status-row">
            <span className="muted" style={{ margin: 0 }}>
              Último estado del job
            </span>
            <span className={`status-badge status-badge--${jobStatus}`}>{jobStatusLabel}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="card">
          <div className="card-header-row">
            <div>
              <h2>Informe generado</h2>
              <p className="muted" style={{ margin: 0 }}>
                Incluye comparación con referencias de Meta Ad Library y Google Ads Transparency cuando
                hay datos disponibles.
              </p>
            </div>
          </div>
          <h3>Resumen ejecutivo</h3>
          <p>{result.summary}</p>

          <h3>Scores (1–10)</h3>
          <ul className="score-list">
            <li>Claridad: {result.clarityScore}/10</li>
            <li>Persuasión: {result.persuasionScore}/10</li>
            <li>Diferenciación: {result.differentiationScore}/10</li>
            <li>CTA: {result.ctaScore}/10</li>
            <li>Potencial de conversión: {result.conversionScore}/10</li>
          </ul>

          <h3>Recomendaciones</h3>
          <pre className="recommendations-block">{result.recommendations}</pre>

          <h3>Versión optimizada</h3>
          <pre className="optimized-block">{result.optimizedVersion}</pre>
        </div>
      )}
    </section>
  );
}

type HistoryItem = {
  id: number;
  createdAt: string;
  clarityScore: number;
  persuasionScore: number;
  conversionScore: number;
  campaign: {
    id: number;
    originalText: string;
    createdAt: string;
  };
};

type HistoryResponse = {
  items: HistoryItem[];
  nextCursor: number | null;
};

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  async function loadMore(cursor?: number | null) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (cursor) {
        params.cursor = String(cursor);
      }
      const res = await api.get<HistoryResponse>("/analyses", { params });
      setItems((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "No se pudo cargar el historial de análisis.";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }

  useEffect(() => {
    if (!initialLoaded) {
      void loadMore();
    }
  }, [initialLoaded]);

  async function handleDelete(id: number) {
    if (!window.confirm("¿Seguro que quieres eliminar este análisis?")) return;

    try {
      await api.delete(`/analyses/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "No se pudo eliminar el análisis.";
      setError(message);
      console.error(err);
    }
  }

  return (
    <section className="card-grid">
      <div className="card full-width">
        <div className="card-header-row">
          <div>
            <h2>Historial de informes</h2>
            <p className="muted" style={{ margin: 0 }}>
              Listado cronológico de análisis asociados a su cuenta.
            </p>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        {items.length === 0 && !loading && (
          <p className="muted">No hay informes registrados todavía. Inicie un análisis desde el menú.</p>
        )}
        <ul className="history-list">
          {items.map((item) => (
            <li key={item.id} className="history-item">
              <div className="history-main">
                <h3>
                  Análisis #{item.id} —{" "}
                  {new Date(item.createdAt).toLocaleString("es-ES")}
                </h3>
                <p className="history-snippet">
                  {item.campaign.originalText.slice(0, 160)}
                  {item.campaign.originalText.length > 160 ? "..." : ""}
                </p>
                <div className="history-scores">
                  <span>Claridad: {item.clarityScore}/10</span>
                  <span>Persuasión: {item.persuasionScore}/10</span>
                  <span>Conversión: {item.conversionScore}/10</span>
                </div>
              </div>
              <div className="history-actions">
                <Link to={`/app/analysis/${item.id}`} className="secondary-button-link">
                  Ver detalle
                </Link>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => handleDelete(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
        {nextCursor && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => loadMore(nextCursor)}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Ver más"}
          </button>
        )}
      </div>
    </section>
  );
}

type AnalysisDetailResponse = {
  analysis: AnalysisResponse["analysis"] & {
    campaign: {
      id: number;
      originalText: string;
      createdAt: string;
    };
  };
};

function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AnalysisDetailResponse["analysis"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingCounter, setGeneratingCounter] = useState(false);
  const [counterCopy, setCounterCopy] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<AnalysisDetailResponse>(`/analyses/${id}`);
        setData(res.data.analysis);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "No se pudo cargar el análisis.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" aria-hidden />
        <span>Cargando informe…</span>
      </div>
    );
  }

  if (error) {
    return (
      <section className="card-grid">
        <div className="card full-width">
          <h2>No se pudo cargar el informe</h2>
          <p className="error-text">{error}</p>
          <p className="muted">Si el problema persiste, verifique permisos y que el análisis exista.</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="card-grid">
      <div className="card">
        <div className="card-header-row">
          <div>
            <h2>Entrada — campaña original</h2>
            <p className="muted">
              Registrado el {new Date(data.campaign.createdAt).toLocaleString("es-ES")}
            </p>
          </div>
          <button 
            type="button" 
            className="secondary-button" 
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await api.post("/swipe-file", {
                  platform: "General",
                  advertiserName: "Campaña " + data.campaign.id,
                  text: data.campaign.originalText
                });
                alert("Guardado en tu Swipe File!");
              } catch (e) {
                alert("Error al guardar en el Swipe File.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Guardando..." : "Guardar en Swipe File"}
          </button>
        </div>
        <pre className="optimized-block">{data.campaign.originalText}</pre>
      </div>
      <div className="card">
        <h2>Informe — resultado del análisis</h2>
        <h3>Resumen ejecutivo</h3>
        <p>{data.summary}</p>

        <h3>Scores (1–10)</h3>
        <ul className="score-list">
          <li>Claridad: {data.clarityScore}/10</li>
          <li>Persuasión: {data.persuasionScore}/10</li>
          <li>Diferenciación: {data.differentiationScore}/10</li>
          <li>CTA: {data.ctaScore}/10</li>
          <li>Potencial de conversión: {data.conversionScore}/10</li>
        </ul>

        <h3>Recomendaciones</h3>
        <pre className="recommendations-block">{data.recommendations}</pre>

        <h3>Versión optimizada</h3>
        <pre className="optimized-block">{data.optimizedVersion}</pre>

        <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #e2e8f0" }}>
          <div className="card-header-row">
            <div>
              <h3>Generador de Contra-campaña</h3>
              <p className="muted" style={{ margin: 0 }}>
                Crea un anuncio atacando sutilmente las debilidades de este competidor.
              </p>
            </div>
            <button 
              type="button" 
              className="primary-button" 
              disabled={generatingCounter}
              onClick={async () => {
                setGeneratingCounter(true);
                setCounterCopy(null);
                try {
                  const res = await api.post(`/analyses/${id}/counter`);
                  setCounterCopy(res.data.copy);
                } catch (e) {
                  alert("Error al generar contra-campaña.");
                } finally {
                  setGeneratingCounter(false);
                }
              }}
            >
              {generatingCounter ? "Redactando IA..." : "Generar Ad Ofensivo"}
            </button>
          </div>
          
          {counterCopy && (
            <div style={{ marginTop: "1.5rem" }}>
              <h4>💡 Nuevo Copy Sugerido:</h4>
              <pre className="recommendations-block" style={{ backgroundColor: "#f0f9ff", borderColor: "#bae6fd", color: "#0369a1" }}>
                {counterCopy}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type SavedAd = {
  id: number;
  platform: string;
  advertiserName: string;
  text: string;
  createdAt: string;
};

function SwipeFilePage() {
  const [items, setItems] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get<SavedAd[]>("/swipe-file");
        setItems(res.data);
      } catch (err: unknown) {
        setError("No se pudo cargar tu Swipe File.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este anuncio guardado?")) return;
    try {
      await api.delete(`/swipe-file/${id}`);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch (err) {
      alert("No se pudo eliminar.");
    }
  }

  return (
    <section className="card-grid">
      <div className="card full-width">
        <div className="card-header-row">
          <div>
            <h2>Swipe File (Anuncios Guardados)</h2>
            <p className="muted" style={{ margin: 0 }}>
              Tu biblioteca de anuncios para inspiración.
            </p>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        {loading && <p>Cargando...</p>}
        {!loading && items.length === 0 && <p className="muted">Tu biblioteca está vacía.</p>}
        {!loading && items.length > 0 && (
          <ul className="history-list">
            {items.map((ad) => (
              <li key={ad.id} className="history-item">
                <div className="history-main">
                  <h3>{ad.advertiserName || "Anuncio sin autor"} ({ad.platform})</h3>
                  <p className="history-snippet">{ad.text}</p>
                </div>
                <div className="history-actions">
                  <button type="button" className="danger-button" onClick={() => handleDelete(ad.id)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" aria-hidden />
        <span>Verificando sesión…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/analyze"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <NewAnalysisPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/history"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <HistoryPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/swipe-file"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <SwipeFilePage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/photo-ai"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <PhotoEditorPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/analysis/:id"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <AnalysisDetailPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
