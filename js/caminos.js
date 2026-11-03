/* ============================================================
   caminos.js  ->  los DATOS de los caminos del plantel

   Para trazar una ruta, la computadora necesita saber por dónde
   se puede caminar. Lo guardamos como un "grafo":

     NODOS     = puntos del mapa donde se unen o terminan los caminos
                 (esquinas, cruces). Cada nodo es [x, y] y su número
                 es su posición en la lista (el primero es el 0).
     CAMINOS   = tramos rectos que unen dos nodos. [0, 5] significa
                 "hay camino entre el nodo 0 y el nodo 5".

   Las coordenadas están en el MISMO tamaño del SVG (911 x 1061),
   igual que en lugares.js.
   ============================================================ */

const NODOS = [
  [745, 902], [578, 798], [704, 696], [388, 584], [310, 496],
  [623, 766], [461, 867], [376, 769], [293, 670], [310, 647],
  [235, 554], [194, 503], [404, 420], [473, 364], [342, 205],
  [267, 260], [353, 190], [364, 181], [174, 311], [136, 342],
  [251, 243], [231, 220], [284, 171], [273, 156], [302, 130],
  [338, 805], [227, 719], [535, 839], [34, 147],  [812, 976],
  [861, 861],

  // ---- Recorridos de la cancha de básquetbol (los dos caminos que van por fuera del Edificio A) ----
  // Camino del NOROESTE (rodea el Edificio A por el lado izquierdo): nodos 31 a 36
  [160, 872], [133, 844], [117, 806], [122, 778], [157, 747], [205, 719],
  // Centro de la cancha: nodo 37
  [175, 902],
  // Camino del SURESTE (pasa por abajo del Edificio A): nodos 38 a 44
  [202, 916], [207, 941], [216, 961], [261, 971], [307, 974], [377, 975], [423, 955],
  // Plaza Cívica (se puede cruzar): centro = nodo 45
  [529, 970]
];

const CAMINOS = [
  [0, 5],  [0, 29], [1, 3],  [1, 5],  [1, 27], [2, 5],  [2, 30],
  [3, 4],  [3, 9],  [4, 10], [4, 12], [6, 7],  [7, 8],  [7, 25],
  [8, 9],  [8, 26], [9, 10], [10, 11], [12, 13], [12, 15], [13, 14],
  [14, 16], [15, 16], [15, 20], [16, 17], [16, 24], [18, 19], [18, 20],
  [18, 28], [20, 21], [21, 22], [22, 23], [23, 24],

  // Cancha: camino noroeste (31->36 se une al nodo 26), centro (37) y camino sureste (38->44 se une al nodo 6)
  [31, 32], [32, 33], [33, 34], [34, 35], [35, 36], [36, 26],
  [31, 37], [37, 38],
  [38, 39], [39, 40], [40, 41], [41, 42], [42, 43], [43, 44], [44, 6],
  // Plaza Cívica: del final del camino de piedras (44) cruza el centro (45) hasta el nodo 27
  [44, 45], [45, 27]
];

/* ------------------------------------------------------------
   ACCESOS (opcional)
   Las zonas grandes (campo, cancha, plaza...) están lejos de los
   caminos. Aquí indicamos por qué punto se "entra" a cada una.
   La clave es el id del lugar en lugares.js.
   Si no pones un acceso, se usa el centro del lugar.
   ------------------------------------------------------------ */
const ACCESOS = {
  40: { x: 215, y: 725 },  // Domo
  // 41 (Plaza Cívica) ya no tiene acceso propio: su centro es el nodo 45
  42: { x: 534, y: 364 },  // Campo de fútbol
  // 43 (Cancha) ya no tiene acceso propio: usa sus dos caminos (nodos 31 al 44)
  44: { x: 140, y: 368 }   // Estacionamiento
};

/* ------------------------------------------------------------
   ESCALERAS
   Edificio -> posición de su escalera (solo es un ícono en el mapa, no es un lugar).
   Los lugares con piso: 2 llegan al camino pasando por ella.
   ------------------------------------------------------------ */
const ESCALERAS = {
  "Edificio A": { id: "escalera-a", x: 317, y: 820 },
  "Edificio C": { id: "escalera-c", x: 697, y: 910 },
  "Edificio D": { id: "escalera-d", x: 748, y: 857 }
};
