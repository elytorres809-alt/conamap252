/* ============================================================
   mapa.js  ->  la LÓGICA de la página del mapa
   Hace 6 cosas:
     1) Crea un botón (ícono) por cada lugar de lugares.js
     2) Al tocar un ícono, muestra su información en el panel
     3) Filtra los íconos por categoría
     4) Acerca y aleja el mapa (zoom)
     5) Conecta los buscadores "¿Dónde estás?" y "¿A dónde quieres ir?"
     6) Traza la ruta y encuadra el mapa para que se vea completa

   Este archivo usa cosas de los demás:
     lugares.js  -> LUGARES        caminos.js -> NODOS, CAMINOS, ACCESOS
     ruta.js     -> calcularRuta, dibujarRuta, borrarRuta
     buscador.js -> OPCIONES, crearBuscador
   ============================================================ */

// Tamaño original del SVG (sirve para convertir x,y a porcentajes)
const ANCHO_SVG = 911;
const ALTO_SVG = 1061;

// Nombres bonitos para mostrar la categoría en el panel
const NOMBRE_CATEGORIA = {
  aulas: "Aula",
  laboratorios: "Laboratorio",
  talleres: "Taller",
  servicios: "Servicio",
  deportivo: "Área deportiva"
};

// Elementos del HTML que vamos a usar
const mapa = document.getElementById("mapa");
const visor = document.getElementById("visor");
const infoIcono = document.getElementById("info-icono");
const infoNombre = document.getElementById("info-nombre");
const infoEdificio = document.getElementById("info-edificio");
const infoCategoria = document.getElementById("info-categoria");
const botonAqui = document.getElementById("boton-aqui");
const botonIr = document.getElementById("boton-ir");
const rutaResumen = document.getElementById("ruta-resumen");
const botonBorrarRuta = document.getElementById("borrar-ruta");
const botonIntercambiar = document.getElementById("intercambiar");

let marcadorActivo = null; // el ícono seleccionado en este momento
let lugarActual = null;    // el lugar que se muestra en el panel


/* ---------- 1) Crear los íconos ---------- */
function crearMarcadores() {
  LUGARES.forEach(function (lugar) {
    const boton = document.createElement("button");

    boton.className = "marcador marcador--" + lugar.categoria;
    boton.textContent = lugar.icono;
    boton.title = lugar.nombre;                    // texto al pasar el mouse
    boton.setAttribute("aria-label", lugar.nombre); // para lectores de pantalla
    boton.dataset.categoria = lugar.categoria;      // lo usan los filtros

    // Convertimos la posición a porcentaje para que funcione con cualquier zoom
    boton.style.left = (lugar.x / ANCHO_SVG) * 100 + "%";
    boton.style.top = (lugar.y / ALTO_SVG) * 100 + "%";

    boton.addEventListener("click", function () {
      seleccionarLugar(lugar, boton);
    });

    mapa.appendChild(boton);
  });
}


/* ---------- 2) Seleccionar un lugar ---------- */
function seleccionarLugar(lugar, boton) {
  // Quitamos el efecto al anterior y se lo ponemos al nuevo
  if (marcadorActivo) marcadorActivo.classList.remove("activo");
  boton.classList.add("activo");
  marcadorActivo = boton;
  lugarActual = lugar;

  // Llenamos el panel de información
  infoIcono.textContent = lugar.icono;
  infoNombre.textContent = lugar.nombre;
  infoEdificio.textContent = "Ubicación: " + lugar.edificio;
  infoCategoria.textContent = NOMBRE_CATEGORIA[lugar.categoria];

  // Activamos los botones "Estoy aquí" y "Quiero ir aquí"
  botonAqui.disabled = false;
  botonIr.disabled = false;

  // Centramos el ícono dentro del visor
  visor.scrollTo({
    left: boton.offsetLeft - visor.clientWidth / 2,
    top: boton.offsetTop - visor.clientHeight / 2,
    behavior: "smooth"
  });
}

// Busca en la lista de opciones la que corresponde al lugar del panel
function opcionDelLugarActual() {
  return OPCIONES.find(function (o) { return o.lugarId === lugarActual.id; });
}

botonAqui.addEventListener("click", function () {
  buscadorOrigen.poner(opcionDelLugarActual(), true);
});
botonIr.addEventListener("click", function () {
  buscadorDestino.poner(opcionDelLugarActual(), true);
});


