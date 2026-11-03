/* ============================================================
   buscador.js  ->  los buscadores "¿Dónde estás?" y "¿A dónde quieres ir?"

   Los dos usan EXACTAMENTE el mismo código (la función
   crearBuscador). Al tocar o escribir en la caja se despliega una
   lista con todos los lugares agrupados:
     Edificios, Laboratorios, Talleres, Aulas, Oficinas y servicios,
     Zonas deportivas y recreativas, Plaza cívica y exteriores.
   ============================================================ */

// Grupos de la lista, en el orden en que aparecen
const GRUPOS = [
  { id: "edificios",    titulo: "Edificios" },
  { id: "laboratorios", titulo: "Laboratorios" },
  { id: "talleres",     titulo: "Talleres" },
  { id: "aulas",        titulo: "Aulas" },
  { id: "servicios",    titulo: "Oficinas y servicios" },
  { id: "deportivo",    titulo: "Zonas deportivas y recreativas" },
  { id: "exteriores",   titulo: "Plaza cívica y exteriores" }
];

// Lugares (por id de lugares.js) que van en el grupo "Plaza cívica y exteriores"
const IDS_EXTERIORES = [41, 44];

// Quita acentos y mayúsculas: "Cafetería" -> "cafeteria" (para buscar sin errores)
function sinAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}


/* ---------- Armar la lista de opciones ---------- */
function construirOpciones() {
  const opciones = [];

  // 1) Un renglón por cada EDIFICIO (usamos el promedio de sus lugares como posición)
  const porEdificio = {};
  LUGARES.forEach(function (lugar) {
    const esEdificio = lugar.edificio.indexOf("Edificio") === 0 ||
                       lugar.edificio === "Talleres de turismo";
    if (!esEdificio) return;
    if (!porEdificio[lugar.edificio]) porEdificio[lugar.edificio] = [];
    porEdificio[lugar.edificio].push(lugar);
  });

  Object.keys(porEdificio).sort().forEach(function (nombre) {
    const lugares = porEdificio[nombre];
    let sumaX = 0;
    let sumaY = 0;
    lugares.forEach(function (l) { sumaX += l.x; sumaY += l.y; });

    opciones.push({
      id: "edificio-" + nombre,
      nombre: nombre,
      detalle: lugares.length + (lugares.length === 1 ? " lugar" : " lugares"),
      icono: "🏫",
      grupo: "edificios",
      x: sumaX / lugares.length,
      y: sumaY / lugares.length
    });
  });

  // 2) Un renglón por cada LUGAR de lugares.js
  LUGARES.forEach(function (lugar) {
    let grupo = lugar.categoria;                       // laboratorios, talleres, aulas, servicios, deportivo
    if (IDS_EXTERIORES.indexOf(lugar.id) !== -1) grupo = "exteriores";

    opciones.push({
      id: "lugar-" + lugar.id,
      lugarId: lugar.id,
      nombre: lugar.nombre,
      detalle: lugar.edificio === lugar.nombre ? "" : lugar.edificio + (lugar.piso === 2 ? " · 2.º piso" : ""),
      icono: lugar.icono,
      grupo: grupo,
      piso: lugar.piso || 1,          // 1 = planta baja, 2 = segundo piso
      edificio: lugar.edificio,       // sirve para saber qué escalera usar
      x: lugar.x,
      y: lugar.y,
      acceso: ACCESOS[lugar.id]                        // puede ser undefined (no pasa nada)
    });
  });

  // 3) Texto en el que se busca (nombre + detalle + nombre del grupo)
  opciones.forEach(function (o) {
    const grupo = GRUPOS.find(function (g) { return g.id === o.grupo; });
    o.busqueda = sinAcentos(o.nombre + " " + o.detalle + " " + grupo.titulo);
  });

  return opciones;
}

const OPCIONES = construirOpciones();


/* ---------- El buscador (se usa dos veces) ----------
   prefijo   : "origen" o "destino" (coincide con los id del HTML)
   alCambiar : función que se llama cuando se elige o se borra un lugar */
