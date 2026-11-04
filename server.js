/* ============================================================
   server.js  ->  servidor de Conamap (Node.js)

   Hace 2 cosas:
     1) Recibe los reportes en POST /api/reportar y los envía por correo
        a conamap252@gmail.com, de forma ANÓNIMA: la persona nunca pone
        su correo, y aquí no guardamos ni su IP ni su mensaje.
     2) (Solo en tu computadora) Muestra la página para probarla.

   DÓNDE CORRE:
     - En INTERNET: en un hosting gratuito (ej. Render). La página vive en
       GitHub Pages y le manda los reportes a este servidor.
     - En tu COMPUTADORA: con "npm run dev" para hacer pruebas.

   VARIABLES DE CONFIGURACIÓN (en .env local, o en el panel del hosting):
     GMAIL_USER, GMAIL_APP_PASSWORD  -> la cuenta que envía los correos
     ORIGEN_PERMITIDO                -> quién puede mandar reportes (tu página)
     SOLO_API=1                      -> en el hosting: no mostrar la página
   ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PUERTO = process.env.PORT || 3000;      // el hosting define PORT solo
const DESTINO = "conamap252@gmail.com";       // a dónde llegan los reportes
const SOLO_API = process.env.SOLO_API === "1";

/* ---------- Quién puede usar la API (CORS) ----------
   Los navegadores bloquean que una página (GitHub Pages) hable con otro
   servidor, a menos que el servidor lo permita. Aquí decimos quién sí puede.
   Ejemplo: ORIGEN_PERMITIDO=https://tuusuario.github.io
   Puedes poner varios separados por coma. Sin nada, permite a todos ("*"). */
const PERMITIDOS = (process.env.ORIGEN_PERMITIDO || "*")
  .split(",").map(function (s) { return s.trim(); }).filter(Boolean);

function origenPermitido(req) {
  const origen = req.headers.origin;
  if (!origen) return true;                                  // no es un navegador (ej. una prueba con curl)
  if (PERMITIDOS.includes("*") || PERMITIDOS.includes(origen)) return true;
  try { return new URL(origen).host === req.headers.host; }  // la misma página que sirve este servidor
  catch (e) { return false; }
}

function cabecerasCors(req) {
  const origen = req.headers.origin;
  if (!origen || !origenPermitido(req)) return {};
  return {
    "Access-Control-Allow-Origin": PERMITIDOS.includes("*") ? "*" : origen,
    "Vary": "Origin"
  };
}

/* ---------- Envío de correo por HTTPS (servicio Resend) ----------
   El plan gratis de Render bloquea el correo normal (SMTP), y por eso el
   servidor se quedaba esperando. Resend envía por internet (HTTPS), que sí
   se permite. Se configura con la variable RESEND_API_KEY. */
async function enviarCorreo(datos) {
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Conamap <onboarding@resend.dev>",   // remitente de prueba de Resend
      to: [DESTINO],
      subject: datos.subject,
      text: datos.text
    }),
    signal: AbortSignal.timeout(20000)           // si en 20 s no responde, falla (no se queda colgado)
  });
  if (!respuesta.ok) {
    throw new Error("Resend respondió " + respuesta.status + ": " + (await respuesta.text()));
  }
}

/* ---------- Límites de envío (anti-spam) ----------
   - 5 reportes por hora por persona
   - 40 reportes por hora en total (protege la cuenta de Gmail)
   Se guarda solo en memoria y se borra solo; no se escribe en ningún archivo. */
const MAX_POR_PERSONA = 5;
const MAX_TOTAL = 40;
const envios = new Map();      // ip -> horas de envío
let totalHora = 0;

// Detrás del hosting, la IP real viene en la cabecera x-forwarded-for
function ipDe(req) {
  const reenviada = req.headers["x-forwarded-for"];
  return (reenviada ? reenviada.split(",")[0].trim() : req.socket.remoteAddress) || "desconocida";
}

function demasiados(ip) {
  const ahora = Date.now();
  const recientes = (envios.get(ip) || []).filter(function (t) { return ahora - t < 3600000; });
  if (recientes.length >= MAX_POR_PERSONA || totalHora >= MAX_TOTAL) return true;
  recientes.push(ahora);
  envios.set(ip, recientes);
  totalHora++;
  return false;
}
setInterval(function () { envios.clear(); totalHora = 0; }, 3600000);   // limpieza cada hora

