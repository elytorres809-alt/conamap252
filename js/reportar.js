/* ============================================================
   reportar.js  ->  envía el reporte o sugerencia al servidor

   El navegador NO puede mandar correos por sí solo (por seguridad).
   Por eso este archivo le manda el mensaje a nuestro servidor
   (server.js), y el servidor es quien lo envía a conamap252@gmail.com.
   ============================================================ */

// Dirección del servidor. Si corres "node server.js" y abres la página desde
// él (http://localhost:3000), déjalo así. Si la página está en GitHub Pages y
// el servidor en otro lado, pon aquí la dirección completa, por ejemplo:
//   "https://conamap-servidor.onrender.com/api/reportar"
const URL_ENVIO = "/api/reportar";

const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");
const contador = document.getElementById("contador");
const botonEnviar = document.getElementById("enviar");
const estado = document.getElementById("estado");

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

  const texto = mensaje.value.trim();
  if (texto.length < 10) {
    avisar("Escribe al menos 10 caracteres para que podamos entenderte.", "error");
    return;
  }

  botonEnviar.disabled = true;              // evita enviar dos veces
  avisar("Enviando…");

  try {
    const respuesta = await fetch(URL_ENVIO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    avisar("No hay conexión con el servidor. Intenta de nuevo más tarde.", "error");
  }
  botonEnviar.disabled = false;
});
