#!/bin/bash

# Test de recomendaciones para CPF: 70653456298
# Este script hace el flujo completo de scraping

BASE_URL="http://localhost:3000"
CPF="70653456298"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Test de Recomendaciones por CPF - Emarsys Scarab           ║"
echo "║  CPF: 70653456298                                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Iniciar el job
echo "🚀 1. Iniciando solicitud de recomendaciones..."
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/scraping/recommendations/cpf" \
  -H "Content-Type: application/json" \
  -d "{
    \"cpf\": \"$CPF\",
    \"recommendLogic\": \"PERSONAL\",
    \"limit\": 10,
    \"headless\": true,
    \"useCache\": true
  }")

echo "✅ Respuesta del servidor:"
echo "$RESPONSE" | jq '.'
echo ""

# Extraer el Job ID
JOB_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$JOB_ID" == "null" ] || [ -z "$JOB_ID" ]; then
  echo "❌ Error: No se pudo crear el job"
  exit 1
fi

echo "📋 Job ID: $JOB_ID"
echo ""

# 2. Polling - esperar a que complete
echo "⏳ 2. Esperando a que el job complete..."
echo ""

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  # Esperar 2 segundos
  sleep 2

  # Consultar estado
  STATUS_RESPONSE=$(curl -s "$BASE_URL/api/scraping/jobs/$JOB_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')

  echo "   [Intento $ATTEMPT/$MAX_ATTEMPTS] Status: $STATUS"

  # Verificar si completó
  if [ "$STATUS" == "completed" ]; then
    echo ""
    echo "🎉 ¡Job completado exitosamente!"
    echo ""

    # Mostrar resultados
    echo "📊 RESULTADOS DEL SCRAPING"
    echo "==========================================================================="

    TOTAL=$(echo "$STATUS_RESPONSE" | jq -r '.result.totalProducts')
    DURATION=$(echo "$STATUS_RESPONSE" | jq -r '.result.duration')
    SCRAPED_AT=$(echo "$STATUS_RESPONSE" | jq -r '.result.scrapedAt')

    echo "Total de productos: $TOTAL"
    echo "Duración: ${DURATION}ms"
    echo "Fecha: $SCRAPED_AT"
    echo ""

    echo "🛍️ PRODUCTOS RECOMENDADOS PARA CPF: $CPF"
    echo "==========================================================================="
    echo ""

    # Mostrar cada producto
    echo "$STATUS_RESPONSE" | jq -r '.result.products[] |
      "📦 Producto: \(.name // "N/A")
   ID: \(.id // "N/A")
   Precio: \(.price // "N/A") \(.currency // "")
   Categoría: \(.category // "N/A")
   Marca: \(.brand // "N/A")
   URL: \(.url // "N/A")
"'

    echo ""
    echo "✅ Test completado exitosamente"
    exit 0
  fi

  # Verificar si falló
  if [ "$STATUS" == "failed" ]; then
    echo ""
    echo "❌ Job falló"
    ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.error')
    echo "Error: $ERROR"
    exit 1
  fi
done

echo ""
echo "⏱️ Timeout: El job no completó en el tiempo esperado"
exit 1