function crearBuscador(prefijo, alCambiar) {
  const contenedor = document.getElementById("buscador-" + prefijo);
  const entrada = document.getElementById("entrada-" + prefijo);
  const lista = document.getElementById("lista-" + prefijo);
  const botonBorrar = document.getElementById("borrar-" + prefijo);

  let seleccion = null;      // la opción elegida (o null)
  let visibles = [];         // opciones que se ven en la lista ahora mismo
  let indiceResaltado = -1;  // opción marcada con las flechas del teclado

  /* --- abrir y cerrar la lista --- */
  function abrir() {
    dibujarLista();
    lista.hidden = false;
    entrada.setAttribute("aria-expanded", "true");
  }
  function cerrar() {
    lista.hidden = true;
    entrada.setAttribute("aria-expanded", "false");
    indiceResaltado = -1;
  }

  /* --- dibujar la lista filtrada --- */
  function dibujarLista() {
    // Si ya hay un lugar elegido y no se ha tocado el texto, mostramos todo
    const eligioYNoEscribio = seleccion && entrada.value === seleccion.nombre;
    const texto = eligioYNoEscribio ? "" : sinAcentos(entrada.value.trim());

    lista.replaceChildren();
    visibles = [];
    indiceResaltado = -1;

    GRUPOS.forEach(function (grupo) {
      const delGrupo = OPCIONES.filter(function (o) {
        return o.grupo === grupo.id && o.busqueda.indexOf(texto) !== -1;
      });
      if (delGrupo.length === 0) return;

      // Título del grupo
      const titulo = document.createElement("li");
      titulo.className = "buscador__grupo";
      titulo.setAttribute("role", "presentation");
      titulo.textContent = grupo.titulo;
      lista.appendChild(titulo);

      // Opciones del grupo
      delGrupo.forEach(function (opcion) {
        lista.appendChild(crearElementoOpcion(opcion));
        visibles.push(opcion);
      });
    });

    if (visibles.length === 0) {
      const vacio = document.createElement("li");
      vacio.className = "buscador__vacio";
      vacio.textContent = "No encontramos ese lugar. Prueba con otro nombre.";
      lista.appendChild(vacio);
    }
  }

  function crearElementoOpcion(opcion) {
    const li = document.createElement("li");
    li.className = "buscador__opcion";
    li.setAttribute("role", "option");

    const icono = document.createElement("span");
    icono.className = "buscador__icono";
    icono.textContent = opcion.icono;

    const texto = document.createElement("span");
    texto.className = "buscador__texto";
    const nombre = document.createElement("span");
    nombre.className = "buscador__nombre";
    nombre.textContent = opcion.nombre;
    texto.appendChild(nombre);

    if (opcion.detalle) {
      const detalle = document.createElement("small");
      detalle.className = "buscador__detalle";
      detalle.textContent = opcion.detalle;
      texto.appendChild(detalle);
    }

    li.appendChild(icono);
    li.appendChild(texto);
    li.addEventListener("click", function () { elegir(opcion); });
    return li;
  }

  /* --- elegir un lugar --- */
  function elegir(opcion) {
    seleccion = opcion;
    entrada.value = opcion.nombre;
    botonBorrar.hidden = false;
    cerrar();
    alCambiar(opcion);
  }

  /* --- marcar una opción con las flechas del teclado --- */
  function resaltar(indice) {
    const elementos = lista.querySelectorAll(".buscador__opcion");
    if (elementos.length === 0) return;
    indiceResaltado = (indice + elementos.length) % elementos.length; // da la vuelta
    elementos.forEach(function (el, i) {
      el.classList.toggle("resaltada", i === indiceResaltado);
    });
    elementos[indiceResaltado].scrollIntoView({ block: "nearest" });
  }

  /* --- eventos de la caja de texto --- */
  entrada.addEventListener("focus", function () { abrir(); entrada.select(); });
  entrada.addEventListener("click", abrir);

  entrada.addEventListener("input", function () {
    // Si cambió el texto, la elección anterior ya no vale
    if (seleccion && entrada.value !== seleccion.nombre) {
      seleccion = null;
      alCambiar(null);
    }
    botonBorrar.hidden = entrada.value === "";
    abrir();
  });

  entrada.addEventListener("keydown", function (evento) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (lista.hidden) abrir();
      resaltar(indiceResaltado + 1);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      if (lista.hidden) abrir();
      resaltar(indiceResaltado - 1);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      if (visibles.length > 0) {
        elegir(visibles[indiceResaltado >= 0 ? indiceResaltado : 0]);
      }
    } else if (evento.key === "Escape") {
      cerrar();
    }
  });

  // Botón ✕ para borrar lo elegido
  botonBorrar.addEventListener("click", function () {
    limpiar(true);
    entrada.focus();
  });

  // Al tocar fuera del buscador, se cierra la lista
  document.addEventListener("click", function (evento) {
    if (!contenedor.contains(evento.target)) cerrar();
  });

  /* --- funciones que usa el resto de la página --- */
  function limpiar(avisar) {
    const habiaSeleccion = seleccion !== null;
    seleccion = null;
    entrada.value = "";
    botonBorrar.hidden = true;
    cerrar();
    if (avisar && habiaSeleccion) alCambiar(null);
  }

  function poner(opcion, avisar) {
    if (!opcion) { limpiar(avisar); return; }
    seleccion = opcion;
    entrada.value = opcion.nombre;
    botonBorrar.hidden = false;
    cerrar();
    if (avisar) alCambiar(opcion);
  }

  return {
    obtener: function () { return seleccion; },
    poner: poner,
    limpiar: limpiar
  };
}
