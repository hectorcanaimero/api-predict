# Quick Start Guide

Guía rápida para poner en marcha el orquestador de scraping de Emarsys.

## Pasos rápidos

### 1. Instalar dependencias

```bash
npm install
npx playwright install chromium
```

### 2. Configurar Redis

**Opción A - Docker (recomendado):**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Opción B - Redis local:**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo service redis-server start
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
EMARSYS_URL=https://extend.emarsys.com
EMARSYS_USERNAME=tu_usuario@example.com
EMARSYS_PASSWORD=tu_password
```

### 4. Iniciar la aplicación

```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000`

### 5. Probar la API

**Usando curl:**
```bash
curl -X POST http://localhost:3000/api/scraping/start \
  -H "Content-Type: application/json" \
  -d '{
    "maxProducts": 10,
    "headless": true
  }'
```

**Usando el navegador:**
Visitar `http://localhost:3000/api/docs` para ver la documentación Swagger interactiva.

### 6. Verificar el estado del job

```bash
# Reemplazar {jobId} con el ID obtenido en el paso anterior
curl http://localhost:3000/api/scraping/jobs/{jobId}
```

## Docker Compose (Alternativa)

Si prefieres usar Docker para todo:

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener
docker-compose down
```

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/scraping/start` | Iniciar scraping |
| GET | `/api/scraping/jobs/{id}` | Estado del job |
| GET | `/api/scraping/jobs` | Listar todos los jobs |
| GET | `/api/scraping/stats` | Estadísticas |
| DELETE | `/api/scraping/jobs/{id}` | Cancelar job |
| POST | `/api/scraping/jobs/{id}/retry` | Reintentar job |

## Solución de problemas

### Redis no se conecta
```bash
# Verificar que Redis esté corriendo
redis-cli ping
# Debería responder: PONG
```

### Playwright no encuentra el navegador
```bash
npx playwright install chromium
```

### Puerto 3000 ya en uso
Cambiar el puerto en `.env`:
```env
PORT=3001
```

## Próximos pasos

1. Leer el [README.md](README.md) completo para más detalles
2. Explorar la [documentación Swagger](http://localhost:3000/api/docs)
3. Ver ejemplos en la carpeta `examples/`
4. Personalizar los selectores de scraping en `src/scraper/scraper.service.ts`

## Recursos

- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/
- **GitHub Issues**: Para reportar problemas

¡Listo para comenzar! 🚀
