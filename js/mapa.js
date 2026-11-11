/* ============================================================
   mapa.js  ->  la LÓGICA de la página del mapa
   Hace 7 cosas:
     1) Crea un botón (ícono) por cada lugar de lugares.js
     2) Al tocar un ícono, abre la TARJETA con su información
     3) Filtra los íconos por categoría
     4) Mueve y hace zoom al mapa como Google Maps
        (arrastrar, rueda del mouse, pellizco con 2 dedos, botones)
     5) Conecta los buscadores "¿Dónde estás?" y "¿A dónde quieres ir?"
     6) Traza la ruta y encuadra el mapa para que se vea completa
     7) Arranca todo

   Usa cosas de los demás archivos:
     lugares.js -> LUGARES      info-lugares.js -> INFO_LUGARES
     caminos.js -> NODOS, CAMINOS, ACCESOS
     ruta.js    -> calcularRuta, dibujarRuta, borrarRuta
     buscador.js-> OPCIONES, crearBuscador
   ============================================================ */

// Tamaño original del SVG (sirve para convertir x,y a porcentajes)
const ANCHO_SVG = 911;
const ALTO_SVG = 1061;

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
const imagen = document.querySelector(".mapa__imagen");
const tarjeta = document.getElementById("tarjeta");
const galeria = document.getElementById("galeria");
const banner = document.getElementById("banner");
const tCategoria = document.getElementById("t-categoria");
const tNombre = document.getElementById("t-nombre");
const tEdificio = document.getElementById("t-edificio");
const tDescripcion = document.getElementById("t-descripcion");
const tDatos = document.getElementById("t-datos");
const botonAqui = document.getElementById("boton-aqui");
const botonIr = document.getElementById("boton-ir");
const rutaResumen = document.getElementById("ruta-resumen");
const botonBorrarRuta = document.getElementById("borrar-ruta");
const botonIntercambiar = document.getElementById("intercambiar");

let marcadorActivo = null; // el ícono seleccionado en este momento
let lugarActual = null;    // el lugar que se muestra en la tarjeta


/* ---------- 1) Crear los íconos ---------- */
function crearMarcadores() {
  LUGARES.forEach(function (lugar) {
    const boton = document.createElement("button");

    boton.className = "marcador marcador--" + lugar.categoria;
    boton.textContent = lugar.icono;
    boton.title = lugar.nombre;
    boton.setAttribute("aria-label", lugar.nombre);
    boton.dataset.categoria = lugar.categoria;

    // Posición en porcentaje para que funcione con cualquier tamaño
    boton.style.left = (lugar.x / ANCHO_SVG) * 100 + "%";
    boton.style.top = (lugar.y / ALTO_SVG) * 100 + "%";

    boton.addEventListener("click", function () {
      seleccionarLugar(lugar, boton);
    });

    mapa.appendChild(boton);
  });
}


/* ---------- 2) La tarjeta de información ---------- */
function seleccionarLugar(lugar, boton) {
  if (marcadorActivo) marcadorActivo.classList.remove("activo");
  boton.classList.add("activo");
  marcadorActivo = boton;
  lugarActual = lugar;

  // Datos extra de js/info-lugares.js (si el lugar no está ahí, queda vacío)
  const info = INFO_LUGARES[lugar.id] || {};

  tCategoria.textContent = lugar.icono + " " + NOMBRE_CATEGORIA[lugar.categoria];
  tNombre.textContent = lugar.nombre;
  tEdificio.textContent = "Ubicación: " + lugar.edificio + (lugar.piso === 2 ? " · 2.º piso" : "");
  tDescripcion.textContent = info.descripcion || "";
  tDescripcion.hidden = !info.descripcion;

  tDatos.replaceChildren();
  (info.datos || []).forEach(function (dato) {
    const li = document.createElement("li");
    li.textContent = dato;
    tDatos.appendChild(li);
  });

  mostrarFotos(lugar, info.fotos || []);

  tarjeta.scrollTop = 0;
  tarjeta.classList.remove("oculta");
  centrarEn(lugar);
}

