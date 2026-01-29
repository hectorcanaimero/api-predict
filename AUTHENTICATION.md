# 🔐 Guía de Autenticación API

Guía completa sobre cómo configurar y usar la autenticación con API Keys en el API Predict.

## Visión General

El API Predict está protegido mediante **API Keys** para garantizar que solo usuarios autorizados puedan acceder a los endpoints de scraping. La autenticación es simple, flexible y soporta múltiples métodos.

## 🚀 Configuración Rápida

### 1. Configurar API Keys

Edita el archivo `.env` y agrega tus API keys separadas por comas:

```env
API_KEYS=your-secret-key-123,another-key-456,admin-key-789
```

**Importante:**
- Puedes agregar múltiples API keys separadas por comas
- Cada key debe ser única y segura
- No uses espacios alrededor de las comas
- Mantén tus keys seguras y no las compartas

### 2. Generar API Keys Seguras

Usa uno de estos métodos para generar keys aleatorias:

```bash
# Método 1: OpenSSL
openssl rand -hex 32

# Método 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Método 3: uuidgen
uuidgen
```

### 3. Reiniciar el servidor

Después de configurar las keys, reinicia el servidor:

```bash
npm run start:dev
```

## 🔑 Métodos de Autenticación

La API soporta **3 métodos diferentes** para enviar tu API key. Elige el que mejor se adapte a tu caso de uso.

### Método 1: Header X-API-Key (Recomendado)

Este es el método más común y recomendado.

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-123" \
  -d '{
    "cpf": "12345678900",
    "recommendLogic": "PERSONAL",
    "limit": 10
  }'
```

**JavaScript/TypeScript:**
```typescript
const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-secret-key-123'
  },
  body: JSON.stringify({
    cpf: '12345678900',
    recommendLogic: 'PERSONAL',
    limit: 10
  })
});
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:3000/api/scraping/recommendations/cpf',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'your-secret-key-123'
    },
    json={
        'cpf': '12345678900',
        'recommendLogic': 'PERSONAL',
        'limit': 10
    }
)
```

### Método 2: Bearer Token

Útil si ya estás usando headers de Authorization estándar.

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key-123" \
  -d '{
    "cpf": "12345678900",
    "recommendLogic": "PERSONAL"
  }'
```

**JavaScript/TypeScript:**
```typescript
const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-secret-key-123'
  },
  body: JSON.stringify({
    cpf: '12345678900',
    recommendLogic: 'PERSONAL'
  })
});
```

### Método 3: Query Parameter

Útil para requests simples o cuando no puedes modificar headers fácilmente. **No recomendado para producción** ya que la key queda visible en logs.

```bash
curl -X POST "http://localhost:3000/api/scraping/recommendations/cpf?api_key=your-secret-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "recommendLogic": "PERSONAL"
  }'
```

**JavaScript/TypeScript:**
```typescript
const apiKey = 'your-secret-key-123';
const url = `http://localhost:3000/api/scraping/recommendations/cpf?api_key=${apiKey}`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cpf: '12345678900',
    recommendLogic: 'PERSONAL'
  })
});
```

## 🛡️ Endpoints Protegidos vs Públicos

### Endpoints que requieren autenticación

Todos estos endpoints requieren una API key válida:

- ✅ `POST /api/scraping/start` - Iniciar scraping
- ✅ `POST /api/scraping/recommendations/cpf` - Recomendaciones por CPF
- ✅ `GET /api/scraping/jobs/:id` - Estado de un job
- ✅ `GET /api/scraping/jobs` - Listar todos los jobs
- ✅ `DELETE /api/scraping/jobs/:id` - Cancelar un job
- ✅ `POST /api/scraping/jobs/:id/retry` - Reintentar un job
- ✅ `DELETE /api/scraping/jobs/completed/clear` - Limpiar jobs completados

### Endpoints públicos

Estos endpoints NO requieren autenticación:

- 🌐 `GET /api/scraping/stats` - Estadísticas de la cola (público para monitoreo)
- 🌐 `GET /api/docs` - Documentación Swagger
- 🌐 `GET /health` - Health check (si está implementado)

## ❌ Manejo de Errores

### Error 401: API Key faltante

```json
{
  "statusCode": 401,
  "message": "API Key is missing",
  "error": "Unauthorized"
}
```

**Solución:** Incluye tu API key usando uno de los 3 métodos.

### Error 401: API Key inválida

```json
{
  "statusCode": 401,
  "message": "Invalid API Key",
  "error": "Unauthorized"
}
```

**Solución:** Verifica que:
1. La key esté correctamente configurada en el archivo `.env`
2. La key que estás enviando coincida exactamente (sin espacios)
3. El servidor se haya reiniciado después de actualizar `.env`

## 🔧 Configuración Avanzada

### Múltiples API Keys

Puedes tener diferentes keys para diferentes propósitos:

```env
# Desarrollo
API_KEYS=dev-key-123,test-key-456,admin-key-789

