# SkillPath — Despliegue del frontend en AWS

Capa 2 de la arquitectura: **S3 + CloudFront**, sin Route 53.

El bucket queda **privado**; solo CloudFront puede leerlo, mediante un Origin Access
Control (OAC). Nadie accede al bucket por su URL directa.

Región: **us-east-1** · Entorno: **dev**

---

## Antes de empezar

El backend tiene que estar desplegado, porque su URL se incrusta en el build.
Ver `api-skill_path/docs/despliegue-manual.md`.

## Orden de trabajo

1. Compilar el sitio con la URL de la API (§1)
2. Crear el bucket de S3 (§2)
3. Crear la distribución de CloudFront (§3)
4. Dar a CloudFront permiso sobre el bucket (§4)
5. Configurar el fallback de la SPA (§5)
6. Subir los archivos (§6)
7. Ajustar el CORS de la API (§7)
8. Comprobar (§8)

---

## §1 · Compilar

```bash
cp .env.example .env
```

Edita `.env` y pon la **URL de invocación** de tu etapa en API Gateway:

```
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

> ⚠️ **Vite incrusta ese valor al compilar, no al ejecutarse.** Si más adelante
> cambias la URL de la API, hay que volver a compilar y volver a subir el sitio.
> No basta con editar un archivo en el servidor.

```bash
npm run deploy
```

Ese comando compila y después revisa el resultado: si el `dist/` no lleva una URL
real de API Gateway, falla ahí mismo en vez de dejarte subir un sitio que no
funcionaría. Al terminar imprime qué API quedó incrustada.

---

## §2 · Bucket de S3

S3 → **Crear bucket**.

| Campo | Valor |
|---|---|
| Nombre | `skillpath-web-dev-<algo-único>` |
| Región | us-east-1 |
| **Bloquear todo el acceso público** | **Activado** *(sí, activado)* |
| Versionado | Desactivado |
| Cifrado | SSE-S3 (por defecto) |

> El bloqueo de acceso público se queda **activado**. El sitio no se sirve desde S3
> sino desde CloudFront, que tendrá permiso explícito. Es la diferencia entre un
> bucket privado con una puerta y un bucket abierto a Internet.

**No actives** «Alojamiento de sitios web estáticos». Esa opción exige un bucket
público y es incompatible con el OAC que vamos a usar.

---

## §3 · Distribución de CloudFront

CloudFront → **Crear distribución**.

### Origen

| Campo | Valor |
|---|---|
| Dominio de origen | tu bucket de S3 (elígelo de la lista) |
| Acceso al origen | **Control de acceso de origen (OAC)** |
| Origin access control | **Crear nuevo** → nombre `skillpath-web-oac`, firma **Sign requests** |

Al guardar, CloudFront muestra un aviso de que hay que actualizar la política del
bucket, con un botón **Copiar política**. Cópiala: se usa en §4.

### Comportamiento por defecto

| Campo | Valor |
|---|---|
| Protocolo del visor | **Redirect HTTP to HTTPS** |
| Métodos permitidos | `GET, HEAD` |
| Comprimir objetos automáticamente | **Sí** |
| Política de caché | **CachingOptimized** |

### Configuración

| Campo | Valor |
|---|---|
| Clase de precio | **Solo Norteamérica y Europa** *(más barato; ajústalo si quieres cobertura global)* |
| Objeto raíz predeterminado | **`index.html`** |
| Dominio alternativo (CNAME) | *(vacío — no usamos dominio propio)* |
| Certificado | *(el predeterminado de CloudFront)* |

El **Objeto raíz predeterminado** es lo que hace que `https://dxxxx.cloudfront.net/`
sirva la aplicación en vez de un error.

---

## §4 · Permiso del bucket