// Pone las fotos en la tarjeta; si no hay (o no cargan), muestra el ícono grande
function mostrarFotos(lugar, fotos) {
  galeria.replaceChildren();
  galeria.hidden = fotos.length === 0;
  banner.hidden = fotos.length > 0;
  banner.textContent = lugar.icono;

  fotos.forEach(function (ruta) {
    const img = document.createElement("img");
    img.src = ruta;
    img.alt = "Foto de " + lugar.nombre;
    img.title = "Toca para ver la siguiente foto";

    // Si la foto no existe, la quitamos para no mostrar una imagen rota
    img.addEventListener("error", function () {
      img.remove();
      if (galeria.children.length === 0) {
        galeria.hidden = true;
        banner.hidden = false;
      }
    });
    // Al tocar una foto, pasa a la siguiente (y da la vuelta al final)
    img.addEventListener("click", function () {
      const alFinal = galeria.scrollLeft + galeria.clientWidth >= galeria.scrollWidth - 5;
      galeria.scrollTo({ left: alFinal ? 0 : galeria.scrollLeft + galeria.clientWidth, behavior: "smooth" });
    });
    galeria.appendChild(img);
  });
}

function cerrarTarjeta() {
  tarjeta.classList.add("oculta");
  if (marcadorActivo) marcadorActivo.classList.remove("activo");
  marcadorActivo = null;
}
document.getElementById("tarjeta-cerrar").addEventListener("click", cerrarTarjeta);
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") cerrarTarjeta();
});

// Busca en la lista de opciones la que corresponde al lugar de la tarjeta
function opcionDelLugarActual() {
  return OPCIONES.find(function (o) { return o.lugarId === lugarActual.id; });
}
botonAqui.addEventListener("click", function () {
  buscadorOrigen.poner(opcionDelLugarActual(), true);
  cerrarTarjeta(); // se cierra para poder ver la ruta
});
botonIr.addEventListener("click", function () {
  buscadorDestino.poner(opcionDelLugarActual(), true);
  cerrarTarjeta();
});


/* ---------- 3) Filtros ---------- */
function activarFiltros() {
  const botonesFiltro = document.querySelectorAll(".filtro");

  botonesFiltro.forEach(function (filtro) {
    filtro.addEventListener("click", function () {
      const categoria = filtro.dataset.categoria;

      botonesFiltro.forEach(function (f) { f.classList.remove("activo"); });
      filtro.classList.add("activo");

      document.querySelectorAll(".marcador").forEach(function (marcador) {
        const coincide = categoria === "todos" || marcador.dataset.categoria === categoria;
        marcador.classList.toggle("oculto", !coincide);
      });
    });
  });
}


/* ---------- 4) Mover y hacer zoom (como Google Maps) ----------
   Tres números controlan todo:
     x, y   = cuánto se movió el mapa (en píxeles)
     escala = cuánto zoom tiene (1 = el mapa llena el ancho del visor)
   Cada gesto solo cambia esos números y llama a aplicar().
   Usamos "Pointer Events": una sola API que entiende mouse y dedos. */
let escala = 1, x = 0, y = 0;
let ESCALA_MIN = 1;          // se calcula para que el mapa completo quepa en el visor
const ESCALA_MAX = 4;

// Calcula el zoom mínimo: el que deja ver TODO el mapa dentro del visor
function fijarLimites() {
  ESCALA_MIN = Math.min(1, visor.clientHeight / mapa.offsetHeight);
  escala = Math.max(escala, ESCALA_MIN);
}

