/* ============================================================
   ubicacion.js  ->  "guardia" de la página del mapa (mapa.html)

   Solo se usa en mapa.html. Antes de dejarte ver el mapa:
     1) Tapa la página con una PANTALLA DE CARGA.
     2) Le pide permiso al navegador para saber dónde estás
        (mientras decides, la pantalla de carga sigue).
     3) Calcula la distancia al Conalep 252:
          - a 5 km o menos  -> te deja entrar al mapa.
          - más lejos, o sin permiso/ubicación -> te manda al INICIO.
     4) Si ya pasaste, recuerda el permiso 30 minutos para no
        preguntarte en cada recarga.

   IMPORTANTE: la ubicación solo funciona en https:// o en
   localhost (GitHub Pages ya es https). Con doble clic sobre el
   archivo (file://) el navegador la bloquea.

   Nota: esta revisión se hace en el navegador, así que sirve para
   orientar a las personas, no como seguridad a prueba de trampas.
   ============================================================ */

(function () {

  /* ---------- AJUSTES (cámbialos aquí) ---------- */
  // ⚠ COORDENADAS APROXIMADAS (centro de Orizaba). REEMPLÁZALAS por las del plantel:
  //   en Google Maps, clic derecho sobre el Conalep 252 -> el primer renglón son
  //   la latitud y la longitud (clic para copiarlas).
  const PLANTEL = { lat: 18.85, lng: -97.10 };
  const RADIO_METROS = 25000;             // distancia máxima permitida: 5 km
  const MINUTOS_VIGENCIA = 30;           // cuánto se recuerda que ya pasaste
  const PAGINA_INICIO = "index.html";    // a dónde se manda a quien no pasa
  const CLAVE = "conamap-ubicacion";     // nombre con el que se guarda en el navegador

  // Si ya pasaste hace poco, no volvemos a preguntar
  try {
    const guardado = Number(sessionStorage.getItem(CLAVE));
    if (guardado && Date.now() - guardado < MINUTOS_VIGENCIA * 60000) return;
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
  function mostrar(icono, titulo, texto, textoBoton, alPulsar) {
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
      b.addEventListener("click", alPulsar);
      caja.appendChild(b);
      setTimeout(function () { b.focus(); }, 0);
    }
    pantalla.appendChild(caja);
  }

  function dejarPasar() {
    pantalla.remove();
    estilo.remove();
  }

  // replace() manda al inicio sin dejar el mapa en el historial (el botón "atrás" no regresa a él)
  function irAlInicio() {
    location.replace(PAGINA_INICIO);
  }

  // No pasa: explica por qué y manda al inicio (con botón, o solo a los 8 segundos)
  function negar(icono, titulo, texto) {
    mostrar(icono, titulo, texto + " Te llevamos al inicio…", "Ir al inicio", irAlInicio);
    setTimeout(irAlInicio, 8000);
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
    "Acepta el permiso de ubicación para abrir el mapa del Conalep 252.");

  if (!("geolocation" in navigator)) {
    negar("📵", "No pudimos ubicarte",
      "Tu navegador no permite usar la ubicación, y la necesitamos para abrir el mapa.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      const aqui = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const metros = Math.round(distanciaMetros(aqui, PLANTEL));

      // Descontamos la imprecisión del GPS para no negar el paso por error
      if (metros - (pos.coords.accuracy || 0) <= RADIO_METROS) {
        try { sessionStorage.setItem(CLAVE, String(Date.now())); } catch (e) { /* no pasa nada */ }
        mostrar("✅", "¡Estás cerca del Conalep 252!", "Abriendo el mapa…");
        setTimeout(dejarPasar, 1000);
      } else {
        const dist = metros >= 1000 ? (metros / 1000).toFixed(1) + " km" : metros + " m";
        negar("📍", "Estás a " + dist + " del plantel",
          "El mapa solo se puede usar a menos de " + (RADIO_METROS / 1000) + " km del Conalep 252.");
      }
    },
    function (error) {
      if (error.code === 1) {
        negar("🔒", "Necesitamos tu ubicación",
          "Rechazaste el permiso. Para abrir el mapa actívalo en tu navegador y vuelve a intentarlo.");
      } else {
        negar("📡", "No se pudo obtener tu ubicación",
          "Revisa que tengas el GPS activado y conexión, y vuelve a intentarlo.");
      }
    },
    // enableHighAccuracy: usa el GPS; maximumAge 0: nunca usa una ubicación vieja
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );

})();