# Producción
API_KEYS=prod-frontend-key,prod-backend-key,prod-admin-key
```

### Ejemplo de uso en equipo:

```env
API_KEYS=team-member-1-key,team-member-2-key,ci-cd-pipeline-key,monitoring-tool-key
```

### Rotar API Keys

Para rotar una key sin downtime:

1. Agrega la nueva key manteniendo la antigua:
```env
API_KEYS=old-key-123,new-key-456
```

2. Actualiza todos los clientes para usar `new-key-456`

3. Una vez que todos los clientes estén actualizados, remueve la key antigua:
```env
API_KEYS=new-key-456
```

## 🧪 Testing con Swagger

Cuando uses la documentación Swagger (`http://localhost:3000/api/docs`):

1. Haz clic en el botón **"Authorize"** en la parte superior derecha
2. Ingresa tu API key en el campo `X-API-Key` o `Bearer`
3. Haz clic en **"Authorize"**
4. Ahora puedes probar todos los endpoints directamente desde Swagger

## 📝 Ejemplos Completos

### Ejemplo 1: Obtener recomendaciones por CPF

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-123" \
  -d '{
    "cpf": "70653456298",
    "scarabId": "1916F613C8B45191",
    "recommendLogic": "PERSONAL",
    "limit": 10,
    "includeCategories": true,
    "headless": true,
    "useCache": true
  }'
```

Respuesta:
```json
{
  "id": "1",
  "status": "pending",
  "startedAt": "2024-01-29T10:00:00.000Z"
}
```

### Ejemplo 2: Verificar estado del job

```bash
curl -X GET http://localhost:3000/api/scraping/jobs/1 \
  -H "X-API-Key: your-secret-key-123"
```

Respuesta:
```json
{
  "id": "1",
  "status": "completed",
  "startedAt": "2024-01-29T10:00:00.000Z",
  "completedAt": "2024-01-29T10:00:15.000Z",
  "result": {
    "success": true,
    "products": [...],
    "totalProducts": 10
  }
}
```

### Ejemplo 3: Endpoint público (sin autenticación)

```bash
curl -X GET http://localhost:3000/api/scraping/stats
```

Respuesta:
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

## 🔒 Mejores Prácticas de Seguridad

1. **Usa keys fuertes:**
   - Mínimo 32 caracteres
   - Usa caracteres alfanuméricos aleatorios
   - Genera con herramientas criptográficas seguras

2. **Nunca compartas tus keys:**
   - No las incluyas en repositorios públicos
   - No las envíes por email o chat
   - No las incluyas en screenshots

3. **Usa diferentes keys por ambiente:**
   ```env
   # Desarrollo
   API_KEYS=dev-key-only-for-local

   # Staging
   API_KEYS=staging-key-only-for-staging

   # Producción
   API_KEYS=production-key-secure-random-string
   ```

4. **Rota keys periódicamente:**
   - Cada 90 días en producción
   - Inmediatamente si sospechas que se comprometió

5. **Monitorea el uso:**
   - Revisa los logs regularmente
   - Alerta sobre intentos de autenticación fallidos
   - Implementa rate limiting si es necesario

6. **Variables de entorno:**
   - Nunca hardcodees keys en el código
   - Usa variables de entorno o secretos manejados
   - En producción, usa servicios como AWS Secrets Manager, HashiCorp Vault, etc.

## 🐛 Troubleshooting

### La autenticación no funciona después de actualizar .env

```bash
# Reinicia el servidor
npm run start:dev
```

### Olvido cuáles son mis API keys

```bash
# Ver las keys configuradas (cuidado en producción)
cat .env | grep API_KEYS
```

### Quiero deshabilitar la autenticación temporalmente

**No recomendado para producción**, pero útil para desarrollo:

Edita `src/common/guards/api-key.guard.ts` y temporalmente comenta la validación o cambia `API_KEYS` a un valor vacío causará que todas las requests fallen, así que asegúrate de tener al menos una key configurada.

## 📚 Recursos Adicionales

- [README.md](README.md) - Documentación general
- [CPF_GUIDE.md](CPF_GUIDE.md) - Guía de recomendaciones por CPF
- [REDOCLY_GUIDE.md](REDOCLY_GUIDE.md) - Documentación Redocly
- Swagger UI: `http://localhost:3000/api/docs`

---

**Creado:** Enero 2024
**Última actualización:** Enero 2024