// Aplica x, y y escala al mapa, sin dejar que se pierda de vista
function aplicar() {
  const vw = visor.clientWidth, vh = visor.clientHeight;
  const mw = mapa.offsetWidth * escala, mh = mapa.offsetHeight * escala;

  // Si el mapa es más chico que el visor se centra; si no, se limitan los bordes
  x = mw <= vw ? (vw - mw) / 2 : Math.min(0, Math.max(vw - mw, x));
  y = mh <= vh ? (vh - mh) / 2 : Math.min(0, Math.max(vh - mh, y));

  mapa.style.transform = "translate(" + x + "px, " + y + "px) scale(" + escala + ")";

  // Los íconos se achican al mismo ritmo que crece el mapa, así no se hacen gigantes.
  // Con el mapa completo se ven un poco más chicos para que no se amontonen.
  const tam = Math.min(1, 0.6 + 0.4 * (escala / ESCALA_MIN - 1));
  mapa.style.setProperty("--inv", tam / escala);
}

// Zoom dejando fijo el punto (cx, cy): el que está bajo el cursor o los dedos
function zoomEn(factor, cx, cy) {
  const nueva = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala * factor));
  const real = nueva / escala;
  x = cx - (cx - x) * real;
  y = cy - (cy - y) * real;
  escala = nueva;
  aplicar();
}

// Animación suave para botones y centrados (se quita sola)
function animar() {
  mapa.classList.add("animando");
  setTimeout(function () { mapa.classList.remove("animando"); }, 350);
}

