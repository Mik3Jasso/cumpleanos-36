# Puesta en marcha

Sitio final: **https://cumple.mikejasso.com.mx**

## 1. Hoja de Google + API (5 min)
1. Crea una hoja de Google y renombra la pestaña a **Invitados**.
2. `Archivo > Importar > Subir` → `invitados.csv` (local, NO está en git) → "Reemplazar hoja actual".
   Columnas: nombre, honor (casilla; `TRUE` = invitado de honor), max_personas, id, link, asistencia, acompanante, fecha_respuesta.
3. `Extensiones > Apps Script`, pega `apps-script/Code.gs`.
4. `Implementar > Nueva implementación > Aplicación web`: ejecutar como **Yo**, acceso **Cualquier persona**. Copia la URL `/exec`.
5. Pega esa URL en `config.js` → `apiUrl`.
6. Para agregar invitadxs luego: escribe nombre, honor y max_personas, y usa el menú **Invitación > Generar links y mensajes**.
   Eso llena id, link y la columna `mensaje` (el texto listo para enviar con el link).
7. Para copiar el mensaje de alguien: selecciona una celda de su fila y usa **Invitación > Copiar mensaje de la fila activa**.
   Se abre una ventana con el texto y un botón Copiar. El texto base se edita en `MENSAJE_BASE` dentro de `Code.gs`.

## 2. GitHub Pages
```bash
git add . && git commit -m "Config final"
gh repo create cumpleanos-36 --public --source=. --push
```
Repo → Settings → Pages → Branch `main` / root. El archivo `CNAME` ya apunta a `cumple.mikejasso.com.mx`.

## 3. DNS del subdominio
En el DNS de `mikejasso.com.mx` agrega, igual que `dev` y `fotografia`:

| Tipo  | Nombre | Valor                 |
|-------|--------|-----------------------|
| CNAME | cumple | `mik3jasso.github.io` |

Cuando GitHub verifique el dominio, activa **Enforce HTTPS** en Pages.

## Notas
- Sin `apiUrl`, el sitio corre en modo demo: `index.html?i=demo-ana` y `?i=demo-luis`.
- Si cambias `Code.gs`, crea una **nueva versión** de la implementación.
- `invitados.csv` contiene los links personales: no lo subas a un repo público.
