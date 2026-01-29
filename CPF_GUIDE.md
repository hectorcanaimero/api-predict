# Guía de Recomendaciones por CPF

Esta guía explica cómo usar el sistema de recomendaciones de productos basado en CPF (Cadastro de Pessoas Físicas) usando Emarsys Scarab.

## Introducción

El sistema utiliza **Emarsys Scarab**, el motor de recomendaciones de Emarsys, para obtener productos personalizados basados en el CPF del cliente. Scarab ejecuta JavaScript en el navegador para generar recomendaciones dinámicas.

## Endpoint

```
POST /api/scraping/recommendations/cpf
```

## Parámetros del Request

### Obligatorios

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `cpf` | string | CPF del cliente | `"123.456.789-00"` o `"12345678900"` |

### Opcionales

| Parámetro | Tipo | Descripción | Default | Ejemplo |
|-----------|------|-------------|---------|---------|
| `scarabId` | string | ID de Scarab (merchant ID) | Desde `.env` | `"1916F613C8B45191"` |
| `recommendLogic` | string | Lógica de recomendación | `"PERSONAL"` | `"RELATED"` |
| `limit` | number | Máximo de productos | `10` | `20` |
| `includeCategories` | string[] | Categorías a incluir | `[]` | `["WOMEN>Coats"]` |
| `excludeItems` | string[] | IDs a excluir | `[]` | `["2540", "2538"]` |
| `url` | string | URL de Emarsys | Desde `.env` | `"https://extend.emarsys.com"` |
| `username` | string | Usuario para login | Desde `.env` | `"user@example.com"` |
| `password` | string | Contraseña | Desde `.env` | `"password123"` |
| `timeout` | number | Timeout en ms | `30000` | `45000` |
| `headless` | boolean | Modo headless | `true` | `false` |
| `useCache` | boolean | Usar caché | `true` | `false` |

## Lógicas de Recomendación

Emarsys Scarab soporta diferentes lógicas de recomendación:

| Lógica | Descripción | Uso Común |
|--------|-------------|-----------|
| `PERSONAL` | Recomendaciones personalizadas basadas en el historial del usuario | Homepage, emails personalizados |
| `RELATED` | Productos relacionados al item actual | Páginas de producto |
| `ALSO_BOUGHT` | Productos que otros compraron junto con este | Páginas de producto, carrito |
| `POPULAR` | Productos más populares | Homepage, categorías |
| `CATEGORY` | Productos de la misma categoría | Páginas de categoría |
| `CART` | Recomendaciones basadas en el carrito actual | Página de carrito, checkout |

## Ejemplos de Uso

### 1. Recomendaciones Básicas

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123.456.789-00",
    "limit": 10
  }'
```

Respuesta:
```json
{
  "id": "123",
  "status": "pending",
  "startedAt": "2024-01-20T10:00:00.000Z"
}
```

### 2. Con Filtro de Categoría

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123.456.789-00",
    "recommendLogic": "PERSONAL",
    "limit": 5,
    "includeCategories": ["WOMEN>Coats & Jackets", "WOMEN>Dresses"]
  }'
```

### 3. Excluyendo Productos

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123.456.789-00",
    "excludeItems": ["2540", "2538", "1234"],
    "limit": 10
  }'
```

### 4. Con Scarab ID Personalizado

```bash
curl -X POST http://localhost:3000/api/scraping/recommendations/cpf \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123.456.789-00",
    "scarabId": "1916F613C8B45191",
    "recommendLogic": "RELATED",
    "limit": 10
  }'