S3 → tu bucket → **Permisos** → **Política del bucket** → **Editar**, y pega la
política que copiaste en §3. Tiene esta forma:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::TU-BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::TU-CUENTA:distribution/TU-DISTRIBUCION"
        }
      }
    }
  ]
}
```

La condición `SourceArn` es la que importa: solo **tu** distribución puede leer el
bucket, no cualquier distribución de CloudFront del mundo.

---

## §5 · Fallback de la SPA

Esta es la parte que más se olvida y que rompe la aplicación de forma desconcertante.

SkillPath usa rutas del lado del cliente: `/inicio`, `/mis-mazos/deck_01J9`… Esas
rutas **no existen como archivos en S3**. Si alguien recarga estando en `/progreso`,
CloudFront pide `progreso` al bucket, no lo encuentra y devuelve un error. La
aplicación funciona al navegar pero se rompe al recargar o al compartir un enlace.

La solución es decirle a CloudFront que devuelva `index.html` ante esos errores, y
que React Router resuelva la ruta.

CloudFront → tu distribución → **Páginas de error** → **Crear respuesta de error
personalizada**, dos veces:

| Código de error HTTP | Personalizar respuesta | Ruta de respuesta | Código de respuesta HTTP | TTL de caché |
|---|---|---|---|---|
| **403** | Sí | `/index.html` | **200** | 0 |
| **404** | Sí | `/index.html` | **200** | 0 |

> El 403 no es un descuido: con OAC, un objeto que no existe devuelve **403**, no
> 404, porque el permiso es por objeto. Configurar solo el 404 deja el problema
> igual de roto.
>
> El código de respuesta tiene que ser **200**. Si se deja en 403, el navegador
> recibe la aplicación pero con un estado de error, y los buscadores la descartan.

---

## §6 · Subir los archivos

### Desde la consola

S3 → tu bucket → **Cargar** → arrastra **el contenido** de `dist/`:
`index.html` y la carpeta `assets/`.

> Arrastra lo que hay **dentro** de `dist/`, no la carpeta `dist` entera. Si subes
> la carpeta, el sitio queda en `/dist/index.html` y la raíz da error.

### Desde la línea de comandos

Con AWS CLI configurado:

```bash
aws s3 sync dist/ s3://TU-BUCKET --delete
```

```bash
aws cloudfront create-invalidation --distribution-id TU-DISTRIBUCION --paths "/*"
```

**La invalidación es necesaria en cada despliegue.** Los archivos de `assets/` llevan
un hash en el nombre, así que cambian solos; pero `index.html` conserva su nombre y
CloudFront lo sirve de su caché. Sin invalidar, los visitantes siguen viendo la
versión anterior durante horas.

Las primeras 1,000 invalidaciones al mes son gratuitas.

---

## §7 · CORS de la API

El navegador bloquea las llamadas si el origen no coincide. Cuando tengas el dominio
de CloudFront (`https://dxxxxxxxx.cloudfront.net`):

1. **API Gateway** → tu HTTP API → **CORS** → pon ese dominio en
   `Access-Control-Allow-Origin`.
2. **Lambda** → las **seis** funciones → variable de entorno `CORS_ORIGIN` con el
   mismo valor.

> Sin comillas, sin barra final y **con `https://`**. Un origen con barra final no
> coincide y el navegador bloquea todo con un error de CORS que no dice por qué.

Para seguir desarrollando en local con la API desplegada, deja
`http://localhost:5173` durante el desarrollo y cámbialo al publicar. Con la etapa
`prod` se pueden tener ambas configuraciones sin pisarse.

---

## §8 · Comprobación

1. Abre `https://dxxxxxxxx.cloudfront.net` → debe verse la página de bienvenida.
2. **Recarga estando en `/entrar`** → debe seguir funcionando. Si sale un error,
   revisa §5.
3. Crea una cuenta → debe entrar al Home. Si las llamadas fallan, abre la consola
   del navegador: un error de CORS apunta a §7, un 401 apunta al `JWT_SECRET` de las
   funciones.
4. Explora un tema, agrégalo y repasa una tarjeta.

---

## Problemas frecuentes

| Síntoma | Causa más probable |
|---|---|
| La raíz da `AccessDenied` | Falta el **Objeto raíz predeterminado** `index.html` (§3) o la política del bucket (§4) |
| Navegar funciona, recargar da error | Faltan las respuestas de error personalizadas (§5) — y recuerda incluir el **403** |
| Todas las llamadas fallan con error de CORS | El origen configurado no coincide exactamente con el de CloudFront (§7) |
| Se ve la versión anterior tras desplegar | Falta invalidar la caché (§6) |
| Las llamadas van a `TU-API.execute-api...` | Se compiló sin `.env`; `npm run deploy` lo habría avisado (§1) |
| El sitio carga pero sin estilos | Se subió la carpeta `dist` en vez de su contenido (§6) |

---

## Costos

Con los supuestos del informe (5,000 usuarios activos al mes):

| Servicio | Estimado |
|---|---|
| S3 | ~$0.01/mes — unos 300 KB de archivos |
| CloudFront | ~$3.55/mes — ~40 GB de transferencia y 200K peticiones |

La capa gratuita de CloudFront cubre 1 TB de transferencia al mes, así que en la
práctica el costo real de un MVP recién lanzado es cercano a $0.
