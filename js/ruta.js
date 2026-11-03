/* ============================================================
   ruta.js  ->  CALCULA y DIBUJA la ruta entre dos lugares

   Idea general (3 pasos):
     1) Cada lugar se "conecta" al camino más cercano.
     2) Buscamos el trayecto MÁS CORTO por los caminos
        (algoritmo de Dijkstra).
     3) Dibujamos ese trayecto como una línea sobre el mapa.
   ============================================================ */

const NS_SVG = "http://www.w3.org/2000/svg"; // "idioma" necesario para crear dibujos SVG con JavaScript

// Distancia en línea recta entre dos puntos {x, y}
function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}


/* ---------- Paso 1: punto del camino más cercano a un lugar ---------- */
function proyectarEnCaminos(punto) {
  let mejor = null;

  CAMINOS.forEach(function (camino, indice) {
    const A = { x: NODOS[camino[0]][0], y: NODOS[camino[0]][1] };
    const B = { x: NODOS[camino[1]][0], y: NODOS[camino[1]][1] };
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    // t dice en qué parte del tramo cae el punto: 0 = en A, 1 = en B
    let t = ((punto.x - A.x) * dx + (punto.y - A.y) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t)); // lo limitamos para no salirnos del tramo

    const cercano = { x: A.x + t * dx, y: A.y + t * dy };
    const d = distancia(punto, cercano);

    if (!mejor || d < mejor.distancia) {
      mejor = { x: cercano.x, y: cercano.y, camino: indice, distancia: d };
    }
  });

  return mejor;
}


/* ---------- Paso 2: calcular la ruta más corta ----------
   origen y destino son objetos con x, y (y a veces "acceso").
   Devuelve { puntos: [...] } o null si no hay ruta. */