/* ---------- Ayudas ---------- */
function responder(req, res, codigo, objeto) {
  res.writeHead(codigo, Object.assign({ "Content-Type": "application/json; charset=utf-8" }, cabecerasCors(req)));
  res.end(JSON.stringify(objeto));
}

// Lee el cuerpo de la petición (con tope de 10 KB)
function leerCuerpo(req) {
  return new Promise(function (resolver, rechazar) {
    let datos = "";
    req.on("data", function (trozo) {
      datos += trozo;
      if (datos.length > 10000) { rechazar(new Error("demasiado grande")); req.destroy(); }
    });
    req.on("end", function () { resolver(datos); });
    req.on("error", rechazar);
  });
}

/* ---------- Recibir un reporte ---------- */
async function recibirReporte(req, res) {
  if (!origenPermitido(req)) {
    return responder(req, res, 403, { ok: false, error: "Origen no permitido." });
  }
  if (demasiados(ipDe(req))) {
    return responder(req, res, 429, { ok: false, error: "Se enviaron muchos mensajes. Intenta de nuevo más tarde." });
  }

  let datos;
  try { datos = JSON.parse(await leerCuerpo(req)); }
  catch (e) { return responder(req, res, 400, { ok: false, error: "Mensaje no válido." }); }

  // Si el campo trampa viene lleno, es un robot: fingimos que salió bien y no enviamos nada
  if (datos.web) return responder(req, res, 200, { ok: true });

  const tipo = datos.tipo === "sugerencia" ? "Sugerencia" : "Problema";
  const mensaje = typeof datos.mensaje === "string" ? datos.mensaje.trim() : "";
  if (mensaje.length < 10 || mensaje.length > 1500) {
    return responder(req, res, 400, { ok: false, error: "El mensaje debe tener entre 10 y 1500 caracteres." });
  }

  try {
    await enviarCorreo({
      subject: "[Conamap] " + tipo + " anónimo",
      text: "Tipo: " + tipo + "\nFecha: " + new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }) + "\n\n" + mensaje
    });
    responder(req, res, 200, { ok: true });
  } catch (error) {
    console.error("No se pudo enviar el correo:", error.message);
    responder(req, res, 500, { ok: false, error: "No se pudo enviar. Intenta más tarde." });
  }
}

/* ---------- Servir la página (solo para pruebas en tu computadora) ---------- */
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon"
};

function servirArchivo(req, res) {
  let ruta = decodeURIComponent(req.url.split("?")[0]);
  if (ruta === "/") ruta = "/index.html";

  const archivo = path.join(__dirname, ruta);
  const tipo = TIPOS[path.extname(archivo).toLowerCase()];

  // Seguridad: solo archivos de la carpeta del proyecto y de tipos permitidos
  // (así nadie puede pedir .env, server.js ni nada fuera de la página)
  if (!archivo.startsWith(__dirname + path.sep) || !tipo || archivo.includes(path.sep + "respaldo" + path.sep)) {
    res.writeHead(404); return res.end("No encontrado");
  }
  fs.readFile(archivo, function (error, contenido) {
    if (error) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "Content-Type": tipo });
    res.end(contenido);
  });
}

/* ---------- El servidor ---------- */
http.createServer(function (req, res) {
  const ruta = req.url.split("?")[0];

  // /salud: el hosting la usa para saber que el servidor está vivo,
  // y la página la usa para "despertarlo" (los hostings gratis se duermen)
  if (ruta === "/salud") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  if (ruta === "/api/reportar") {
    if (req.method === "OPTIONS") {            // permiso previo del navegador (CORS)
      res.writeHead(204, Object.assign({
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }, cabecerasCors(req)));
      return res.end();
    }
    if (req.method === "POST") return recibirReporte(req, res);
    return responder(req, res, 405, { ok: false, error: "Método no permitido." });
  }

  if (SOLO_API) return responder(req, res, 200, { ok: true, servicio: "Conamap (reportes)" });
  if (req.method === "GET") return servirArchivo(req, res);
  res.writeHead(405); res.end();
}).listen(PUERTO, function () {
  console.log("Conamap funcionando en el puerto " + PUERTO + (SOLO_API ? " (solo API)" : " -> http://localhost:" + PUERTO));
});
