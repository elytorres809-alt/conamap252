/* ============================================================
   reportar.js  ->  envía el reporte o sugerencia al servidor

   El navegador NO puede mandar correos por sí solo (por seguridad).
   Por eso este archivo le manda el mensaje a nuestro servidor
   (server.js, alojado en un hosting gratuito), y el servidor es quien
   lo envía a conamap252@gmail.com.
   ============================================================ */

// ⚠ CAMBIA ESTO cuando tengas tu servidor en el hosting:
// la dirección que te da Render, sin "/" al final. Ejemplo:
//   "https://conamap-servidor.onrender.com"
const URL_SERVIDOR = "https://conamap-servidor.onrender.com";

// En tu computadora (localhost) se usa el servidor local; en internet, el del hosting
const ES_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const BASE = ES_LOCAL ? "" : URL_SERVIDOR;
const URL_ENVIO = BASE + "/api/reportar";
const SIN_CONFIGURAR = !ES_LOCAL && URL_SERVIDOR.includes("TU-SERVIDOR");

const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");
const contador = document.getElementById("contador");
const botonEnviar = document.getElementById("enviar");
const estado = document.getElementById("estado");

/* Los hostings gratuitos "duermen" el servidor si nadie lo usa y tarda en
   despertar (puede ser casi un minuto). Al abrir esta página le tocamos la
   puerta, para que ya esté despierto cuando termines de escribir. */
if (!SIN_CONFIGURAR) {
  fetch(BASE + "/salud", { mode: "no-cors" }).catch(function () { /* no pasa nada */ });
}

// Contador de caracteres
mensaje.addEventListener("input", function () {
  contador.textContent = mensaje.value.length;
});

function avisar(texto, clase) {
  estado.textContent = texto;
  estado.className = "reporte__estado " + (clase || "");
}

formulario.addEventListener("submit", async function (e) {
  e.preventDefault();                       // evita que la página se recargue

  if (SIN_CONFIGURAR) {
    avisar("El envío de reportes aún no está configurado. Escríbenos a conamap252@gmail.com.", "error");
    return;
  }

  const texto = mensaje.value.trim();
  if (texto.length < 10) {
    avisar("Escribe al menos 10 caracteres para que podamos entenderte.", "error");
    return;
  }

  botonEnviar.disabled = true;              // evita enviar dos veces
  avisar("Enviando… (si el servidor estaba dormido, puede tardar hasta un minuto)");

  // Si pasan 90 segundos sin respuesta, cancelamos
  const control = new AbortController();
  const limite = setTimeout(function () { control.abort(); }, 90000);

  try {
    const respuesta = await fetch(URL_ENVIO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: control.signal,
      body: JSON.stringify({
        tipo: formulario.elements["tipo"].value,
        mensaje: texto,
        web: document.getElementById("web").value   // campo trampa anti-robots
      })
    });
    const datos = await respuesta.json().catch(function () { return {}; });

    if (respuesta.ok && datos.ok) {
      avisar("¡Gracias! Tu mensaje fue enviado de forma anónima.", "ok");
      formulario.reset();
      contador.textContent = "0";
    } else {
      avisar(datos.error || "No se pudo enviar. Intenta de nuevo más tarde.", "error");
    }
  } catch (error) {
    avisar("No hay conexión con el servidor. Intenta de nuevo en un momento.", "error");
  }
  clearTimeout(limite);
  botonEnviar.disabled = false;
});
