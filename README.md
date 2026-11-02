# STUDIO F | Portal de lealtad

Proyecto fuente Angular 22 autónomo. Todo el código, contenido local y recursos para compilar la aplicación están en esta carpeta.

## Requisitos

- Node.js 24.x (mínimo 24.15.0)
- npm 11 o posterior

## Ejecutar y compilar

```powershell
npm.cmd ci
npm.cmd start
```

Para crear los archivos estáticos de publicación:

```powershell
npm.cmd run build
```

La compilación queda en `dist/studiof-lealtad/browser`. Los directorios de herramientas y compilación en la raíz (`node_modules`, `.angular`, `/dist`) están excluidos de Git. `public/dist` sí contiene recursos originales versionados; las secciones recuperadas están en `public/contenido` y los medios en `public/img`.

## Alcance

La página de inicio y las secciones Acerca de, Beneficios, Políticas, Establecimientos, Mi cuenta y Contáctanos cargan el contenido recuperado. También se conserva la respuesta pública de Catálogo. El inicio de sesión, recuperación de contraseña y envío de formularios requieren servicios backend privados que no se pueden recuperar desde las páginas públicas.
