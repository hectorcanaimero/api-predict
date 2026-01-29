# API Predict - Emarsys Scraper

Orquestador de scraping para productos recomendados de Extend Emarsys usando Playwright, Node.js y NestJS.

## Características

- **Scraping robusto**: Utiliza Playwright para scraping confiable de contenido dinámico
- **Recomendaciones por CPF**: Integración con Emarsys Scarab para obtener productos recomendados basados en CPF
- **Arquitectura asíncrona**: Sistema de colas con Bull para manejar múltiples tareas de scraping
- **Caché inteligente**: Sistema de caché para evitar scraping repetitivo
- **API REST completa**: Endpoints bien documentados con Swagger
- **TypeScript**: Tipado fuerte para mejor mantenibilidad
- **Reintentos automáticos**: Manejo de errores con reintentos exponenciales
- **Monitoreo**: Sistema de logging y estadísticas de la cola
- **Múltiples lógicas**: Soporte para PERSONAL, RELATED, ALSO_BOUGHT, POPULAR, CART, etc.

## Requisitos previos

- Node.js >= 18
- Redis (para las colas de Bull)
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Instalar Playwright browsers:
```bash
npx playwright install chromium
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus credenciales:
```env
PORT=3000
EMARSYS_URL=https://extend.emarsys.com
EMARSYS_USERNAME=tu_usuario
EMARSYS_PASSWORD=tu_contraseña
EMARSYS_SCARAB_ID=tu_scarab_id
REDIS_HOST=localhost
REDIS_PORT=6379
API_KEYS=your-secret-api-key,another-key
```

4. Asegurarse de que Redis esté corriendo:
```bash
# En macOS con Homebrew
brew services start redis

# En Linux
sudo service redis-server start

# Con Docker
docker run -d -p 6379:6379 redis
```

## Uso

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

### Testing
```bash
npm run test
```

## 🔐 Autenticación

La API está protegida mediante **API Keys**. Para acceder a los endpoints protegidos, necesitas incluir tu API key en cada request.

### Métodos de autenticación soportados:

#### 1. Header X-API-Key (Recomendado)
```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{"cpf": "12345678900", "recommendLogic": "PERSONAL"}'
```

#### 2. Bearer Token
```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key" \
  -d '{"cpf": "12345678900", "recommendLogic": "PERSONAL"}'
```

#### 3. Query Parameter
```bash
curl -X POST "http://localhost:3000/api/scraping/recommendations/cpf?api_key=your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"cpf": "12345678900", "recommendLogic": "PERSONAL"}'
```

### Configurar API Keys

Edita el archivo `.env` y agrega tus API keys separadas por comas:
```env
API_KEYS=key1,key2,key3
```

### Endpoints públicos

El siguiente endpoint NO requiere autenticación:
- `GET /api/scraping/stats` - Estadísticas de la cola (público)

### Endpoints protegidos

Los siguientes endpoints requieren autenticación:
- `POST /api/scraping/start` - Iniciar scraping
- `POST /api/scraping/recommendations/cpf` - Obtener recomendaciones por CPF
- `GET /api/scraping/jobs/:id` - Obtener estado de un job
- `GET /api/scraping/jobs` - Listar todos los jobs
- `DELETE /api/scraping/jobs/:id` - Cancelar un job
- `POST /api/scraping/jobs/:id/retry` - Reintentar un job
- `DELETE /api/scraping/jobs/completed/clear` - Limpiar jobs completados

## 📚 Documentación de la API

Hay **dos formas** de explorar la documentación:

### 1. Swagger UI (Interactivo - para probar la API)
```
http://localhost:3000/api/docs
```
✅ Probar endpoints directamente
✅ Ejecutar requests
✅ Ver respuestas en tiempo real

### 2. Redocly (Documentación Bonita - solo CPF endpoint)
```bash
# Opción A: Servidor live
npm run docs:serve
# Abrir: http://localhost:8080

# Opción B: HTML standalone
open docs/index.html
```
✅ Interface moderna e intuitiva
✅ Ejemplos detallados
✅ Busca integrada
✅ Mobile-friendly

👉 **Ver guía completa**: [REDOCLY_GUIDE.md](REDOCLY_GUIDE.md)

### Principales endpoints:

#### 🔥 Obtener recomendaciones por CPF (NUEVO)
```http
POST /api/scraping/recommendations/cpf
Content-Type: application/json
X-API-Key: your-secret-api-key

{
  "cpf": "123.456.789-00",
  "scarabId": "1916F613C8B45191",
  "recommendLogic": "PERSONAL",
  "limit": 10,
  "headless": true,
  "useCache": true
}
```

Respuesta:
```json
{
  "id": "1",
  "status": "pending",
  "startedAt": "2024-01-20T10:00:00.000Z"
}
```

**Lógicas disponibles**: `PERSONAL`, `RELATED`, `ALSO_BOUGHT`, `POPULAR`, `CATEGORY`, `CART`

Ver la [Guía Completa de CPF](CPF_GUIDE.md) para más detalles.

#### Iniciar scraping
```http
POST /api/scraping/start
Content-Type: application/json
X-API-Key: your-secret-api-key