```

## Verificar Estado del Job

```bash
curl http://localhost:3000/api/scraping/jobs/123
```

Respuesta cuando está completado:
```json
{
  "id": "123",
  "status": "completed",
  "startedAt": "2024-01-20T10:00:00.000Z",
  "completedAt": "2024-01-20T10:00:15.000Z",
  "result": {
    "success": true,
    "products": [
      {
        "id": "prod-456",
        "name": "Casaco de Inverno Feminino",
        "description": "Casaco elegante para o inverno",
        "price": 299.99,
        "currency": "BRL",
        "imageUrl": "https://...",
        "url": "https://...",
        "category": "WOMEN>Coats & Jackets",
        "brand": "Fashion Brand",
        "scrapedAt": "2024-01-20T10:00:15.000Z"
      }
    ],
    "totalProducts": 10,
    "scrapedAt": "2024-01-20T10:00:15.000Z",
    "duration": 15000
  }
}
```

## Formato del CPF

El sistema acepta CPF en dos formatos:

1. **Con formatação**: `123.456.789-00`
2. **Sin formatação**: `12345678900`

El sistema limpia automáticamente los caracteres especiales antes de enviar a Scarab.

## Caché

Por defecto, los resultados se almacenan en caché durante 1 hora. La clave de caché se genera usando:
- CPF (sin formatação)
- Lógica de recomendación
- Límite de productos

Para bypasear el caché:
```json
{
  "cpf": "123.456.789-00",
  "useCache": false
}
```

## Configuración

### Variables de Entorno

Agregar en [.env](.env):

```env
# Emarsys Scarab
EMARSYS_URL=https://extend.emarsys.com
EMARSYS_SCARAB_ID=1916F613C8B45191
EMARSYS_USERNAME=usuario@example.com
EMARSYS_PASSWORD=password123
```

## Códigos de Ejemplo

Ver archivos completos en la carpeta `examples/`:

- [cpf-recommendations-example.ts](examples/cpf-recommendations-example.ts) - Ejemplos en TypeScript
- [cpf-api-requests.http](examples/cpf-api-requests.http) - Requests HTTP de ejemplo

### JavaScript/TypeScript

```typescript
async function getRecommendations(cpf: string) {
  const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cpf: cpf,
      recommendLogic: 'PERSONAL',
      limit: 10,
    }),
  });

  const job = await response.json();

  // Esperar por el resultado
  let result;
  while (true) {
    const status = await fetch(`http://localhost:3000/api/scraping/jobs/${job.id}`);
    result = await status.json();

    if (result.status === 'completed') break;
    if (result.status === 'failed') throw new Error(result.error);

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return result.result.products;
}

// Uso
const products = await getRecommendations('123.456.789-00');
console.log('Productos recomendados:', products);
```

### Python

```python
import requests
import time

def get_recommendations(cpf: str):
    # Iniciar job
    response = requests.post(
        'http://localhost:3000/api/scraping/recommendations/cpf',
        json={
            'cpf': cpf,
            'recommendLogic': 'PERSONAL',
            'limit': 10
        }
    )
    job = response.json()
    job_id = job['id']

    # Esperar resultado
    while True:
        response = requests.get(f'http://localhost:3000/api/scraping/jobs/{job_id}')
        result = response.json()

        if result['status'] == 'completed':
            return result['result']['products']
        elif result['status'] == 'failed':
            raise Exception(result['error'])

        time.sleep(2)

# Uso
products = get_recommendations('123.456.789-00')
print('Produtos recomendados:', products)
```

## Troubleshooting

### Error: "Scarab script not found"

Verificar que el `scarabId` sea correcto. Debe ser tu merchant ID de Emarsys.

### Error: "CPF debe estar en formato..."

El CPF debe estar en formato `123.456.789-00` o `12345678900`.

### Sin resultados

- Verificar que el CPF esté registrado en Emarsys
- Intentar con otra lógica de recomendación
- Verificar que haya productos disponibles en el catálogo

### Timeout

Aumentar el timeout:
```json
{
  "cpf": "123.456.789-00",
  "timeout": 60000
}
```

## Mejores Prácticas

1. **Usar caché** para reducir carga en producción
2. **Limitar productos** a lo necesario (10-20 típicamente)
3. **Manejar errores** apropiadamente en tu aplicación
4. **Monitorear jobs** usando el endpoint de estadísticas
5. **Limpiar jobs viejos** periódicamente

## Recursos

- Documentación completa: [README.md](README.md)
- API Docs (Swagger): http://localhost:3000/api/docs
- Ejemplos de código: [examples/](examples/)
- Guía rápida: [QUICKSTART.md](QUICKSTART.md)

## Soporte

Para reportar issues relacionados con CPF o Scarab, crear un issue en el repositorio con:
- CPF usado (parcialmente mascarado)
- Lógica de recomendación
- Logs del error
- Parámetros del request
