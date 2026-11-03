/* ============================================================
   server.js  ->  servidor de Conamap (Node.js)

   Hace 2 cosas:
     1) Muestra la página (sirve los archivos html, css, js e imágenes).
     2) Recibe los reportes en POST /api/reportar y los envía por correo
        a conamap252@gmail.com, de forma ANÓNIMA: la persona nunca pone
        su correo, y aquí no guardamos ni su IP ni su mensaje.

   Cómo usarlo (en la carpeta del proyecto):
     1) npm install
     2) copia .env.example como .env y llena tus datos
     3) npm start
     4) abre http://localhost:3000
   ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const PUERTO = process.env.PORT || 3000;
const DESTINO = "conamap252@gmail.com";                 // a dónde llegan los reportes
const ORIGEN_PERMITIDO = process.env.ORIGEN_PERMITIDO || "*"; // quién puede llamar a la API desde otro sitio

// El "cartero": usa una cuenta de Gmail para ENVIAR (los datos van en .env, nunca en el código)
const cartero = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
});

/* ---------- Límite de envíos (anti-spam) ----------
   Máximo 5 reportes por hora desde la misma conexión.
   Se guarda solo en memoria y se borra solo; no se escribe en ningún archivo. */
const MAX_POR_HORA = 5;
const envios = new Map();            // ip -> lista de horas de envío

function demasiados(ip) {
  const ahora = Date.now();
  const recientes = (envios.get(ip) || []).filter(function (t) { return ahora - t < 3600000; });
  if (recientes.length >= MAX_POR_HORA) return true;
  recientes.push(ahora);
  envios.set(ip, recientes);
  return false;
}
setInterval(function () { envios.clear(); }, 3600000);   // limpieza cada hora

/* ---------- Ayudas ---------- */
function responder(res, codigo, objeto) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ORIGEN_PERMITIDO
  });
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
  const ip = req.socket.remoteAddress;
  if (demasiados(ip)) {
    return responder(res, 429, { ok: false, error: "Enviaste muchos mensajes. Intenta de nuevo en una hora." });
  }

  let datos;
  try { datos = JSON.parse(await leerCuerpo(req)); }
  catch (e) { return responder(res, 400, { ok: false, error: "Mensaje no válido." }); }

  // Si el campo trampa viene lleno, es un robot: fingimos que salió bien y no enviamos nada
  if (datos.web) return responder(res, 200, { ok: true });

  const tipo = datos.tipo === "sugerencia" ? "Sugerencia" : "Problema";
  const mensaje = typeof datos.mensaje === "string" ? datos.mensaje.trim() : "";
  if (mensaje.length < 10 || mensaje.length > 1500) {
    return responder(res, 400, { ok: false, error: "El mensaje debe tener entre 10 y 1500 caracteres." });
  }

  try {
    await cartero.sendMail({
      from: '"Conamap (reporte anónimo)" <' + process.env.GMAIL_USER + ">",
      to: DESTINO,
      subject: "[Conamap] " + tipo + " anónimo",
      text: "Tipo: " + tipo + "\nFecha: " + new Date().toLocaleString("es-MX") + "\n\n" + mensaje
    });
    responder(res, 200, { ok: true });
  } catch (error) {
    console.error("No se pudo enviar el correo:", error.message);
    responder(res, 500, { ok: false, error: "No se pudo enviar. Intenta más tarde." });
  }
}

/* ---------- Servir la página ---------- */
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
  if (req.url === "/api/reportar") {
    if (req.method === "OPTIONS") {            // permiso previo del navegador (CORS)
      res.writeHead(204, {
        "Access-Control-Allow-Origin": ORIGEN_PERMITIDO,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      return res.end();
    }
    if (req.method === "POST") return recibirReporte(req, res);
    return responder(res, 405, { ok: false, error: "Método no permitido." });
  }
  if (req.method === "GET") return servirArchivo(req, res);
  res.writeHead(405); res.end();
}).listen(PUERTO, function () {
  console.log("Conamap funcionando en http://localhost:" + PUERTO);
});
