# 📚 Guia de Documentação Redocly

Guia completo para usar a documentação interativa do endpoint de recomendações por CPF.

## 🎯 O que é Redocly?

Redocly é uma ferramenta que transforma especificações OpenAPI em documentação **interativa, bonita e fácil de usar**.

### Por que usar Redocly?

- ✅ **Interface moderna e limpa**
- ✅ **Exemplos interativos** com diferentes cenários
- ✅ **Navegação intuitiva** por endpoints
- ✅ **Busca integrada** para encontrar rapidamente
- ✅ **Responsivo** - funciona em mobile
- ✅ **Customizável** - cores, tema, layout

## 🚀 Instalação Rápida

### Opção 1: Script Automático (Recomendado)

```bash
cd docs
./setup-docs.sh
```

Este script:
1. Instala as dependências necessárias
2. Valida a especificação OpenAPI
3. Gera a documentação HTML
4. Pergunta se você quer abrir agora

### Opção 2: Manual

```bash
# 1. Instalar dependências
npm install --save-dev @redocly/cli redoc

# 2. Validar especificação
npm run docs:validate

# 3. Gerar HTML (opcional)
npm run docs:redoc
```

## 📖 Como Usar

### Método 1: Servidor Live (Melhor para desenvolvimento)

```bash
npm run docs:serve
```

Depois abra: **http://localhost:8080**

**Vantagens:**
- ✅ Live reload automático quando você edita o YAML
- ✅ Hot Module Replacement
- ✅ Perfeito para desenvolvimento

### Método 2: HTML Standalone

Simplesmente abra no navegador:

```bash
# Opção A: HTML customizado (recomendado)
open docs/index.html

# Opção B: HTML gerado
open docs/redoc-cpf.html
```

**Vantagens:**
- ✅ Não precisa de servidor
- ✅ Pode compartilhar o arquivo
- ✅ Pode hospedar em qualquer lugar

### Método 3: Integrado com a API

Quando a API está rodando, você também pode:

```bash
# Swagger (já existente)
http://localhost:3000/api/docs

# Redocly poderia ser servido via NestJS
# (requer configuração adicional)
```

## 🎨 Customização

### Cores e Tema

Edite [.redocly.yaml](.redocly.yaml):

```yaml
theme:
  openapi:
    theme:
      colors:
        primary:
          main: '#32329f'      # Cor principal
        success:
          main: '#00aa13'      # Cor de sucesso
      typography:
        fontSize: '16px'
        fontFamily: '"Inter", sans-serif'
      sidebar:
        backgroundColor: '#fafafa'
        textColor: '#333333'
        activeTextColor: '#32329f'
      rightPanel:
        backgroundColor: '#263238'
```

### Header Customizado

Edite [docs/index.html](docs/index.html):

```html
<div class="page-header">
  <h1>🎯 Seu Título Aqui</h1>
  <p>Sua descrição aqui</p>
</div>
```

### Adicionar Logo

Em [docs/index.html](docs/index.html):

```html
<div class="page-header">
  <img src="seu-logo.png" alt="Logo" style="height: 50px;">
  <h1>API Recomendações CPF</h1>
</div>
```

## 📝 Editando a Documentação

### Estrutura do YAML

```yaml
openapi: 3.0.3
info:           # Informações gerais
  title: ...
  description: ...
  version: ...

servers:        # URLs dos servidores
  - url: http://localhost:3000
    description: Dev

paths:          # Endpoints da API
  /api/...:
    post:
      ...

components:     # Schemas reutilizáveis
  schemas:
    ...
```

### Adicionar Novo Exemplo

Em [docs/openapi-cpf.yaml](docs/openapi-cpf.yaml):

```yaml
paths:
  /api/scraping/recommendations/cpf:
    post:
      requestBody:
        content:
          application/json:
            examples:
              meuNovoExemplo:
                summary: Descrição do exemplo
                value:
                  cpf: "12345678900"
                  recommendLogic: "POPULAR"
                  limit: 20
```

### Adicionar Descrições Ricas

Use Markdown nas descrições:

```yaml
description: |
  ## Título Grande

  Este endpoint permite...

  ### Características
  - ✅ Feature 1
  - ✅ Feature 2

  ### Exemplo
  ```bash
  curl -X POST ...
  ```
```

### Adicionar Novo Endpoint

```yaml
paths:
  /api/novo-endpoint:
    get:
      tags:
        - Nova Tag
      summary: Resumo curto
      description: Descrição detalhada
      operationId: getNovo
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MeuSchema'
```

## 🔧 Scripts Disponíveis

```bash
# Servidor live com hot reload
npm run docs:serve

# Gerar HTML estático
npm run docs:redoc

# Validar especificação OpenAPI
npm run docs:validate
```

### Detalhes dos Scripts

**`npm run docs:serve`**
- Inicia servidor em localhost:8080
- Hot reload automático
- Usa a configuração do `.redocly.yaml`

**`npm run docs:redoc`**
- Gera arquivo HTML standalone
- Saída: `docs/redoc-cpf.html`
- Não precisa de servidor para funcionar

