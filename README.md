# Miguel_Flores_v31.0 — Invitación interactiva

Web App de invitación de cumpleaños con temática *System Architecture / Senior Software Engineer*.
Stack: HTML5 semántico + CSS moderno (Grid/Flex, glassmorphism) + Vanilla JS ES6+. **Cero build step.**

## Archivos

| Archivo | Rol |
|---|---|
| `index.html` | Estructura (splash terminal + dashboard + modal) |
| `styles.css` | Design tokens, glassmorphism, animaciones, responsive |
| `script.js` | Audio engine, countdown, transiciones, RSVP async |
| `Code.gs` | Backend Google Apps Script (escribe en tu Sheet) |

## Puesta en marcha (3 pasos)

**1. Assets locales.** Coloca junto a los archivos:
- `Pitbull - Hotel Room Service.mp3` (exactamente ese nombre)
- `profile.jpg` (foto de Miguel; si falta, se muestra el fallback "MF")

**2. Backend (RSVP → Google Sheets).**
- Abre tu hoja `1dB2e2_jFnxvooKZ4nXj4VvNJDOwXrni66Wl2lCl_xEAzu5CF9SIJnFku` → **Extensiones ▸ Apps Script**.
- Pega el contenido de `Code.gs`. (Opcional: ejecuta `setupSheet` una vez para crear encabezados.)
- **Implementar ▸ Nueva implementación ▸ Aplicación web**: ejecutar como *tú*, acceso *Cualquier usuario*.
- Copia la URL `/exec`.

**3. Conecta el front.** En `script.js`, dentro de `CONFIG`:
- `scriptURL`: pega la URL `/exec`.
- `venueName` / `mapsQuery`: dirección del evento (para el botón de Google Maps).

> Nota: mientras `scriptURL` no esté configurada, el formulario corre en **modo demo** (simula el envío y muestra el modal de éxito sin escribir en el Sheet).

## Detalles técnicos

- **Autoplay-safe**: el audio (`volume = 0.8`) arranca dentro del clic del CTA, cumpliendo la política de gesto de usuario en móviles.
- **CORS**: el envío usa `fetch(..., { mode: 'no-cors' })` con `URLSearchParams`. La respuesta es opaca, así que el front asume éxito salvo error de red; el registro real lo confirma tu Sheet.
- **Countdown**: objetivo `14/AGO/2026 21:30` (hora local del navegador). Al pasar la fecha muestra `SYSTEM_ACTIVE — EVENT_IN_PROGRESS`.
- **Columnas del Sheet**: `Timestamp | Nombre | Asistencia | Acompañantes | Mensaje`.
- Accesible: `prefers-reduced-motion`, roles ARIA, cierre de modal con `Esc`.