// --- Rueda del mouse (y pellizco del touchpad) = zoom ---
visor.addEventListener("wheel", function (e) {
  e.preventDefault(); // evita que la página se desplace
  mapa.classList.remove("animando");
  const r = visor.getBoundingClientRect();
  zoomEn(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

// --- Arrastrar (1 dedo o mouse) y pellizcar (2 dedos) ---
const punteros = new Map();   // dedos o mouse que están tocando ahora
let arrastrando = false;      // ¿ya se movió lo suficiente para ser arrastre?
let bloquearClic = false;     // evita abrir un ícono si en realidad estabas arrastrando
let inicio = { x: 0, y: 0 };
let distAnt = 0, centroAnt = { x: 0, y: 0 };

// Distancia y centro entre los dos dedos
function datosPinch() {
  const dedos = Array.from(punteros.values());
  const a = dedos[0], b = dedos[1];
  const r = visor.getBoundingClientRect();
  return {
    dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    cx: (a.x + b.x) / 2 - r.left,
    cy: (a.y + b.y) / 2 - r.top
  };
}

visor.addEventListener("pointerdown", function (e) {
  if (e.pointerType === "mouse" && e.button !== 0) return; // solo botón izquierdo
  mapa.classList.remove("animando");
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (punteros.size === 1) {
    inicio = { x: e.clientX, y: e.clientY };
    arrastrando = false;
    bloquearClic = false;
  } else if (punteros.size === 2) {
    arrastrando = true;
    bloquearClic = true;
    const d = datosPinch();
    distAnt = d.dist;
    centroAnt = { x: d.cx, y: d.cy };
  }
});

visor.addEventListener("pointermove", function (e) {
  const p = punteros.get(e.pointerId);
  if (!p) return;

  if (punteros.size === 1) {
    // Hasta moverse 6 px lo tratamos como un toque, no como arrastre
    if (!arrastrando) {
      if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 6) return;
      arrastrando = true;
      bloquearClic = true;
      visor.setPointerCapture(e.pointerId); // seguimos el arrastre aunque el mouse salga del visor
      visor.classList.add("arrastrando");
    }
    x += e.clientX - p.x;
    y += e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    aplicar();
  } else if (punteros.size === 2) {
    p.x = e.clientX;
    p.y = e.clientY;
    const d = datosPinch();
    zoomEn(d.dist / distAnt, d.cx, d.cy);   // zoom según qué tanto se separan los dedos
    x += d.cx - centroAnt.x;                // y también se mueve con los dos dedos
    y += d.cy - centroAnt.y;
    aplicar();
    distAnt = d.dist;
    centroAnt = { x: d.cx, y: d.cy };
  }
});

function soltar(e) {
  punteros.delete(e.pointerId);
  visor.classList.remove("arrastrando");
}
visor.addEventListener("pointerup", soltar);
visor.addEventListener("pointercancel", soltar);

// Si hubo arrastre, el "clic" que sigue se ignora (fase de captura: llega primero)
visor.addEventListener("click", function (e) {
  if (bloquearClic) { e.stopPropagation(); e.preventDefault(); }
}, true);

// Tocar un espacio vacío del mapa cierra la tarjeta
visor.addEventListener("click", function (e) {
  if (!e.target.closest(".marcador")) cerrarTarjeta();
});

// --- Botones + − y ⌂ ---
function centroVisor() { return [visor.clientWidth / 2, visor.clientHeight / 2]; }
document.getElementById("zoom-mas").addEventListener("click", function () {
  animar(); zoomEn(1.5, ...centroVisor());
});
document.getElementById("zoom-menos").addEventListener("click", function () {
  animar(); zoomEn(1 / 1.5, ...centroVisor());
});
document.getElementById("zoom-reset").addEventListener("click", function () {
  animar(); escala = ESCALA_MIN; x = 0; y = 0; aplicar();
});

// Mueve el mapa para que el lugar quede visible, fuera de la zona que tapa la tarjeta
function centrarEn(lugar, sinTarjeta) {
  escala = Math.max(escala, 1.5);
  const escritorio = window.innerWidth >= 800;       // en computadora la tarjeta va a la derecha
  const libreX = escritorio && !sinTarjeta ? visor.clientWidth - tarjeta.offsetWidth : visor.clientWidth;
  const libreY = escritorio || sinTarjeta ? visor.clientHeight : visor.clientHeight - tarjeta.offsetHeight;
  const px = mapa.offsetWidth / ANCHO_SVG;           // píxeles que mide cada unidad del SVG
  x = libreX / 2 - lugar.x * px * escala;
  y = libreY / 2 - lugar.y * px * escala;
  animar();
  aplicar();
}


/* ---------- 5) Buscadores y ruta ---------- */
/* ---------- "Tú estás aquí" ----------
   Un punto azul que siempre sigue al lugar elegido en "¿Dónde estás?".
   Es solo un dibujo: no se puede tocar. */
const puntoAqui = document.createElement("div");
puntoAqui.className = "aqui";
puntoAqui.hidden = true;
puntoAqui.setAttribute("aria-hidden", "true");
mapa.appendChild(puntoAqui);

function ponerPuntoAqui(origen) {
  puntoAqui.hidden = !origen;
  if (!origen) return;
  puntoAqui.style.left = (origen.x / ANCHO_SVG) * 100 + "%";
  puntoAqui.style.top = (origen.y / ALTO_SVG) * 100 + "%";
}

const buscadorOrigen = crearBuscador("origen", actualizarRuta);
const buscadorDestino = crearBuscador("destino", actualizarRuta);

function actualizarRuta() {
  const origen = buscadorOrigen.obtener();
  const destino = buscadorDestino.obtener();

  borrarRuta();
  ponerPuntoAqui(origen);   // el punto azul sigue al origen (o se esconde si no hay)
  botonBorrarRuta.hidden = !(origen || destino);

  if (!origen && !destino) { rutaResumen.textContent = ""; return; }
  if (!origen) { rutaResumen.textContent = "Ahora elige dónde estás."; return; }
  if (!destino) { rutaResumen.textContent = "Ahora elige a dónde quieres ir."; return; }

  if (origen.id === destino.id) {
    rutaResumen.textContent = "Estás en el mismo lugar. Elige un destino distinto.";
    return;
  }

  const ruta = planificarRuta(origen, destino);
  if (!ruta) {
    rutaResumen.textContent = "No pudimos trazar una ruta entre esos lugares.";
    return;
  }

  dibujarRuta(ruta);
  dibujarTramosArriba(ruta);   // tramos del 2.º piso (naranja punteado)
  rutaResumen.textContent = "Ruta de " + origen.nombre + " a " + destino.nombre + "." +
    (ruta.aviso ? " " + ruta.aviso : "");
  encuadrarRuta(ruta.puntos);
}

botonIntercambiar.addEventListener("click", function () {
  const origen = buscadorOrigen.obtener();
  const destino = buscadorDestino.obtener();
  buscadorOrigen.poner(destino, false);
  buscadorDestino.poner(origen, false);
  actualizarRuta();
});

botonBorrarRuta.addEventListener("click", function () {
  buscadorOrigen.limpiar(false);
  buscadorDestino.limpiar(false);
  actualizarRuta();
});


/* ---------- 6) Encuadrar la ruta ----------
   Calcula el zoom y la posición para que la ruta completa se vea. */
function encuadrarRuta(puntos) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  puntos.forEach(function (p) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });

  const margen = 50; // espacio extra alrededor de la ruta
  const px = mapa.offsetWidth / ANCHO_SVG;
  const zoomAncho = visor.clientWidth / ((maxX - minX + margen * 2) * px);
  const zoomAlto = visor.clientHeight / ((maxY - minY + margen * 2) * px);
  escala = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, zoomAncho, zoomAlto));

  // Centramos el visor en medio de la ruta
  x = visor.clientWidth / 2 - ((minX + maxX) / 2) * px * escala;
  y = visor.clientHeight / 2 - ((minY + maxY) / 2) * px * escala;
  animar();
  aplicar();

  // Si el mapa quedó fuera de la pantalla, la página baja hasta mostrarlo
  visor.scrollIntoView({ behavior: "smooth", block: "nearest" });
}


