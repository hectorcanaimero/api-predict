# 📦 Instalação da Documentação Redocly

Guia rápido para instalar e visualizar a documentação.

## ⚡ Instalação Rápida

### Opção 1: Script Automático (Mais Fácil)

```bash
cd docs
./setup-docs.sh
```

Pronto! O script faz tudo automaticamente.

### Opção 2: Manual

```bash
# 1. Instalar dependências
npm install

# 2. Validar especificação
npm run docs:validate

# 3. (Opcional) Gerar HTML estático
npm run docs:redoc
```

## 👀 Visualizar Documentação

### Método 1: Servidor Live

```bash
npm run docs:serve
```

Abra: **http://localhost:8080**

### Método 2: Arquivo HTML

```bash
# Mac/Linux
open docs/index.html

# Windows
start docs/index.html

# Ou simplesmente arraste o arquivo para o navegador
```

## ✅ Verificar Instalação

```bash
# Deve listar os comandos disponíveis
npm run | grep docs
```

Saída esperada:
```
docs:redoc
docs:serve
docs:validate
```

## 🐛 Problemas?

### Dependências não instaladas

```bash
npm install --save-dev @redocly/cli redoc
```

### Porta 8080 em uso

```bash
# Linux/Mac
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### YAML inválido

```bash
npm run docs:validate
```

## 📱 Próximos Passos

1. ✅ Visualizar documentação: `npm run docs:serve`
2. ✅ Ler guia completo: [REDOCLY_GUIDE.md](../REDOCLY_GUIDE.md)
3. ✅ Customizar tema: editar [.redocly.yaml](../.redocly.yaml)
4. ✅ Testar API: usar exemplos da documentação

## 🔗 Links Úteis

- [Guia Redocly](../REDOCLY_GUIDE.md) - Guia completo
- [README Docs](README.md) - Visão geral da documentação
- [OpenAPI Spec](openapi-cpf.yaml) - Especificação da API

---

Criado em: Janeiro 2024
