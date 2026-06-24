/*
 * Cátalo — lógica de la app
 * --------------------------------------------------------------
 * Versión de demostración: los productos se guardan en el navegador
 * (localStorage). Cuando crezca la app, esto se reemplaza por un
 * servidor real con base de datos. Por ahora así puedes probarla sin
 * instalar nada.
 */

// ---------- Guardado de datos (localStorage) ----------
const CLAVE = "catalo_productos";

function cargarProductos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch (e) {
    return [];
  }
}

function guardarProductos(productos) {
  localStorage.setItem(CLAVE, JSON.stringify(productos));
}

let productos = cargarProductos();

// ---------- Mapa ----------
const mapa = L.map("mapa").setView([20, 0], 2); // vista del mundo
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
  maxZoom: 19,
}).addTo(mapa);

const capaMarcadores = L.layerGroup().addTo(mapa);

// Cuando agregas un producto, este marcador temporal muestra dónde marcaste
let marcadorTemporal = null;
let ubicacionElegida = null; // {lat, lng}

mapa.on("click", (e) => {
  // Solo permite marcar si el formulario está abierto
  if (form.classList.contains("oculto")) return;
  ubicacionElegida = { lat: e.latlng.lat, lng: e.latlng.lng };
  if (marcadorTemporal) marcadorTemporal.remove();
  marcadorTemporal = L.marker(e.latlng).addTo(mapa);
  document.getElementById("coords-texto").textContent =
    "📍 Ubicación marcada: " +
    ubicacionElegida.lat.toFixed(4) +
    ", " +
    ubicacionElegida.lng.toFixed(4);
});

// ---------- Referencias del DOM ----------
const lista = document.getElementById("lista");
const buscar = document.getElementById("buscar");
const modal = document.getElementById("modal");
const form = document.getElementById("form");
const detalle = document.getElementById("detalle");

// ---------- Abrir / cerrar ventana ----------
function abrirModalFormulario() {
  form.classList.remove("oculto");
  detalle.classList.add("oculto");
  modal.classList.remove("oculto");
}
function abrirModalDetalle() {
  form.classList.add("oculto");
  detalle.classList.remove("oculto");
  modal.classList.remove("oculto");
}
function cerrarModal() {
  modal.classList.add("oculto");
  form.reset();
  ubicacionElegida = null;
  if (marcadorTemporal) {
    marcadorTemporal.remove();
    marcadorTemporal = null;
  }
  document.getElementById("coords-texto").textContent = "Sin ubicación marcada";
}

document.getElementById("btn-nuevo").addEventListener("click", abrirModalFormulario);
document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);
document.getElementById("cancelar").addEventListener("click", cerrarModal);

// ---------- Estrellas ----------
function estrellas(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ---------- Leer una imagen como texto (base64) ----------
function leerImagen(archivo) {
  return new Promise((resolve) => {
    if (!archivo) return resolve(null);
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.readAsDataURL(archivo);
  });
}

// ---------- Guardar un producto nuevo ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = new FormData(form);
  const archivoFoto = datos.get("foto");
  const foto = await leerImagen(archivoFoto && archivoFoto.size ? archivoFoto : null);

  const producto = {
    id: Date.now(),
    nombre: datos.get("nombre"),
    opinion: datos.get("opinion"),
    calificacion: Number(datos.get("calificacion")),
    lugar: datos.get("lugar") || "",
    ubicacion: ubicacionElegida,
    foto: foto,
    linkCompra: datos.get("linkCompra") === "on",
    envio: datos.get("envio") === "on",
    fecha: new Date().toLocaleDateString("es"),
  };

  productos.unshift(producto);
  guardarProductos(productos);
  cerrarModal();
  render();
});