**`npm run docs:validate`**
- Valida a especificação OpenAPI
- Mostra erros e warnings
- Útil antes de fazer commit

## 🌐 Deploy

### GitHub Pages

```bash
# 1. Gerar HTML
npm run docs:redoc

# 2. Mover para pasta docs (se necessário)
cp docs/redoc-cpf.html docs/index.html

# 3. Commit e push
git add docs/
git commit -m "docs: update redocly documentation"
git push

# 4. Configurar GitHub Pages
# Settings > Pages > Source: docs folder
```

URL: `https://seu-usuario.github.io/seu-repo/`

### Netlify / Vercel

```bash
# Netlify
netlify deploy --dir=docs

# Vercel
vercel --prod docs/
```

### Servidor próprio

```bash
# Copiar arquivos
scp docs/* user@server:/var/www/html/api-docs/

# Ou usar Docker
docker run -d -p 80:80 -v $(pwd)/docs:/usr/share/nginx/html nginx
```

## 📱 Features da Documentação

### O que está incluído?

✅ **Endpoint de Recomendações**
- POST `/api/scraping/recommendations/cpf`
- Todos os parâmetros documentados
- 5+ exemplos de uso
- Validações e constraints

✅ **Consulta de Jobs**
- GET `/api/scraping/jobs/{id}`
- Estados do job
- Exemplos de polling

✅ **Estatísticas**
- GET `/api/scraping/stats`
- Métricas da fila

✅ **Schemas Completos**
- `CpfRecommendationRequest`
- `Product`
- `ScrapingResult`
- `JobStatus` (pending, processing, completed, failed)
- `QueueStats`
- `Error`

✅ **Exemplos Interativos**
- Requisição básica
- Com filtros de categoria
- Com exclusões
- Diferentes lógicas (PERSONAL, POPULAR, etc.)

✅ **Descrições em Português**
- Interface em PT-BR
- Exemplos com dados brasileiros (CPF, BRL, etc.)

## 🎓 Boas Práticas

### 1. Sempre Valide

Antes de fazer commit:
```bash
npm run docs:validate
```

### 2. Use Exemplos Reais

```yaml
examples:
  realista:
    summary: Caso Real
    value:
      cpf: "70653456298"  # CPF real de teste
      recommendLogic: "PERSONAL"
      limit: 10
```

### 3. Documente Erros

```yaml
responses:
  '400':
    description: Requisição inválida
    content:
      application/json:
        example:
          statusCode: 400
          message: "CPF inválido"
          error: "Bad Request"
```

### 4. Agrupe por Tags

```yaml
tags:
  - name: CPF Recommendations
    description: Endpoints de recomendações
  - name: Job Status
    description: Gerenciamento de jobs
```

### 5. Use Referências

```yaml
# Ao invés de repetir
schema:
  $ref: '#/components/schemas/Product'
```

## 🐛 Troubleshooting

### Erro: "Cannot find module '@redocly/cli'"

```bash
npm install --save-dev @redocly/cli redoc
```

### Erro: "Port 8080 already in use"

```bash
# Matar processo na porta 8080
lsof -ti:8080 | xargs kill -9

# Ou usar outra porta
redocly preview-docs docs/openapi-cpf.yaml --port 8081
```

### YAML inválido

```bash
# Validar sintaxe
npm run docs:validate

# Ver erros detalhados
redocly lint docs/openapi-cpf.yaml
```

### Hot reload não funciona

```bash
# Reiniciar servidor
npm run docs:serve
```

### HTML gerado não funciona

Verifique se os paths estão corretos:
- `openapi-cpf.yaml` deve estar na mesma pasta que `index.html`
- Ou use path absoluto no script

## 📊 Comparação: Redocly vs Swagger

| Feature | Redocly | Swagger UI |
|---------|---------|------------|
| Interface | ⭐⭐⭐⭐⭐ Moderna | ⭐⭐⭐ Básica |
| Customização | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Média |
| Performance | ⭐⭐⭐⭐⭐ Rápida | ⭐⭐⭐⭐ Boa |
| Navegação | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐ Básica |
| Mobile | ⭐⭐⭐⭐⭐ Sim | ⭐⭐⭐ Parcial |
| Try it out | ❌ Não | ✅ Sim |
| Busca | ✅ Sim | ✅ Sim |

**Conclusão**: Use **ambos**!
- Redocly: Para documentação bonita e apresentável
- Swagger: Para testar a API interativamente

## 🔗 Links Úteis

- [Redocly Docs](https://redocly.com/docs/)
- [OpenAPI Spec](https://swagger.io/specification/)
- [Redoc GitHub](https://github.com/Redocly/redoc)
- [Exemplos Redocly](https://redocly.com/docs/redoc/quickstart/)

## 📞 Suporte

Problemas com a documentação?

1. Verifique se validou: `npm run docs:validate`
2. Veja os logs de erro
3. Consulte a [documentação do Redocly](https://redocly.com/docs/)
4. Abra uma issue no projeto

---

**Criado com** ❤️ **usando Redocly**
