# Puesta en marcha

Sitio final: **https://cumple.mikejasso.com.mx**

## 1. Hoja de Google + API (5 min)
1. Crea una hoja de Google y renombra la pestaña a **Invitados**.
2. `Archivo > Importar > Subir` → `invitados.csv` (local, NO está en git) → "Reemplazar hoja actual".
   Ya trae nombre, max_personas, id y link de cada invitado.
3. `Extensiones > Apps Script`, pega `apps-script/Code.gs`.
4. `Implementar > Nueva implementación > Aplicación web`: ejecutar como **Yo**, acceso **Cualquier persona**. Copia la URL `/exec`.
5. Pega esa URL en `config.js` → `apiUrl`.
6. Para agregar invitados luego: escribe nombre y max_personas, y usa el menú **Invitación > Generar links**.

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
