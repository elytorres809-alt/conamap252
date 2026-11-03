/* ============================================================
   ubicacion.js  ->  pide tu ubicación al entrar a Conamap y
   revisa si estás cerca del Conalep 252.

   Qué hace:
     1) Al entrar, tapa la página con una PANTALLA DE CARGA.
     2) Le pide permiso al navegador para saber dónde estás.
        (Mientras la persona decide, la pantalla de carga sigue.)
     3) Calcula la distancia al plantel y muestra el resultado.
     4) Guarda el resultado en sessionStorage, así solo pregunta
        una vez por visita (no en cada página).

   IMPORTANTE: la ubicación solo funciona en https:// o en
   localhost (GitHub Pages ya es https). Si abres el archivo
   con doble clic (file://), el navegador la bloquea.
   ============================================================ */

(function () {

  /* ---------- AJUSTES (cámbialos aquí) ---------- */
  // ⚠ COORDENADAS APROXIMADAS (centro de Orizaba). REEMPLÁZALAS por las del plantel:
  //   en Google Maps, clic derecho sobre el Conalep 252 -> el primer renglón son
  //   la latitud y la longitud (clic para copiarlas).
  const PLANTEL = { lat: 18.85, lng: -97.10 };
  const RADIO_METROS = 300;          // a cuántos metros se considera "cerca"
  const CLAVE = "conamap-ubicacion"; // nombre con el que se guarda el resultado

  // Si ya se preguntó en esta visita, no volvemos a molestar
  try {
    if (sessionStorage.getItem(CLAVE)) return;
  } catch (e) { /* si el navegador no deja guardar, preguntamos de todos modos */ }

  /* ---------- Estilos de la pantalla (van incluidos aquí) ---------- */
  const estilo = document.createElement("style");
  estilo.textContent =
    ".ubic{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
    "padding:1.5rem;background:#0b5e3c;color:#fff;font-family:system-ui,Arial,sans-serif;text-align:center}" +
    ".ubic__caja{max-width:420px}" +
    ".ubic__icono{font-size:3rem;line-height:1;margin-bottom:.6rem}" +
    ".ubic__titulo{font-size:1.4rem;margin:0 0 .5rem}" +
    ".ubic__texto{margin:0 0 1.2rem;line-height:1.45;opacity:.95}" +
    ".ubic__giro{width:56px;height:56px;margin:0 auto 1rem;border:6px solid rgba(255,255,255,.3);" +
    "border-top-color:#fff;border-radius:50%;animation:ubic-gira 0.9s linear infinite}" +
    "@keyframes ubic-gira{to{transform:rotate(360deg)}}" +
    ".ubic__boton{min-height:48px;padding:0 1.6rem;border:none;border-radius:24px;background:#fff;" +
    "color:#0b5e3c;font-size:1rem;font-weight:700;cursor:pointer}";
  document.documentElement.appendChild(estilo);

  // La pantalla se agrega a <html> para que aparezca antes de que cargue el resto
  const pantalla = document.createElement("div");
  pantalla.className = "ubic";
  pantalla.setAttribute("role", "alertdialog");
  pantalla.setAttribute("aria-live", "polite");
  document.documentElement.appendChild(pantalla);

  // Dibuja un mensaje en la pantalla (con botón opcional)
  function mostrar(icono, titulo, texto, textoBoton) {
    pantalla.replaceChildren();
    const caja = document.createElement("div");
    caja.className = "ubic__caja";

    if (icono === "cargando") {
      const giro = document.createElement("div");
      giro.className = "ubic__giro";
      caja.appendChild(giro);
    } else {
      const i = document.createElement("div");
      i.className = "ubic__icono";
      i.textContent = icono;
      caja.appendChild(i);
    }
    const h = document.createElement("h1");
    h.className = "ubic__titulo";
    h.textContent = titulo;
    const p = document.createElement("p");
    p.className = "ubic__texto";
    p.textContent = texto;
    caja.appendChild(h);
    caja.appendChild(p);

    if (textoBoton) {
      const b = document.createElement("button");
      b.className = "ubic__boton";
      b.type = "button";
      b.textContent = textoBoton;
      b.addEventListener("click", cerrar);
      caja.appendChild(b);
      setTimeout(function () { b.focus(); }, 0);
    }
    pantalla.appendChild(caja);
  }

  function cerrar() {
    pantalla.remove();
    estilo.remove();
  }

  // Guarda el resultado y avisa al resto de la página (por si algún día se usa)
  function guardar(estado, metros) {
    window.CONAMAP_UBICACION = { estado: estado, metros: metros };
    try { sessionStorage.setItem(CLAVE, estado); } catch (e) { /* no pasa nada */ }
    document.dispatchEvent(new CustomEvent("conamap:ubicacion", { detail: window.CONAMAP_UBICACION }));
  }

  /* ---------- Distancia entre dos puntos (fórmula de Haversine) ----------
     La Tierra es redonda, así que no sirve restar coordenadas sin más. */
  function distanciaMetros(a, b) {
    const R = 6371000;                 // radio de la Tierra en metros
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(a.lat * rad) * Math.cos(b.lat * rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ---------- Empieza: pantalla de carga mientras se decide el permiso ---------- */
  mostrar("cargando", "Buscando tu ubicación…",
    "Acepta el permiso de ubicación para saber si estás cerca del Conalep 252.");

  if (!("geolocation" in navigator)) {
    guardar("sin-ubicacion", null);
    mostrar("📵", "No pudimos ubicarte",
      "Tu navegador no permite usar la ubicación. Puedes usar Conamap de todos modos.", "Continuar");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      const aqui = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const metros = Math.round(distanciaMetros(aqui, PLANTEL));

      // Descontamos la imprecisión del GPS para no decir "lejos" por error
      const cerca = metros - (pos.coords.accuracy || 0) <= RADIO_METROS;

      if (cerca) {
        guardar("cerca", metros);
        mostrar("✅", "¡Estás en el Conalep 252!", "Bienvenido. Te llevamos a Conamap.");
        setTimeout(cerrar, 1300);
      } else {
        guardar("lejos", metros);
        const dist = metros >= 1000 ? (metros / 1000).toFixed(1) + " km" : metros + " m";
        mostrar("📍", "Estás a " + dist + " del plantel",
          "Conamap está pensado para usarse dentro del Conalep 252, pero puedes explorar el mapa desde donde estás.",
          "Continuar");
      }
    },
    function (error) {
      guardar(error.code === 1 ? "denegada" : "sin-ubicacion", null);
      mostrar("🔒",
        error.code === 1 ? "No pudimos ver tu ubicación" : "No se pudo obtener tu ubicación",
        error.code === 1
          ? "Rechazaste el permiso. No pasa nada: puedes usar Conamap sin compartir tu ubicación."
          : "Revisa que tengas el GPS activado y conexión. Puedes usar Conamap de todos modos.",
        "Continuar");
    },
    // enableHighAccuracy: usa el GPS; maximumAge 0: nunca usa una ubicación vieja
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );

})();
