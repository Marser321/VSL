# Guía de Despliegue en Vercel - VSL Generator Pro

Esta guía te explica cómo dejar tu aplicación 100% operativa en Vercel, habilitando la verdadera Inteligencia Artificial y las APIs de investigación.

## 1. Subir a Github
Si aún no lo hiciste, asegurate de subir todo este proyecto a un repositorio de GitHub (o GitLab / Bitbucket).

## 2. Importar el Proyecto en Vercel
1. Ingresá a [Vercel](https://vercel.com) e iniciá sesión.
2. Clickeá en **"Add New..." > "Project"**.
3. Importá el repositorio de GitHub donde subiste el código.
Hacé clic en **Deploy**. Empezará el proceso de Build. Vercel ya sabe ejecutar todo, y nosotros configuramos el proyecto para que los endpoints no hagan Timeout (\`maxDuration = 60\`).

### Si alguna vez querés actualizar las variables después del deploy:
1. En Vercel, andá a tu proyecto.
2. Ve a la pestaña **Settings**.
3. En el menú izquierdo, clic en **Environment Variables**.
4. Modificá o agregá las claves. **Atención**: después de cambiar variables, debés ir a **Deployments** y hacer un **Redeploy** manual para que tomen efecto.

¡Disfrutá tu generador full de VSL!
