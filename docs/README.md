# 📚 Documentação da API de Recomendações por CPF

Documentação interativa e completa do endpoint de recomendações de produtos usando Redocly.

## 🎯 O que é isso?

Esta é a documentação **exclusiva** do endpoint de recomendações por CPF usando **Emarsys Scarab**.

A documentação inclui:
- ✅ Especificação OpenAPI 3.0 completa
- ✅ Interface interativa com Redoc
- ✅ Exemplos de requisições e respostas
- ✅ Validações e schemas detalhados
- ✅ Descrições em português

## 🚀 Visualizar a Documentação

### Opção 1: Servidor Live (Recomendado)

```bash
# Instalar dependências
npm install

# Iniciar servidor de preview
npm run docs:serve
```

Abra: **http://localhost:8080**

### Opção 2: Gerar HTML Estático

```bash
# Gerar arquivo HTML
npm run docs:redoc

# O arquivo será criado em: docs/redoc-cpf.html
# Abra-o diretamente no navegador
open docs/redoc-cpf.html
```

### Opção 3: Usar o arquivo já pronto

Abra diretamente no navegador:
```bash
open docs/index.html
```

## 📝 Arquivos

```
docs/
├── openapi-cpf.yaml      # Especificação OpenAPI
├── index.html            # Interface Redoc customizada
├── redoc-cpf.html        # HTML gerado (após npm run docs:redoc)
└── README.md             # Este arquivo
```

## 🔧 Scripts Disponíveis

```bash
# Visualizar documentação com live reload
npm run docs:serve

# Gerar HTML estático
npm run docs:redoc

# Validar especificação OpenAPI
npm run docs:validate
```

## 📖 Conteúdo da Documentação

A documentação cobre:

### 1. Endpoint Principal: POST /api/scraping/recommendations/cpf
- Parâmetros completos
- Exemplos de uso
- Diferentes lógicas de recomendação
- Filtros avançados
- Tratamento de erros

### 2. Consulta de Status: GET /api/scraping/jobs/{id}
- Estados do job
- Estrutura de resposta
- Polling pattern

### 3. Estatísticas: GET /api/scraping/stats
- Métricas da fila
- Monitoramento

### 4. Schemas Completos
- `CpfRecommendationRequest`
- `JobCreated`, `JobCompleted`, `JobFailed`
- `ScrapingResult`
- `Product`
- E mais...

## 🎨 Customização

Para customizar a aparência, edite:

**Cores e tema**: [.redocly.yaml](../.redocly.yaml)

```yaml
theme:
  openapi:
    theme:
      colors:
        primary:
          main: '#32329f'  # Sua cor primária
```

**HTML customizado**: [docs/index.html](index.html)

## 🔗 Links Úteis

- **Swagger API**: http://localhost:3000/api/docs (quando o servidor está rodando)
- **Guia de CPF**: [FLUJO_CPF_70653456298.md](../FLUJO_CPF_70653456298.md)
- **Guia Completo**: [CPF_GUIDE.md](../CPF_GUIDE.md)
- **README Principal**: [README.md](../README.md)

## 📱 Preview

A documentação inclui:

- 🎯 Header customizado com badges
- 📚 Links rápidos para recursos
- 🎨 Tema personalizado com cores do projeto
- 📖 Exemplos interativos
- 🔍 Busca integrada
- 📱 Responsivo (mobile-friendly)

## 🛠️ Desenvolvimento

### Editar a Especificação

1. Edite [openapi-cpf.yaml](openapi-cpf.yaml)
2. Valide as mudanças: `npm run docs:validate`
3. Visualize: `npm run docs:serve`

### Adicionar Novos Exemplos

No arquivo `openapi-cpf.yaml`, na seção `examples`:

```yaml
examples:
  meuExemplo:
    summary: Minha Descrição
    value:
      cpf: "12345678900"
      recommendLogic: "PERSONAL"
      limit: 10
```

### Adicionar Novos Endpoints

Se precisar adicionar mais endpoints no futuro:

1. Adicione o path em `paths:` no YAML
2. Defina o schema em `components/schemas:`
3. Execute `npm run docs:validate`

## 🌐 Publicação

Para publicar a documentação online:

```bash
# Gerar HTML estático
npm run docs:redoc

# Deploy o arquivo docs/redoc-cpf.html
# Para GitHub Pages, Netlify, Vercel, etc.
```

Ou use o `index.html` diretamente que já está pronto.

## 📞 Suporte

Dúvidas sobre a documentação? Veja:
- [CPF Guide](../CPF_GUIDE.md)
- [Main README](../README.md)
- [Quick Start](../QUICKSTART.md)

---

**Versão da Documentação**: 1.0.0
**Última Atualização**: Janeiro 2024
