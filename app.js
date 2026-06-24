/*
 * Cátalo — lógica de la app
 * --------------------------------------------------------------
 * Versión de demostración: todo se guarda en el navegador (localStorage).
 * Cuando crezca la app, esto se reemplaza por un servidor real con base
 * de datos, login de verdad y notificaciones al celular. Por ahora así
 * puedes probar todas las funciones sin instalar nada.
 */

// ================= Guardado de datos (localStorage) =================
const ALMACEN = {
  productos: "catalo_productos",
  favoritos: "catalo_favoritos",
  alarmas: "catalo_alarmas",
  eventos: "catalo_eventos",
  usuario: "catalo_usuario",
};

function leer(clave, porDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
  } catch (e) {
    return porDefecto;
  }
}
function escribir(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

let productos = leer(ALMACEN.productos, []);
let favoritos = leer(ALMACEN.favoritos, []); // lista de ids
let alarmas = leer(ALMACEN.alarmas, {}); // { "nombre producto": precioObjetivo }
let eventos = leer(ALMACEN.eventos, []);
let usuario = leer(ALMACEN.usuario, null); // { nombre, caseta }

let tabActual = "todos";
let miUbicacion = null; // {lat, lng} cuando el usuario comparte ubicación
let guiaSeleccionada = null; // id de la guía abierta en "Notas de interés"

// ================= Guías / Notas de interés =================
// Colecciones curadas. Cada producto entra a una guía si su nombre o
// categoría coincide con las palabras clave.
const GUIAS = [
  { id: "cafes", emoji: "☕", titulo: "Los mejores cafés", claves: ["café", "cafe"], categorias: ["Bebida"] },
  { id: "postres", emoji: "🍰", titulo: "Ruta de postres", claves: ["postre", "galleta", "torta", "pastel", "helado", "dulce"], categorias: ["Postre"] },
  { id: "sanduches", emoji: "🥪", titulo: "Los mejores sánduches", claves: ["sánduche", "sanduche", "sándwich", "sandwich", "hamburguesa"], categorias: [] },
  { id: "vinos", emoji: "🍷", titulo: "Vinos y bebidas", claves: ["vino", "cerveza", "licor", "cóctel", "coctel"], categorias: ["Bebida"] },
  { id: "artesanias", emoji: "🎨", titulo: "Artesanías locales", claves: ["artesanía", "artesania"], categorias: ["Artesanía"] },
];
function productosDeGuia(guia) {
  return productos.filter((p) => {
    const txt = (p.nombre + " " + (p.categoria || "")).toLowerCase();
    const porClave = guia.claves.some((k) => txt.includes(k));
    const porCat = guia.categorias.includes(p.categoria);
    return porClave || porCat;
  });
}

// ================= Banners de publicidad =================
// Banners del "sistema": patrocinios propios de Cátalo. Rotan solos.
const BANNERS_SISTEMA = [
  { titulo: "🎪 ¿Tienes un negocio?", texto: "Patrocina tus productos y aparece destacado arriba.", tipo: "Patrocinado" },
  { titulo: "☕ Semana del café", texto: "Descubre los mejores cafés cerca de ti en Notas de interés.", tipo: "Sistema" },
  { titulo: "🍷 ¿Eres una marca?", texto: "Las empresas pueden patrocinar sus productos en Cátalo.", tipo: "Publicidad" },
];
let bannerIndice = 0;
function pintarBanner() {
  const cont = document.getElementById("banner-ad");
  const b = BANNERS_SISTEMA[bannerIndice % BANNERS_SISTEMA.length];
  cont.innerHTML = `
    <span class="ad-label">${b.tipo}</span>
    <h4>${b.titulo}</h4>
    <p>${b.texto}</p>`;
  bannerIndice++;
}
// Rota el banner cada 6 segundos (como haría un anuncio real)
setInterval(pintarBanner, 6000);

// ================= Mapa =================
const mapa = L.map("mapa").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
  maxZoom: 19,
}).addTo(mapa);

const capaMarcadores = L.layerGroup().addTo(mapa);
let capaRuta = null;

let marcadorTemporal = null;
let ubicacionElegida = null;

