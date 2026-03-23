/**
 * Mensaje legible para errores de Axios (red, timeout, respuesta HTTP).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;

  const e = err as {
    code?: string;
    message?: string;
    response?: { data?: { message?: string }; status?: number };
  };

  // Sin respuesta del servidor (backend apagado, CORS, DNS…)
  if (
    e.code === "ERR_NETWORK" ||
    e.message === "Network Error" ||
    (e.message && /network/i.test(e.message))
  ) {
    return (
      "No se pudo conectar con la API. Compruebe que el backend esté en ejecución " +
      "(en la carpeta «backend»: npm run dev, puerto 4000) y que la URL en " +
      "VITE_API_BASE_URL sea correcta."
    );
  }

  if (e.code === "ECONNABORTED" || /timeout/i.test(e.message ?? "")) {
    return (
      "La solicitud tardó demasiado (tiempo de espera agotado). " +
      "Si estaba encolando un análisis, suele indicar que Redis no responde en el puerto 6379: " +
      "arranque Redis (por ejemplo con Docker) y reinicie el backend."
    );
  }

  const serverMsg = e.response?.data?.message;
  if (typeof serverMsg === "string" && serverMsg.trim().length > 0) {
    return serverMsg;
  }

  return fallback;
}
