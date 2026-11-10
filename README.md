# STUDIO F | Portal de lealtad

Proyecto fuente Angular 22 autónomo. Todo el código, contenido local y recursos para compilar la aplicación están en esta carpeta.

## Requisitos

- Node.js 24.x (mínimo 24.15.0)
- npm 11 o posterior

## Ejecutar y compilar

El login requiere el intermediario que comunica Angular con el servicio SOAP. Con un solo comando se inician el intermediario y Angular:

```powershell
npm.cmd ci
npm.cmd start
```

Abre la dirección local indicada por Angular (normalmente `http://localhost:4200`). El script mantiene ambos procesos activos y detiene los dos al cerrar; el proxy de desarrollo envía `/api` al intermediario en `http://127.0.0.1:3001`. También es posible iniciar únicamente el intermediario con `npm.cmd run api`.

No se envía SOAP directamente desde Angular: el navegador puede mostrar las solicitudes y credenciales, y el proveedor puede bloquearlas por CORS. El intermediario sigue siendo necesario para mantener SOAP fuera del navegador; `npm start` solo automatiza su inicio junto con la web. En producción, el intermediario debe estar disponible en el servidor que atiende la aplicación.

El backend requiere Node.js 24.x (mínimo 24.15.0), compatible con la versión declarada en `package.json`. Configuración opcional:

| Variable | Predeterminado | Descripción |
| --- | --- | --- |
| `PORT` | `3001` | Puerto del backend local. |
| `SOAP_ENDPOINT` | `https://webservices-pru.tecnologiatransaccional.com/DEBITO/WebServices_PrepagoLealtad/Sitios.asmx` | URL HTTPS del servicio SOAP. |
| `SOAP_CLIENT_ID` | `0000000358` | Identificador del cliente, conservado como texto. |

Para publicar la web, configura el servidor web para enrutar `/api` al backend Node y define ahí el endpoint y el identificador apropiados para el ambiente. No se debe llamar al SOAP directamente desde el navegador ni incluir credenciales o configuración privada en Angular.

Para crear los archivos estáticos de publicación:

```powershell
npm.cmd run build
```

La compilación queda en `dist/studiof-lealtad/browser`. Los directorios de herramientas y compilación en la raíz (`node_modules`, `.angular`, `/dist`) están excluidos de Git. `public/dist` sí contiene recursos originales versionados; las secciones recuperadas están en `public/contenido` y los medios en `public/img`.

## Login y consulta de puntos

El navegador envía `username` y `password` como JSON a `POST /api/login`. El proxy de Angular enruta esa petición al intermediario Node en desarrollo. El backend usa SOAP 1.1, namespace `http://tempuri.org/` e identificador de pruebas `0000000358` para ejecutar `w_getLoginWeb` con los parámetros `LOGIN`, `ENCRIP` e `ID_CLIENTE`. Al validar la cuenta consulta además `w_validaciones` (`TARJETA`, `LOGIN`) y `w_validacionesempresa` (`EMPRESA`, `LOGIN`). La respuesta al navegador contiene solo el nombre, saldo y unidad disponibles, además de `availableSections`: `inicio` se habilita con un nombre de usuario reconocido y `puntos` solo si `w_validaciones` devolvió `TCM_FINAL`. No se expone el número de tarjeta ni el XML SOAP sin procesar. La contraseña no se guarda en el navegador después de un login exitoso y la opción de recordar contraseña no está habilitada.

Las credenciales de prueba no están incluidas. Para verificar un login se necesitan credenciales válidas del ambiente de pruebas. Angular construye el menú de cuenta a partir de `availableSections`; una sección sin datos/operación no aparece en una cuenta real. La operación actual no proporciona correo, teléfono, tarjeta, movimientos, cambio de contraseña ni premios, por lo que esas secciones no se muestran. Se conservan las vistas de movimientos, perfil, cambio de contraseña, establecimientos y premios, pero solo serán accesibles cuando SOAP o REST proporcione sus capacidades y el backend las incluya en `availableSections`. No hay acceso de demostración ni se muestran datos ficticios. El backend no crea una sesión persistente.

## Alcance

La página de inicio y las secciones Acerca de, Beneficios, Políticas, Establecimientos, Mi cuenta y Contáctanos cargan el contenido recuperado. También se conserva la respuesta pública de Catálogo. El login y la consulta de puntos están conectados al servicio SOAP mediante el backend intermediario. La recuperación de contraseña y el envío del formulario de contacto todavía requieren servicios backend adicionales.