mapa.on("click", (e) => {
  if (form.classList.contains("oculto") || modal.classList.contains("oculto")) return;
  ubicacionElegida = { lat: e.latlng.lat, lng: e.latlng.lng };
  if (marcadorTemporal) marcadorTemporal.remove();
  marcadorTemporal = L.marker(e.latlng).addTo(mapa);
  document.getElementById("coords-texto").textContent =
    "📍 Ubicación marcada: " +
    ubicacionElegida.lat.toFixed(4) + ", " + ubicacionElegida.lng.toFixed(4);
});

// ================= Referencias del DOM =================
const lista = document.getElementById("lista");
const buscar = document.getElementById("buscar");
const modal = document.getElementById("modal");
const form = document.getElementById("form");
const detalle = document.getElementById("detalle");
const modalPerfil = document.getElementById("modal-perfil");
const modalEventos = document.getElementById("modal-eventos");
const avisoPrecio = document.getElementById("aviso-precio");

// ================= Abrir / cerrar ventanas =================
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
  if (marcadorTemporal) { marcadorTemporal.remove(); marcadorTemporal = null; }
  document.getElementById("coords-texto").textContent = "Sin ubicación marcada";
}

document.getElementById("btn-nuevo").addEventListener("click", () => {
  if (!usuario) { abrirPerfil(); return; }
  abrirModalFormulario();
});

// Botones de cerrar (cualquier elemento con data-cerrar)
document.querySelectorAll("[data-cerrar]").forEach((b) =>
  b.addEventListener("click", (e) => {
    const m = e.target.closest(".modal");
    if (m === modal) cerrarModal();
    else m.classList.add("oculto");
  })
);

// ================= Estrellas y utilidades =================
function estrellas(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}
function leerImagen(archivo) {
  return new Promise((resolve) => {
    if (!archivo) return resolve(null);
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.readAsDataURL(archivo);
  });
}
function imagenPlaceholder() {
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#e8f5e9"/><text x="32" y="40" font-size="28" text-anchor="middle">🍪</text></svg>'
  );
}
// Distancia en km entre dos puntos (fórmula de Haversine)
function distanciaKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ================= Perfil de usuario =================
function abrirPerfil() {
  modalPerfil.classList.remove("oculto");
}
function pintarPerfil() {
  const cont = document.getElementById("perfil");
  if (usuario) {
    cont.innerHTML = `<span class="chip" title="Editar perfil">👤 ${escapar(usuario.nombre)}</span>`;
  } else {
    cont.innerHTML = `<span class="chip">👤 Crear usuario</span>`;
  }
  cont.querySelector(".chip").addEventListener("click", abrirPerfil);
}
document.getElementById("form-perfil").addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = new FormData(e.target);
  usuario = {
    nombre: datos.get("nombre"),
    caseta: datos.get("caseta") || (datos.get("nombre") + "'s"),
  };
  escribir(ALMACEN.usuario, usuario);
  modalPerfil.classList.add("oculto");
  pintarPerfil();
  render();
});

// ================= Agregar un producto =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = new FormData(form);
  const archivoFoto = datos.get("foto");
  const foto = await leerImagen(archivoFoto && archivoFoto.size ? archivoFoto : null);

  const producto = {
    id: Date.now(),
    nombre: datos.get("nombre"),
    categoria: datos.get("categoria"),
    opinion: datos.get("opinion"),
    calificacion: Number(datos.get("calificacion")),
    precio: datos.get("precio") ? Number(datos.get("precio")) : null,
    lugar: datos.get("lugar") || "",
    ubicacion: ubicacionElegida,
    foto: foto,
    autor: usuario ? usuario.nombre : "Anónimo",
    linkCompra: datos.get("linkCompra") === "on",
    envio: datos.get("envio") === "on",
    patrocinado: datos.get("patrocinado") === "on",
    fecha: new Date().toLocaleDateString("es"),
  };

  productos.unshift(producto);
  escribir(ALMACEN.productos, productos);
  cerrarModal();
  render();
});

// ================= Favoritos =================
function esFavorito(id) {
  return favoritos.includes(id);
}
function alternarFavorito(id) {
  if (esFavorito(id)) favoritos = favoritos.filter((x) => x !== id);
  else favoritos.push(id);
  escribir(ALMACEN.favoritos, favoritos);
  render();
}
window.alternarFavorito = alternarFavorito;

