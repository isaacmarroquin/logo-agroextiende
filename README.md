# 🍪 Cátalo

**Opina, descubre y mapea productos — desde una galleta hasta lo que sea.**

Una web app donde cualquier persona puede opinar sobre productos de todo tipo,
subir fotos, marcar dónde encontrarlos en un mapa del mundo, y mucho más.

---

## ✨ Funciones

- 👤 **Crear tu usuario** y tu propia **caseta** (tu puesto de productos).
- ⭐ **Opinar y calificar** productos con estrellas.
- 📸 **Subir fotos** de lo que pruebas.
- 🗺️ **Mapa del mundo** para marcar dónde encontrar cada producto.
- ❤️ **Lista de favoritos**.
- 📍 **Cerca de mí**: ordena los productos por distancia usando tu ubicación.
- 🗺️ **Ruta de fin de semana**: dibuja en el mapa una ruta uniendo tus favoritos.
- 📅 **Eventos de cata**: crea encuentros e invita amigos.
- 📱 **Compartir** productos en **WhatsApp** y redes sociales.
- 🤝 **Invitar amigos** a tu caseta.
- 👥 **Comunidad**: sigue a otras personas (haz amigos) y ve **qué califican y opinan**.
- 💬 **Varias opiniones por producto**: cada producto muestra todas las reseñas,
  su promedio de estrellas, y resalta cuando **un amigo opinó**.
- 🔔 **Alarmas de mejor precio** (dentro de la app).
- 📌 **Notas de interés (guías curadas)**: "Los mejores cafés", "Ruta de postres",
  "Los mejores sánduches", "Vinos y bebidas"... con su ruta en el mapa.
- 📢 **Banners de publicidad**: del sistema (patrocinios propios) y espacio
  preparado para **Google AdSense**.
- ⭐ **Productos patrocinados**: las marcas pueden destacar sus productos arriba.
- 💳 **Funciones premium de pago**: agregar *link para comprar* o *envío a domicilio*.

### 💰 Cómo gana dinero Cátalo
1. **Funciones premium** (link de compra, envío).
2. **Productos patrocinados** (marcas que pagan por aparecer destacadas).
3. **Publicidad** (Google AdSense + banners propios del sistema).
4. A futuro: **comisión** por venta y **planes para empresas**.

> Opinar siempre es gratis. Solo se cobra cuando alguien quiere vender o enviar.

---

## ▶️ Cómo probarla (no necesitas instalar nada)

1. Abre esta carpeta en tu computadora.
2. Haz **doble clic** en `index.html`.
3. Se abre en tu navegador. ¡Listo!

> 💡 Para "Cerca de mí" tu navegador te pedirá permiso de ubicación (es seguro).
> El mapa se carga desde OpenStreetMap (gratis, sin clave).

---

## 🧩 Los archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La **estructura** de la página. |
| `styles.css` | Los **colores y el diseño**. |
| `app.js` | La **lógica** (productos, mapa, favoritos, eventos...). |
| `logo-tobbar.svg` | El logo. |

---

## 📌 Estado: versión de demostración

Todo se guarda **solo en tu navegador** (localStorage). Funciona perfecto para
probar la idea, pero todavía no es compartido entre dispositivos.

### Para convertirla en una app "de verdad"

| Paso | Para qué |
|---|---|
| 🗄️ Servidor + base de datos | Que los productos se guarden en internet y todos vean lo mismo. |
| 👤 Login real | Cuentas seguras con contraseña o Google. |
| 🔔 Notificaciones al celular | Que las **alarmas de precio** te avisen aunque la app esté cerrada. |
| 💳 Pagos reales | Cobrar las funciones premium (ej. Stripe o Mercado Pago). |
| 🌐 Publicar la web | Darle su propia dirección de internet para compartirla. |

¿Avanzamos con alguno? Solo pídemelo. 🚀