{
  "url": "https://extend.emarsys.com/products/recommended",
  "username": "usuario@example.com",
  "password": "password",
  "maxProducts": 50,
  "timeout": 30000,
  "headless": true,
  "useCache": true
}
```

Respuesta:
```json
{
  "id": "1",
  "status": "pending",
  "startedAt": "2024-01-20T10:00:00.000Z"
}
```

#### Obtener estado de un job
```http
GET /api/scraping/jobs/{id}
X-API-Key: your-secret-api-key
```

Respuesta:
```json
{
  "id": "1",
  "status": "completed",
  "startedAt": "2024-01-20T10:00:00.000Z",
  "completedAt": "2024-01-20T10:00:30.000Z",
  "result": {
    "success": true,
    "products": [
      {
        "id": "prod-123",
        "name": "Producto Ejemplo",
        "description": "Descripción del producto",
        "price": 99.99,
        "currency": "USD",
        "imageUrl": "https://...",
        "url": "https://...",
        "scrapedAt": "2024-01-20T10:00:30.000Z"
      }
    ],
    "totalProducts": 1,
    "scrapedAt": "2024-01-20T10:00:30.000Z",
    "duration": 30000
  }
}
```

#### Listar todos los jobs
```http
GET /api/scraping/jobs
```

#### Cancelar un job
```http
DELETE /api/scraping/jobs/{id}
```

#### Reintentar un job fallido
```http
POST /api/scraping/jobs/{id}/retry
```

#### Estadísticas de la cola
```http
GET /api/scraping/stats
```

## Arquitectura

```
src/
├── main.ts                 # Punto de entrada
├── app.module.ts          # Módulo raíz
├── common/                # Código compartido
│   ├── dto/              # Data Transfer Objects
│   ├── filters/          # Filtros de excepciones
│   ├── interceptors/     # Interceptores
│   └── interfaces/       # Interfaces TypeScript
├── scraper/              # Módulo de scraping
│   ├── scraper.service.ts    # Lógica de scraping con Playwright
│   └── scraper.module.ts
└── orchestrator/         # Módulo de orquestación
    ├── orchestrator.service.ts      # Lógica de orquestación
    ├── orchestrator.controller.ts   # Endpoints REST
    ├── orchestrator.processor.ts    # Procesador de cola Bull
    └── orchestrator.module.ts
```

## Configuración avanzada

### Personalizar selectores de scraping

El scraper usa selectores automáticos, pero puedes personalizarlos editando [src/scraper/scraper.service.ts](src/scraper/scraper.service.ts):

```typescript
const productSelectors = [
  '.product-card',
  '.product-item',
  // Agregar tus selectores personalizados
];
```

### Ajustar reintentos y timeouts

En [.env](.env):
```env
SCRAPING_TIMEOUT=60000      # Timeout por job
RETRY_ATTEMPTS=3            # Número de reintentos
RETRY_DELAY=5000           # Delay entre reintentos
MAX_CONCURRENT_SCRAPERS=3   # Jobs concurrentes
```

### Configurar caché

```env
CACHE_TTL=3600             # Tiempo de vida en segundos
CACHE_MAX_ITEMS=100        # Máximo items en caché
```

## Manejo de errores

El sistema incluye:
- Reintentos automáticos con backoff exponencial
- Logging detallado de errores
- Filtros de excepciones globales
- Validación de entrada con class-validator

## Monitoreo

### Ver logs en desarrollo:
Los logs se muestran en la consola con información sobre:
- Inicio/fin de jobs
- Errores de scraping
- Estadísticas de rendimiento

### Métricas de la cola:
```http
GET /api/scraping/stats
```

Retorna:
```json
{
  "waiting": 5,
  "active": 2,
  "completed": 100,
  "failed": 3,
  "delayed": 0,
  "total": 110
}
```

## Mejores prácticas

1. **Usar caché**: Habilitado por defecto para evitar scraping repetitivo
2. **Modo headless**: Usar `headless: true` en producción para mejor rendimiento
3. **Limitar productos**: Usar `maxProducts` para evitar timeouts
4. **Monitorear la cola**: Revisar regularmente las estadísticas
5. **Limpiar jobs**: Usar el endpoint de limpieza periódicamente

## Troubleshooting

### Error: Redis connection refused
```bash
# Verificar que Redis esté corriendo
redis-cli ping
# Debería responder: PONG
```

### Error: Playwright browser not found
```bash
npx playwright install chromium
```

### Jobs atascados en "pending"
```bash
# Verificar workers de Bull
# Revisar logs para errores
# Reiniciar Redis si es necesario
```

## Seguridad

- ✅ **Autenticación habilitada**: Todos los endpoints (excepto /stats) requieren API Key
- No commitear el archivo `.env` con credenciales reales
- Usar API keys fuertes y únicas en producción
- Rotar API keys periódicamente
- Usar variables de entorno en producción
- Validar y sanitizar todas las entradas
- El endpoint `/api/scraping/stats` es público para monitoreo

## Licencia

MIT

## Soporte

Para reportar issues o solicitar features, crear un issue en el repositorio.