// ================= Alarmas de mejor precio =================
function revisarAlarmas() {
  const avisos = [];
  Object.keys(alarmas).forEach((nombre) => {
    const objetivo = alarmas[nombre];
    productos.forEach((p) => {
      if (p.nombre === nombre && p.precio != null && p.precio <= objetivo) {
        avisos.push(`🔔 "${nombre}" está a $${p.precio} (tu alarma: $${objetivo})`);
      }
    });
  });
  if (avisos.length) {
    avisoPrecio.innerHTML = avisos.join("<br>");
    avisoPrecio.classList.remove("oculto");
  } else {
    avisoPrecio.classList.add("oculto");
  }
}
window.ponerAlarma = function (nombre) {
  const input = document.getElementById("alarma-precio");
  const valor = Number(input.value);
  if (!valor) return;
  alarmas[nombre] = valor;
  escribir(ALMACEN.alarmas, alarmas);
  revisarAlarmas();
  alert(`✅ Listo. Te avisaremos cuando "${nombre}" baje de $${valor}.`);
};

// ================= Compartir / invitar =================
function textoProducto(p) {
  return `Mira "${p.nombre}" en Cátalo ${estrellas(p.calificacion)}${
    p.precio != null ? " — $" + p.precio : ""
  }${p.lugar ? " · " + p.lugar : ""}`;
}
window.compartirWhatsApp = function (id) {
  const p = productos.find((x) => x.id === id);
  if (!p) return;
  window.open("https://wa.me/?text=" + encodeURIComponent(textoProducto(p)), "_blank");
};
window.compartirRedes = async function (id) {
  const p = productos.find((x) => x.id === id);
  if (!p) return;
  const datos = { title: "Cátalo", text: textoProducto(p), url: location.href };
  if (navigator.share) {
    try { await navigator.share(datos); } catch (e) {}
  } else {
    navigator.clipboard?.writeText(textoProducto(p));
    alert("📋 Copiado. ¡Pégalo donde quieras compartirlo!");
  }
};
document.getElementById("btn-invitar").addEventListener("click", async () => {
  const nombreCaseta = usuario ? usuario.caseta : "Cátalo";
  const texto = `¡Te invito a "${nombreCaseta}" en Cátalo! Opina y descubre productos conmigo: ${location.href}`;
  if (navigator.share) {
    try { await navigator.share({ title: "Cátalo", text: texto, url: location.href }); } catch (e) {}
  } else {
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
  }
});

// ================= Cerca de mí (geolocalización) =================
function pedirUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null)
    );
  });
}

// ================= Ruta de fin de semana =================
document.getElementById("btn-ruta").addEventListener("click", () => {
  // Une en el mapa tus favoritos (o todos si no hay favoritos) que tengan ubicación
  let puntos = productos.filter((p) => p.ubicacion && (favoritos.length ? esFavorito(p.id) : true));
  if (puntos.length < 2) {
    alert("Necesitas al menos 2 productos con ubicación (marca favoritos ❤️) para armar una ruta.");
    return;
  }
  if (capaRuta) capaRuta.remove();
  const coords = puntos.map((p) => [p.ubicacion.lat, p.ubicacion.lng]);
  capaRuta = L.polyline(coords, { color: "#2e7d32", weight: 4, dashArray: "8 6" }).addTo(mapa);
  mapa.fitBounds(capaRuta.getBounds(), { padding: [40, 40] });
  alert(`🗺️ Ruta de fin de semana con ${puntos.length} paradas dibujada en el mapa.`);
});

