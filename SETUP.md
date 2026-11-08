# Puesta en marcha

## 1. Hoja de Google + API (5 min)
1. Crea una hoja de Google y renombra la pestaña a **Invitados**.
2. Fila 1, encabezados: `nombre | max_personas | id | link | asistencia | acompanante | fecha_respuesta`.
3. Llena solo **nombre** y **max_personas** (1 = solo él/ella, 2 = con +1). Hay ejemplo en `invitados.template.csv`.
4. `Extensiones > Apps Script`, pega `apps-script/Code.gs`, y cambia `SITE_URL` por tu dominio.
5. `Implementar > Nueva implementación > Aplicación web`: ejecutar como **Yo**, acceso **Cualquier persona**. Copia la URL que termina en `/exec`.
6. Pega esa URL en `config.js` → `apiUrl`.
7. Recarga la hoja → menú **Invitación > Generar links**. La columna `link` queda lista para mandar por WhatsApp.

## 2. Datos del evento
Edita `config.js` (lugar, vestimenta, fecha límite, WhatsApp, mensaje).

## 3. GitHub Pages + dominio
```bash
git add . && git commit -m "Invitación nivel 36"
gh repo create cumpleanos-36 --public --source=. --push
```
Repo → Settings → Pages → Branch `main` / root. En "Custom domain" pon tu dominio o subdominio
y crea en tu DNS un `CNAME` hacia `TU-USUARIO.github.io`. Activa **Enforce HTTPS**.

## Notas
- Si `apiUrl` está vacío, el sitio funciona en modo demo: prueba `index.html?i=demo-ana` y `?i=demo-luis`.
- Si cambias el código del script, hay que crear una **nueva versión** de la implementación.
- La página tiene `noindex` para que Google no la indexe; solo entra quien tenga el link.