/* ---------- 3) Filtros ---------- */
function activarFiltros() {
  const botonesFiltro = document.querySelectorAll(".filtro");

  botonesFiltro.forEach(function (filtro) {
    filtro.addEventListener("click", function () {
      const categoria = filtro.dataset.categoria;

      // Marca visualmente el filtro elegido
      botonesFiltro.forEach(function (f) { f.classList.remove("activo"); });
      filtro.classList.add("activo");

      // Muestra u oculta cada ícono según su categoría
      document.querySelectorAll(".marcador").forEach(function (marcador) {
        const coincide = categoria === "todos" || marcador.dataset.categoria === categoria;
        marcador.classList.toggle("oculto", !coincide);
      });
    });
  });
}


/* ---------- 4) Zoom ----------
   El visor SIEMPRE ocupa todo el ancho de la pantalla. Lo que cambia con
   el zoom es el tamaño del mapa DENTRO del visor:
     zoom 1 = el mapa llena justo el ancho del visor (nunca más chico)
     zoom 3 = el mapa es 3 veces más ancho y se recorre con scroll */
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
let zoom = ZOOM_MIN;

function fijarZoom(nuevo) {
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nuevo));
  mapa.style.width = zoom * 100 + "%";
}

document.getElementById("zoom-mas").addEventListener("click", function () {
  fijarZoom(zoom + 0.5);
});
document.getElementById("zoom-menos").addEventListener("click", function () {
  fijarZoom(zoom - 0.5);
});


/* ---------- 5) Buscadores y ruta ---------- */
// Cada buscador avisa a "actualizarRuta" cuando se elige o se borra un lugar
const buscadorOrigen = crearBuscador("origen", actualizarRuta);
const buscadorDestino = crearBuscador("destino", actualizarRuta);

function actualizarRuta() {
  const origen = buscadorOrigen.obtener();
  const destino = buscadorDestino.obtener();

  borrarRuta();
  botonBorrarRuta.hidden = !(origen || destino);

  // Faltan datos
  if (!origen && !destino) { rutaResumen.textContent = ""; return; }
  if (!origen) { rutaResumen.textContent = "Ahora elige dónde estás."; return; }
  if (!destino) { rutaResumen.textContent = "Ahora elige a dónde quieres ir."; return; }

  // Mismo lugar en los dos
  if (origen.id === destino.id) {
    rutaResumen.textContent = "Estás en el mismo lugar. Elige un destino distinto.";
    return;
  }

  // Calculamos y dibujamos
  const ruta = calcularRuta(origen, destino);
  if (!ruta) {
    rutaResumen.textContent = "No pudimos trazar una ruta entre esos lugares.";
    return;
  }

  dibujarRuta(ruta);
  rutaResumen.textContent = "Ruta de " + origen.nombre + " a " + destino.nombre + ".";
  encuadrarRuta(ruta.puntos);
}

// Botón ⇅: intercambia origen y destino
botonIntercambiar.addEventListener("click", function () {
  const origen = buscadorOrigen.obtener();
  const destino = buscadorDestino.obtener();
  buscadorOrigen.poner(destino, false);
  buscadorDestino.poner(origen, false);
  actualizarRuta();
});

// Botón "Borrar ruta": limpia los dos buscadores
botonBorrarRuta.addEventListener("click", function () {
  buscadorOrigen.limpiar(false);
  buscadorDestino.limpiar(false);
  actualizarRuta();
});


/* ---------- 6) Encuadrar la ruta ----------
   Ajusta el zoom y mueve el visor para que la ruta completa se vea. */
function encuadrarRuta(puntos) {
  // Rectángulo que contiene todos los puntos de la ruta
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  puntos.forEach(function (p) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });

  const margen = 50; // espacio extra alrededor de la ruta
  const ancho = (maxX - minX) + margen * 2;
  const alto = (maxY - minY) + margen * 2;

  // Zoom máximo con el que la ruta cabe en el visor (a lo ancho y a lo alto)
  const zoomAncho = ANCHO_SVG / ancho;
  const zoomAlto = (visor.clientHeight * ANCHO_SVG) / (visor.clientWidth * alto);
  fijarZoom(Math.floor(Math.min(zoomAncho, zoomAlto) * 4) / 4); // en pasos de 0.25

  // Centramos el visor en medio de la ruta
  const px = mapa.offsetWidth / ANCHO_SVG; // cuántos píxeles mide cada unidad del SVG
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;
  visor.scrollTo({
    left: centroX * px - visor.clientWidth / 2,
    top: centroY * px - visor.clientHeight / 2,
    behavior: "smooth"
  });

  // Si el mapa quedó fuera de la pantalla, la página baja hasta mostrarlo
  visor.scrollIntoView({ behavior: "smooth", block: "nearest" });
}


/* ---------- Arranque ---------- */
crearMarcadores();
activarFiltros();
fijarZoom(window.innerWidth < 600 ? 1.5 : 1); // en celular empieza un poco más grande