// ================= Eventos de cata =================
document.getElementById("btn-eventos").addEventListener("click", () => {
  pintarEventos();
  modalEventos.classList.remove("oculto");
});
document.getElementById("form-evento").addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = new FormData(e.target);
  eventos.unshift({
    id: Date.now(),
    nombre: datos.get("nombre"),
    fecha: datos.get("fecha"),
    lugar: datos.get("lugar"),
    organiza: usuario ? usuario.nombre : "Anónimo",
  });
  escribir(ALMACEN.eventos, eventos);
  e.target.reset();
  pintarEventos();
});
window.eliminarEvento = function (id) {
  eventos = eventos.filter((x) => x.id !== id);
  escribir(ALMACEN.eventos, eventos);
  pintarEventos();
};
window.invitarEvento = function (id) {
  const ev = eventos.find((x) => x.id === id);
  if (!ev) return;
  const texto = `📅 Te invito al evento de cata "${ev.nombre}" el ${ev.fecha} en ${ev.lugar}. ¡Nos vemos en Cátalo!`;
  window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
};
function pintarEventos() {
  const cont = document.getElementById("lista-eventos");
  if (!eventos.length) {
    cont.innerHTML = `<div class="vacio">Aún no hay eventos. ¡Crea el primero! 📅</div>`;
    return;
  }
  cont.innerHTML = eventos.map((ev) => `
    <div class="evento">
      <h4>${escapar(ev.nombre)}</h4>
      <div class="meta">📅 ${escapar(ev.fecha)} · 📍 ${escapar(ev.lugar)} · por ${escapar(ev.organiza)}</div>
      <div class="acciones">
        <button onclick="invitarEvento(${ev.id})">🤝 Invitar amigos</button>
        <button onclick="eliminarEvento(${ev.id})">Eliminar</button>
      </div>
    </div>`).join("");
}

// ================= Pestañas =================
document.querySelectorAll(".tab[data-tab]").forEach((t) =>
  t.addEventListener("click", async () => {
    document.querySelectorAll(".tab[data-tab]").forEach((x) => x.classList.remove("activa"));
    t.classList.add("activa");
    tabActual = t.dataset.tab;
    guiaSeleccionada = null;
    if (tabActual === "cerca" && !miUbicacion) {
      miUbicacion = await pedirUbicacion();
      if (!miUbicacion) alert("No pudimos obtener tu ubicación. Activa el permiso de ubicación en tu navegador.");
    }
    render();
  })
);

// ================= Dibujar lista y mapa =================
function productosVisibles(filtro) {
  let lista = productos.slice();

  if (tabActual === "guias" && guiaSeleccionada) {
    const guia = GUIAS.find((g) => g.id === guiaSeleccionada);
    lista = guia ? productosDeGuia(guia) : [];
  }
  if (tabActual === "favoritos") lista = lista.filter((p) => esFavorito(p.id));
  if (tabActual === "caseta") lista = lista.filter((p) => usuario && p.autor === usuario.nombre);
  if (tabActual === "cerca" && miUbicacion) {
    lista = lista
      .filter((p) => p.ubicacion)
      .map((p) => ({ ...p, dist: distanciaKm(miUbicacion, p.ubicacion) }))
      .sort((a, b) => a.dist - b.dist);
  }
  if (filtro) {
    const f = filtro.toLowerCase();
    lista = lista.filter((p) => p.nombre.toLowerCase().includes(f));
  }
  // Los patrocinados aparecen primero (orden estable) en la vista general
  if (tabActual === "todos") {
    lista.sort((a, b) => (b.patrocinado ? 1 : 0) - (a.patrocinado ? 1 : 0));
  }
  return lista;
}

