/* ============================================================
   info-lugares.js  ->  la INFORMACIÓN de la tarjeta de cada lugar

   Aquí agregas lo que se ve al tocar un lugar en el mapa.
   La clave (el número) es el "id" del lugar en lugares.js.

   Cada lugar puede tener (todo es opcional):
     descripcion  texto corto sobre el lugar
     fotos        lista de fotos (guárdalas en la carpeta Img/lugares/)
     datos        lista de líneas extra (horario, responsable, etc.)

   Si un lugar no aparece aquí, la tarjeta muestra solo su nombre,
   su edificio y un ícono grande en lugar de fotos.

   Para agregar un lugar nuevo: copia un bloque, cambia el número
   por el id correcto y no olvides la coma entre bloques.
   ============================================================ */

const INFO_LUGARES = {

  28: { // Dirección
    descripcion: "Oficina de la dirección del plantel.",
    fotos: [],
    datos: [] 
  },

  30: { // Auditorio
    descripcion: "Espacio para eventos, pláticas y ceremonias.",
    fotos: [],
    datos: []
  },

  31: { // Biblioteca
    descripcion: "Espacio de estudio y consulta de libros.",
    fotos: [],
    datos: []
  },

  34: { // Laboratorio de Informática 1
    descripcion: "Equipos de cómputo para las clases de Informática.",
    fotos: [],
    datos: []
  },

  40: { // Domo
    descripcion: "Área techada para actividades deportivas y cívicas.",
    fotos: [],
    datos: []
  },

  43: { // Cancha de básquetbol
    descripcion: "Cancha para clases de educación física y recreo.",
    fotos: [],
    datos: []
  }

};