/* ---------- Entrada por código QR ----------
   Un QR abre el mapa así:  mapa.html?aqui=31  (31 = id del lugar en lugares.js).
   Aquí lo leemos, llenamos "¿Dónde estás?" y centramos el mapa en ese lugar.
   "¿A dónde quieres ir?" se queda vacío para que la persona lo elija. */
function aplicarQR() {
  const texto = new URLSearchParams(location.search).get("aqui");
  if (!/^\d{1,3}$/.test(texto || "")) return;      // solo números: ignoramos cualquier otra cosa

  const lugar = LUGARES.find(function (l) { return l.id === Number(texto); });
  const opcion = lugar && OPCIONES.find(function (o) { return o.lugarId === lugar.id; });
  if (!opcion) return;                              // el id no existe: no pasa nada

  buscadorOrigen.poner(opcion, true);               // llena el campo y avisa a la ruta
  centrarEn(lugar, true);                           // true = no hay tarjeta abierta
}

/* ---------- 7) Arranque ---------- */
function iniciar() {
  fijarLimites();
  escala = ESCALA_MIN; x = 0; y = 0;   // empieza viendo el mapa completo
  aplicar();
  aplicarQR();                         // si entraron por un QR, ubica a la persona
}
// Las escaleras son solo un ícono de referencia: no se pueden tocar ni buscar
function crearEscaleras() {
  Object.keys(ESCALERAS).forEach(function (edificio) {
    const e = ESCALERAS[edificio];
    const icono = document.createElement("div");
    icono.className = "escalera";
    icono.textContent = "🪜";
    icono.setAttribute("aria-hidden", "true");
    icono.style.left = (e.x / ANCHO_SVG) * 100 + "%";
    icono.style.top = (e.y / ALTO_SVG) * 100 + "%";
    mapa.appendChild(icono);
  });
}

crearMarcadores();
crearEscaleras();
activarFiltros();

// Esperamos a que cargue la imagen para conocer su tamaño real
if (imagen.complete && imagen.naturalWidth) iniciar();
else imagen.addEventListener("load", iniciar);

window.addEventListener("resize", function () { fijarLimites(); aplicar(); });