function render(filtro = "") {
  filtro = filtro || buscar.value || "";
  revisarAlarmas();

  // Título según pestaña
  const titulos = {
    todos: "🌎 Todos los productos",
    favoritos: "❤️ Tus favoritos",
    cerca: "📍 Cerca de ti",
    caseta: usuario ? `🎪 ${usuario.caseta}` : "🎪 Mi caseta (crea tu usuario)",
    guias: "📌 Notas de interés",
  };
  document.getElementById("lista-titulo").textContent = titulos[tabActual];

  // Modo "Notas de interés" (guías curadas)
  if (tabActual === "guias" && !guiaSeleccionada) {
    dibujarGuias();
    dibujarMapa(productos);
    return;
  }

  const visibles = productosVisibles(filtro);

  // Barra de "volver" cuando estás dentro de una guía
  lista.innerHTML = "";
  if (tabActual === "guias" && guiaSeleccionada) {
    const guia = GUIAS.find((g) => g.id === guiaSeleccionada);
    const barra = document.createElement("div");
    barra.className = "guia-volver";
    barra.innerHTML = `
      <button onclick="volverAGuias()">← Todas las notas</button>
      <b>${guia ? guia.emoji + " " + escapar(guia.titulo) : ""}</b>
      <button onclick="rutaDeGuia()">🗺️ Ver ruta</button>`;
    lista.appendChild(barra);
  }

  if (visibles.length === 0) {
    lista.insertAdjacentHTML("beforeend", `<div class="vacio">${
      productos.length === 0
        ? "Aún no hay productos. ¡Sé el primero en opinar! 🍪"
        : "No hay productos para mostrar aquí."
    }</div>`);
  } else {
    visibles.forEach((p) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta" + (p.patrocinado ? " patrocinado" : "");
      tarjeta.innerHTML = `
        <button class="fav" onclick="event.stopPropagation(); alternarFavorito(${p.id})">
          ${esFavorito(p.id) ? "❤️" : "🤍"}
        </button>
        <img src="${p.foto || imagenPlaceholder()}" alt="${escapar(p.nombre)}" />
        <div class="tarjeta-info">
          <h3>${escapar(p.nombre)}</h3>
          <div class="estrellas">${estrellas(p.calificacion)}
            ${p.precio != null ? `<span class="precio"> · $${p.precio}</span>` : ""}
          </div>
          <p class="lugar">${p.lugar ? "📍 " + escapar(p.lugar) : (p.ubicacion ? "📍 En el mapa" : "Sin ubicación")}</p>
          <div class="badges">
            ${p.patrocinado ? '<span class="badge patro">⭐ Patrocinado</span>' : ""}
            <span class="badge cat">${escapar(p.categoria || "Otro")}</span>
            ${p.dist != null ? `<span class="badge dist">📍 ${p.dist.toFixed(1)} km</span>` : ""}
            ${p.linkCompra ? '<span class="badge">🛒 Comprar</span>' : ""}
            ${p.envio ? '<span class="badge">🚚 Envío</span>' : ""}
          </div>
        </div>`;
      tarjeta.addEventListener("click", () => verDetalle(p));
      lista.appendChild(tarjeta);
    });
  }

  dibujarMapa(productos);
}

// Dibuja los marcadores en el mapa
function dibujarMapa(items) {
  capaMarcadores.clearLayers();
  items.forEach((p) => {
    if (p.ubicacion) {
      const m = L.marker([p.ubicacion.lat, p.ubicacion.lng]);
      m.bindPopup(`<b>${escapar(p.nombre)}</b><br>${estrellas(p.calificacion)}<br>${escapar(p.lugar || "")}`);
      m.on("click", () => verDetalle(p));
      capaMarcadores.addLayer(m);
    }
  });
  if (miUbicacion) {
    const yo = L.circleMarker([miUbicacion.lat, miUbicacion.lng], {
      radius: 8, color: "#1565c0", fillColor: "#1565c0", fillOpacity: 0.6,
    }).bindPopup("📍 Tú estás aquí");
    capaMarcadores.addLayer(yo);
  }
}

// Dibuja las tarjetas de guías (Notas de interés)
function dibujarGuias() {
  lista.innerHTML =
    `<div class="ayuda" style="padding:0.4rem 0.6rem">Colecciones curadas. Toca una para explorarla y armar tu ruta.</div>` +
    `<div class="guias-grid">` +
    GUIAS.map((g) => {
      const n = productosDeGuia(g).length;
      return `<div class="guia-card" onclick="abrirGuia('${g.id}')">
        <div class="emoji">${g.emoji}</div>
        <h3>${escapar(g.titulo)}</h3>
        <div class="conteo">${n} producto${n === 1 ? "" : "s"}</div>
      </div>`;
    }).join("") +
    `</div>`;
}
window.abrirGuia = function (id) {
  guiaSeleccionada = id;
  render();
};
window.volverAGuias = function () {
  guiaSeleccionada = null;
  render();
};
// Dibuja en el mapa la ruta de la guía abierta (ej: ruta de postres)
window.rutaDeGuia = function () {
  const guia = GUIAS.find((g) => g.id === guiaSeleccionada);
  if (!guia) return;
  const puntos = productosDeGuia(guia).filter((p) => p.ubicacion);
  if (puntos.length < 2) {
    alert("Necesitas al menos 2 productos con ubicación en esta nota para armar la ruta.");
    return;
  }
  if (capaRuta) capaRuta.remove();
  const coords = puntos.map((p) => [p.ubicacion.lat, p.ubicacion.lng]);
  capaRuta = L.polyline(coords, { color: "#6a1b9a", weight: 4, dashArray: "8 6" }).addTo(mapa);
  mapa.fitBounds(capaRuta.getBounds(), { padding: [40, 40] });
};