// ---------- Dibujar la lista y el mapa ----------
function render(filtro = "") {
  // Lista
  const visibles = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  if (visibles.length === 0) {
    lista.innerHTML = `<div class="vacio">
      ${productos.length === 0
        ? "Aún no hay productos. ¡Sé el primero en opinar! 🍪"
        : "No se encontraron productos con esa búsqueda."}
    </div>`;
  } else {
    lista.innerHTML = "";
    visibles.forEach((p) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta";
      tarjeta.innerHTML = `
        <img src="${p.foto || imagenPlaceholder()}" alt="${p.nombre}" />
        <div class="tarjeta-info">
          <h3>${escapar(p.nombre)}</h3>
          <div class="estrellas">${estrellas(p.calificacion)}</div>
          <p class="lugar">${p.lugar ? "📍 " + escapar(p.lugar) : (p.ubicacion ? "📍 En el mapa" : "Sin ubicación")}</p>
          <div class="badges">
            ${p.linkCompra ? '<span class="badge">🛒 Comprar</span>' : ""}
            ${p.envio ? '<span class="badge">🚚 Envío</span>' : ""}
          </div>
        </div>`;
      tarjeta.addEventListener("click", () => verDetalle(p));
      lista.appendChild(tarjeta);
    });
  }

  // Mapa
  capaMarcadores.clearLayers();
  productos.forEach((p) => {
    if (p.ubicacion) {
      const m = L.marker([p.ubicacion.lat, p.ubicacion.lng]);
      m.bindPopup(
        `<b>${escapar(p.nombre)}</b><br>${estrellas(p.calificacion)}<br>${escapar(p.lugar || "")}`
      );
      m.on("click", () => verDetalle(p));
      capaMarcadores.addLayer(m);
    }
  });
}

// ---------- Ver detalle de un producto ----------
function verDetalle(p) {
  detalle.innerHTML = `
    ${p.foto ? `<img src="${p.foto}" alt="${escapar(p.nombre)}" />` : ""}
    <h2>${escapar(p.nombre)}</h2>
    <div class="estrellas">${estrellas(p.calificacion)}</div>
    <div class="bloque"><b>Opinión:</b><br>${escapar(p.opinion)}</div>
    <div class="bloque"><b>¿Dónde encontrarlo?</b><br>
      ${p.lugar ? escapar(p.lugar) : "No especificado"}
      ${p.ubicacion ? `<br><small>📍 ${p.ubicacion.lat.toFixed(4)}, ${p.ubicacion.lng.toFixed(4)}</small>` : ""}
    </div>
    ${p.linkCompra
      ? '<div class="premium-btn">🛒 Link para comprar (función premium 💳)</div>'
      : ""}
    ${p.envio
      ? '<div class="premium-btn">🚚 Pedir envío a domicilio (función premium 💳)</div>'
      : ""}
    <div class="bloque"><small>Publicado el ${p.fecha}</small></div>
    <div class="form-acciones">
      <button class="btn" onclick="eliminarProducto(${p.id})">Eliminar</button>
    </div>
  `;
  abrirModalDetalle();

  // Si tiene ubicación, centra el mapa ahí
  if (p.ubicacion) {
    mapa.setView([p.ubicacion.lat, p.ubicacion.lng], 6);
  }
}

// ---------- Eliminar ----------
window.eliminarProducto = function (id) {
  productos = productos.filter((p) => p.id !== id);
  guardarProductos(productos);
  cerrarModal();
  render();
};

// ---------- Utilidades ----------
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}

function imagenPlaceholder() {
  // Una imagen gris simple en SVG (no necesita internet)
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#e8f5e9"/><text x="32" y="40" font-size="28" text-anchor="middle">🍪</text></svg>'
    )
  );
}

// ---------- Búsqueda ----------
buscar.addEventListener("input", (e) => render(e.target.value));

// ---------- Datos de ejemplo (solo la primera vez) ----------
if (productos.length === 0) {
  productos = [
    {
      id: 1,
      nombre: "Galleta de avena casera",
      opinion: "Crujiente por fuera, suave por dentro. ¡Deliciosa con café!",
      calificacion: 5,
      lugar: "Panadería La Esquina, Bogotá",
      ubicacion: { lat: 4.711, lng: -74.0721 },
      foto: null,
      linkCompra: true,
      envio: false,
      fecha: new Date().toLocaleDateString("es"),
    },
    {
      id: 2,
      nombre: "Café de origen — tueste medio",
      opinion: "Aroma a chocolate y nuez. Muy equilibrado.",
      calificacion: 4,
      lugar: "Finca El Roble",
      ubicacion: { lat: 4.5709, lng: -75.6815 },
      foto: null,
      linkCompra: false,
      envio: true,
      fecha: new Date().toLocaleDateString("es"),
    },
  ];
  guardarProductos(productos);
}

// ---------- Primer dibujo ----------
render();
