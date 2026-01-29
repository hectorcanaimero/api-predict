#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║  Setup de Documentação Redocly                               ║"
echo "║  API de Recomendações por CPF                                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Execute este script da raiz do projeto"
  exit 1
fi

# 1. Instalar dependências
echo "📦 1. Instalando dependências do Redocly..."
npm install --save-dev @redocly/cli redoc

if [ $? -ne 0 ]; then
  echo "❌ Erro ao instalar dependências"
  exit 1
fi

echo "✅ Dependências instaladas"
echo ""

# 2. Validar especificação OpenAPI
echo "🔍 2. Validando especificação OpenAPI..."
npm run docs:validate

if [ $? -ne 0 ]; then
  echo "⚠️ Atenção: Encontrados problemas na validação"
  echo "   Verifique o arquivo docs/openapi-cpf.yaml"
else
  echo "✅ Especificação válida"
fi
echo ""

# 3. Gerar documentação estática
echo "🏗️ 3. Gerando documentação HTML..."
npm run docs:redoc

if [ $? -ne 0 ]; then
  echo "⚠️ Atenção: Erro ao gerar HTML"
else
  echo "✅ HTML gerado: docs/redoc-cpf.html"
fi
echo ""

# 4. Instruções finais
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Completo!                                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Para visualizar a documentação:"
echo ""
echo "  Opção 1 - Servidor Live (Recomendado):"
echo "    npm run docs:serve"
echo "    Depois abra: http://localhost:8080"
echo ""
echo "  Opção 2 - Arquivo HTML:"
echo "    open docs/index.html"
echo ""
echo "  Opção 3 - HTML Gerado:"
echo "    open docs/redoc-cpf.html"
echo ""
echo "🔧 Comandos úteis:"
echo "  npm run docs:serve     - Servidor com live reload"
echo "  npm run docs:redoc     - Gerar HTML estático"
echo "  npm run docs:validate  - Validar especificação"
echo ""

# Perguntar se deseja abrir agora
read -p "❓ Deseja abrir a documentação agora? (s/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[SsYy]$ ]]; then
  echo "🚀 Iniciando servidor..."
  npm run docs:serve
fi