// ================= Detalle de un producto =================
function verDetalle(p) {
  detalle.innerHTML = `
    ${p.foto ? `<img src="${p.foto}" alt="${escapar(p.nombre)}" />` : ""}
    <h2>${escapar(p.nombre)}</h2>
    <div class="estrellas">${estrellas(p.calificacion)}</div>
    ${p.precio != null ? `<div class="precio-grande">$${p.precio}</div>` : ""}
    <div class="bloque"><b>Categoría:</b> ${escapar(p.categoria || "Otro")} · por ${escapar(p.autor || "Anónimo")}</div>
    <div class="bloque"><b>Opinión:</b><br>${escapar(p.opinion)}</div>
    <div class="bloque"><b>¿Dónde encontrarlo?</b><br>
      ${p.lugar ? escapar(p.lugar) : "No especificado"}
      ${p.ubicacion ? `<br><small>📍 ${p.ubicacion.lat.toFixed(4)}, ${p.ubicacion.lng.toFixed(4)}</small>` : ""}
    </div>

    <div class="compartir">
      <button class="wa" onclick="compartirWhatsApp(${p.id})">📱 WhatsApp</button>
      <button onclick="compartirRedes(${p.id})">🔗 Compartir en redes</button>
      <button onclick="alternarFavorito(${p.id})">${esFavorito(p.id) ? "💔 Quitar de favoritos" : "❤️ Añadir a favoritos"}</button>
    </div>

    <div class="alarma">
      <b>🔔 Alarma de mejor precio</b>
      <p class="ayuda">Avísame cuando "${escapar(p.nombre)}" baje de:</p>
      <input id="alarma-precio" type="number" min="0" step="0.01" placeholder="$" value="${alarmas[p.nombre] || ""}" />
      <button class="btn" onclick="ponerAlarma('${p.nombre.replace(/'/g, "\\'")}')">Activar alarma</button>
    </div>

    ${p.linkCompra ? '<div class="premium-btn">🛒 Link para comprar (función premium 💳)</div>' : ""}
    ${p.envio ? '<div class="premium-btn">🚚 Pedir envío a domicilio (función premium 💳)</div>' : ""}

    <div class="bloque"><small>Publicado el ${p.fecha}</small></div>
    <div class="form-acciones">
      <button class="btn" onclick="eliminarProducto(${p.id})">Eliminar</button>
    </div>
  `;
  abrirModalDetalle();
  if (p.ubicacion) mapa.setView([p.ubicacion.lat, p.ubicacion.lng], 6);
}

window.eliminarProducto = function (id) {
  productos = productos.filter((p) => p.id !== id);
  favoritos = favoritos.filter((x) => x !== id);
  escribir(ALMACEN.productos, productos);
  escribir(ALMACEN.favoritos, favoritos);
  cerrarModal();
  render();
};

// ================= Búsqueda =================
buscar.addEventListener("input", (e) => render(e.target.value));

// ================= Datos de ejemplo (primera vez) =================
if (productos.length === 0) {
  productos = [
    {
      id: 1, nombre: "Galleta de avena casera", categoria: "Postre",
      opinion: "Crujiente por fuera, suave por dentro. ¡Deliciosa con café!",
      calificacion: 5, precio: 1.5, lugar: "Panadería La Esquina, Bogotá",
      ubicacion: { lat: 4.711, lng: -74.0721 }, foto: null, autor: "Ana",
      linkCompra: true, envio: false, fecha: new Date().toLocaleDateString("es"),
    },
    {
      id: 2, nombre: "Café de origen — tueste medio", categoria: "Bebida",
      opinion: "Aroma a chocolate y nuez. Muy equilibrado.",
      calificacion: 4, precio: 8, lugar: "Finca El Roble",
      ubicacion: { lat: 4.5709, lng: -75.6815 }, foto: null, autor: "Luis",
      linkCompra: false, envio: true, fecha: new Date().toLocaleDateString("es"),
    },
  ];
  escribir(ALMACEN.productos, productos);
}

// ================= Arranque =================
pintarPerfil();
pintarBanner();
render();
