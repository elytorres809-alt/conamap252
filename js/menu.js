// Menú de navegación para celular (botón hamburguesa)

// 1. Buscamos el botón y el menú por su id
const botonMenu = document.getElementById("menuBoton");
const menu = document.getElementById("menu");

// 2. Función que abre o cierra el menú
function cambiarMenu(abrir) {
  // classList.toggle(clase, true/false) agrega o quita la clase "abierto"
  menu.classList.toggle("abierto", abrir);

  // Cambiamos el símbolo del botón: ☰ (cerrado) o ✕ (abierto)
  botonMenu.textContent = abrir ? "✕" : "☰";

  // Avisamos a los lectores de pantalla si el menú está abierto o cerrado
  botonMenu.setAttribute("aria-expanded", abrir);
  botonMenu.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
}

// 3. Al tocar el botón: si estaba abierto lo cerramos, y si no, lo abrimos
botonMenu.addEventListener("click", function () {
  cambiarMenu(!menu.classList.contains("abierto"));
});

// 4. Al tocar un enlace del menú, el menú se cierra
menu.querySelectorAll("a").forEach(function (enlace) {
  enlace.addEventListener("click", function () {
    cambiarMenu(false);
  });
});

// 5. Al tocar fuera del menú, también se cierra
document.addEventListener("click", function (evento) {
  const tocoDentro = menu.contains(evento.target) || botonMenu.contains(evento.target);
  if (!tocoDentro) {
    cambiarMenu(false);
  }
});

// 6. Con la tecla Escape también se cierra (útil en computadora)
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    cambiarMenu(false);
  }
});

// 7. Si se gira el celular o se agranda la ventana, dejamos el menú cerrado
window.addEventListener("resize", function () {
  if (window.innerWidth >= 768) {
    cambiarMenu(false);
  }
});
