/* ============================================================
   lugares.js  ->  los DATOS del mapa

   Cada lugar es un "objeto" con estas propiedades:
     id        número único
     nombre    texto que se muestra al tocar el ícono
     icono     emoji que se dibuja en el mapa
     categoria aulas | laboratorios | talleres | servicios | deportivo
     edificio  edificio o zona donde está (texto para el panel)
     svgId     ID del edificio dentro de "Mapa Conamap.svg"
     x, y      posición del ícono, medida en el MISMO tamaño del SVG
               (el SVG mide 911 de ancho por 1061 de alto)

   Para mover un ícono solo cambias su x e y.
   Para agregar un lugar, copias una línea y cambias los datos.
   ============================================================ */

const LUGARES = [
  // ---------- Edificio B ----------
  { id: 1, nombre: "Baños (Edificio B)", icono: "🚻", categoria: "servicios", edificio: "Edificio B", svgId: "edificio-b", x: 431.1, y: 533.9 },
  { id: 2, nombre: "Aula 3", icono: "🎓", categoria: "aulas", edificio: "Edificio B", svgId: "edificio-b", x: 459.4, y: 567.6 },
  { id: 3, nombre: "Aula 4", icono: "🎓", categoria: "aulas", edificio: "Edificio B", svgId: "edificio-b", x: 487.7, y: 601.4 },
  { id: 4, nombre: "Aula 5", icono: "🎓", categoria: "aulas", edificio: "Edificio B", svgId: "edificio-b", x: 516.0, y: 635.1 },
  { id: 5, nombre: "Aula 6", icono: "🎓", categoria: "aulas", edificio: "Edificio B", svgId: "edificio-b", x: 544.3, y: 668.9 },
  { id: 6, nombre: "Aula 7", icono: "🎓", categoria: "aulas", edificio: "Edificio B", svgId: "edificio-b", x: 572.6, y: 702.6 },
  { id: 7, nombre: "Aula 8", icono: "🎓", categoria: "aulas", edificio: "Edificio B", svgId: "edificio-b", x: 601.0, y: 736.4 },

  // ---------- Edificio C ----------
  { id: 8, nombre: "Baños (Edificio C)", icono: "🚻", categoria: "servicios", edificio: "Edificio C", svgId: "edificio-c", x: 623.3, y: 816.7 },
  { id: 9, nombre: "Oficinas (Edificio C)", icono: "🗂️", categoria: "servicios", edificio: "Edificio C", svgId: "edificio-c", piso: 2, x: 590.4, y: 844.3 },
  { id: 10, nombre: "Sala de Maestros", icono: "👩‍🏫", categoria: "servicios", edificio: "Edificio C", svgId: "edificio-c", piso: 2, x: 617.1, y: 876.0 },
  { id: 11, nombre: "Aula 9", icono: "🎓", categoria: "aulas", edificio: "Edificio C", svgId: "edificio-c", x: 676.6, y: 880.2 },
  { id: 12, nombre: "Aula 12", icono: "🎓", categoria: "aulas", edificio: "Edificio C", svgId: "edificio-c", piso: 2, x: 643.7, y: 907.8 },
  { id: 13, nombre: "Aula 10", icono: "🎓", categoria: "aulas", edificio: "Edificio C", svgId: "edificio-c", x: 721.6, y: 933.8 },
  { id: 14, nombre: "Aula 13", icono: "🎓", categoria: "aulas", edificio: "Edificio C", svgId: "edificio-c", piso: 2, x: 688.7, y: 961.4 },
  { id: 15, nombre: "Aula 11", icono: "🎓", categoria: "aulas", edificio: "Edificio C", svgId: "edificio-c", x: 759.9, y: 979.4 },
  { id: 16, nombre: "Aula 14", icono: "🎓", categoria: "aulas", edificio: "Edificio C", svgId: "edificio-c", piso: 2, x: 727.0, y: 1007.0 },

  // ---------- Edificio D ----------
  { id: 17, nombre: "Aula 15", icono: "🎓", categoria: "aulas", edificio: "Edificio D", svgId: "edificio-d", piso: 2, x: 726.6, y: 765.5 },
  { id: 18, nombre: "Aula 16", icono: "🎓", categoria: "aulas", edificio: "Edificio D", svgId: "edificio-d", piso: 2, x: 776.6, y: 825.0 },
  { id: 19, nombre: "Aula 17", icono: "🎓", categoria: "aulas", edificio: "Edificio D", svgId: "edificio-d", piso: 2, x: 826.5, y: 884.6 },
  { id: 20, nombre: "Taller de Electromecánica", icono: "⚡", categoria: "talleres", edificio: "Edificio D", svgId: "edificio-d", x: 710.4, y: 812.9 },
  { id: 21, nombre: "Laboratorio de Química Analítica", icono: "🧪", categoria: "laboratorios", edificio: "Edificio D", svgId: "edificio-d", x: 785.3, y: 902.2 },

  // ---------- Edificio K ----------
  { id: 22, nombre: "Aula 19", icono: "🎓", categoria: "aulas", edificio: "Edificio K", svgId: "edificio-k", x: 770.7, y: 705.5 },
  { id: 23, nombre: "Aula 20", icono: "🎓", categoria: "aulas", edificio: "Edificio K", svgId: "edificio-k", x: 806.8, y: 745.6 },
  { id: 24, nombre: "Aula 21", icono: "🎓", categoria: "aulas", edificio: "Edificio K", svgId: "edificio-k", x: 843.0, y: 785.7 },

  // ---------- Edificio H ----------
  { id: 25, nombre: "Aula 1", icono: "🎓", categoria: "aulas", edificio: "Edificio H", svgId: "edificio-h", x: 368.2, y: 673.3 },
  { id: 26, nombre: "Aula 2", icono: "🎓", categoria: "aulas", edificio: "Edificio H", svgId: "edificio-h", x: 418.1, y: 732.8 },
  { id: 27, nombre: "CREA 1", icono: "💡", categoria: "servicios", edificio: "Edificio H", svgId: "edificio-h", x: 468.1, y: 792.3 },

  // ---------- Edificio A ----------
  { id: 28, nombre: "Dirección", icono: "🏛️", categoria: "servicios", edificio: "Edificio A", svgId: "edificio-a", x: 260.0, y: 752.4 },
  { id: 29, nombre: "Oficinas (Edificio A)", icono: "🗂️", categoria: "servicios", edificio: "Edificio A", svgId: "edificio-a", piso: 2, x: 273.7, y: 828.8 },
  { id: 30, nombre: "Auditorio", icono: "🎤", categoria: "servicios", edificio: "Edificio A", svgId: "edificio-a", x: 368.2, y: 874.6 },
  { id: 31, nombre: "Biblioteca", icono: "📚", categoria: "servicios", edificio: "Edificio A", svgId: "edificio-a", piso: 2, x: 335.3, y: 902.2 },

  // ---------- Edificio I ----------
  { id: 32, nombre: "Taller de Mantenimiento de Informática", icono: "🛠️", categoria: "talleres", edificio: "Edificio I", svgId: "edificio-i", x: 321.0, y: 64.4 },
  { id: 33, nombre: "Laboratorio de Informática 2", icono: "💻", categoria: "laboratorios", edificio: "Edificio I", svgId: "edificio-i", x: 365.7, y: 117.7 },
  { id: 34, nombre: "Laboratorio de Informática 1", icono: "💻", categoria: "laboratorios", edificio: "Edificio I", svgId: "edificio-i", x: 410.4, y: 170.9 },

  // ---------- Edificios con un solo lugar ----------
  { id: 35, nombre: "Laboratorio de Autoaprendizaje", icono: "🎧", categoria: "laboratorios", edificio: "Edificio J", svgId: "edificio-j", x: 224.4, y: 159.1 },
  { id: 36, nombre: "Laboratorio de Procesos Químicos", icono: "⚗️", categoria: "laboratorios", edificio: "Edificio G", svgId: "edificio-g", x: 381.4, y: 327.0 },
  { id: 37, nombre: "Taller de Soldadura, Fresa y Torno", icono: "🔧", categoria: "talleres", edificio: "Edificio E", svgId: "edificio-e", x: 259.2, y: 423.4 },
  { id: 38, nombre: "Taller de Motores a Diésel", icono: "🚛", categoria: "talleres", edificio: "Edificio F", svgId: "edificio-f", x: 220.3, y: 613.8 },
  { id: 39, nombre: "Talleres de Turismo", icono: "🧳", categoria: "talleres", edificio: "Talleres de turismo", svgId: "talleres-turismo", x: 136.7, y: 191.4 },

  // ---------- Áreas abiertas ----------
  { id: 40, nombre: "Domo", icono: "🏟️", categoria: "deportivo", edificio: "Domo", svgId: "domo", x: 129, y: 684 },
  { id: 41, nombre: "Plaza Cívica", icono: "🇲🇽", categoria: "servicios", edificio: "Plaza Cívica", svgId: "plaza-civica", x: 529, y: 970 },
  { id: 42, nombre: "Campo de fútbol", icono: "⚽", categoria: "deportivo", edificio: "Campo de fútbol", svgId: "campo-futbol", x: 723, y: 295 },
  { id: 43, nombre: "Cancha de básquetbol", icono: "🏀", categoria: "deportivo", edificio: "Cancha de básquetbol", svgId: "cancha-basquetbol", x: 175, y: 902 },
  { id: 44, nombre: "Estacionamiento", icono: "🅿️", categoria: "servicios", edificio: "Estacionamiento", svgId: "estacionamiento", x: 80, y: 430 }
];