function calcularRuta(origen, destino) {

  // Copiamos los nodos como objetos {x, y} y preparamos la lista de vecinos
  const puntos = NODOS.map(function (n) { return { x: n[0], y: n[1] }; });
  const vecinos = puntos.map(function () { return []; });

  // Une dos nodos con un camino de doble sentido; el "costo" es su largo
  function conectar(i, j) {
    const costo = distancia(puntos[i], puntos[j]);
    vecinos[i].push({ nodo: j, costo: costo });
    vecinos[j].push({ nodo: i, costo: costo });
  }
  CAMINOS.forEach(function (c) { conectar(c[0], c[1]); });

  // Crea un nodo temporal sobre el camino más cercano al lugar
  function agregarTemporal(lugar) {
    const base = lugar.acceso || lugar;       // si hay acceso, usamos ese punto
    const q = proyectarEnCaminos(base);
    const id = puntos.length;
    puntos.push({ x: q.x, y: q.y });
    vecinos.push([]);
    conectar(id, CAMINOS[q.camino][0]);       // lo unimos a los dos extremos
    conectar(id, CAMINOS[q.camino][1]);       // del tramo donde cayó
    return { id: id, camino: q.camino };
  }

  const inicio = agregarTemporal(origen);
  const fin = agregarTemporal(destino);

  // Si los dos quedaron en el mismo tramo, los unimos directo
  if (inicio.camino === fin.camino) conectar(inicio.id, fin.id);

  // --- Algoritmo de Dijkstra ---
  const dist = puntos.map(function () { return Infinity; }); // mejor distancia conocida
  const previo = puntos.map(function () { return -1; });     // de dónde venimos
  const visto = puntos.map(function () { return false; });
  dist[inicio.id] = 0;

  for (let vuelta = 0; vuelta < puntos.length; vuelta++) {
    // Elegimos el nodo no visitado más cercano al inicio
    let u = -1;
    for (let i = 0; i < puntos.length; i++) {
      if (!visto[i] && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1 || dist[u] === Infinity) break;
    visto[u] = true;
    if (u === fin.id) break;

    // Revisamos si pasar por u mejora el camino hacia sus vecinos
    vecinos[u].forEach(function (v) {
      const nueva = dist[u] + v.costo;
      if (nueva < dist[v.nodo]) {
        dist[v.nodo] = nueva;
        previo[v.nodo] = u;
      }
    });
  }

  if (dist[fin.id] === Infinity) return null; // no hay forma de llegar

  // Reconstruimos el trayecto yendo hacia atrás desde el destino
  const trayecto = [];
  for (let n = fin.id; n !== -1; n = previo[n]) {
    trayecto.unshift(puntos[n]);
  }

  // Armamos la línea completa: lugar -> (acceso) -> caminos -> (acceso) -> lugar
  let linea = [{ x: origen.x, y: origen.y }];
  if (origen.acceso) linea.push(origen.acceso);
  linea = linea.concat(trayecto);
  if (destino.acceso) linea.push(destino.acceso);
  linea.push({ x: destino.x, y: destino.y });

  // Quitamos puntos repetidos seguidos
  linea = linea.filter(function (p, i) {
    return i === 0 || distancia(p, linea[i - 1]) > 0.5;
  });

  return { puntos: linea };
}


/* ---------- Paso 3: dibujar la ruta sobre el mapa ---------- */

// Crea un elemento SVG con sus atributos
function crearSvg(nombre, atributos) {
  const elemento = document.createElementNS(NS_SVG, nombre);
  for (const clave in atributos) {
    elemento.setAttribute(clave, atributos[clave]);
  }
  return elemento;
}

// Dibuja un círculo con una letra (A = origen, B = destino)
function dibujarExtremo(capa, punto, letra, clase) {
  const grupo = crearSvg("g", {});
  grupo.appendChild(crearSvg("circle", {
    cx: punto.x, cy: punto.y, r: 13, class: "ruta__extremo " + clase
  }));
  const texto = crearSvg("text", { x: punto.x, y: punto.y, class: "ruta__letra" });
  texto.textContent = letra;
  grupo.appendChild(texto);
  capa.appendChild(grupo);
}

function dibujarRuta(ruta) {
  const capa = document.getElementById("ruta-capa");
  capa.replaceChildren(); // borramos cualquier ruta anterior

  // Convertimos los puntos al formato "x,y x,y x,y" que pide polyline
  const lista = ruta.puntos.map(function (p) {
    return p.x.toFixed(1) + "," + p.y.toFixed(1);
  }).join(" ");

  capa.appendChild(crearSvg("polyline", { points: lista, class: "ruta__borde" })); // borde blanco
  capa.appendChild(crearSvg("polyline", { points: lista, class: "ruta__linea" })); // línea azul

  dibujarExtremo(capa, ruta.puntos[0], "A", "ruta__extremo--origen");
  dibujarExtremo(capa, ruta.puntos[ruta.puntos.length - 1], "B", "ruta__extremo--destino");
}

/* ---------- Rutas con 2.º piso ----------
   Si un lugar tiene piso: 2, el recorrido se parte en tramos:
     lugar (arriba) -> escalera -> calles -> escalera -> lugar (arriba)
   Los tramos "arriba" se dibujan naranja y punteados.
   Devuelve { puntos, segmentos, aviso } o null si no hay ruta. */
function escaleraDe(lugar) {
  return ESCALERAS[lugar.edificio];   // { id, x, y } (o undefined si el edificio no tiene)
}

function planificarRuta(origen, destino) {
  const pisoO = origen.piso || 1;
  const pisoD = destino.piso || 1;
  const segmentos = [];
  const avisos = [];

  // Los dos arriba en el mismo edificio: no hace falta bajar
  if (pisoO === 2 && pisoD === 2 && origen.edificio === destino.edificio) {
    segmentos.push({ arriba: true, puntos: [{ x: origen.x, y: origen.y }, { x: destino.x, y: destino.y }] });
    avisos.push("Los dos lugares están en el 2.º piso del " + origen.edificio + ".");
  } else {
    let desde = origen, hasta = destino;

    if (pisoO === 2) {                       // sales del 2.º piso: primero bajas
      const esc = escaleraDe(origen);
      if (!esc) return null;
      segmentos.push({ arriba: true, puntos: [{ x: origen.x, y: origen.y }, { x: esc.x, y: esc.y }] });
      avisos.push("Baja por las escaleras del " + origen.edificio + ".");
      desde = esc;
    }
    let tramoFinal = null;
    if (pisoD === 2) {                       // llegas al 2.º piso: al final subes
      const esc = escaleraDe(destino);
      if (!esc) return null;
      tramoFinal = { arriba: true, puntos: [{ x: esc.x, y: esc.y }, { x: destino.x, y: destino.y }] };
      avisos.push("Sube por las escaleras del " + destino.edificio + " al 2.º piso.");
      hasta = esc;
    }

    if (desde.id !== hasta.id) {             // el tramo por las calles (planta baja)
      const calles = calcularRuta(desde, hasta);
      if (!calles) return null;
      segmentos.push({ arriba: false, puntos: calles.puntos });
    }
    if (tramoFinal) segmentos.push(tramoFinal);
  }

  // Lista completa de puntos (la usa dibujarRuta y encuadrarRuta)
  const puntos = [];
  segmentos.forEach(function (s) { s.puntos.forEach(function (p) { puntos.push(p); }); });
  return { puntos: puntos, segmentos: segmentos, aviso: avisos.join(" ") };
}

// Dibuja encima los tramos del 2.º piso (halo blanco + línea naranja punteada)
function dibujarTramosArriba(ruta) {
  const capa = document.getElementById("ruta-capa");
  ruta.segmentos.forEach(function (s) {
    if (!s.arriba) return;
    const lista = s.puntos.map(function (p) {
      return p.x.toFixed(1) + "," + p.y.toFixed(1);
    }).join(" ");
    capa.appendChild(crearSvg("polyline", { points: lista, class: "ruta__borde" }));
    capa.appendChild(crearSvg("polyline", { points: lista, class: "ruta__linea ruta__linea--arriba" }));
  });
}

function borrarRuta() {
  document.getElementById("ruta-capa").replaceChildren();
}
