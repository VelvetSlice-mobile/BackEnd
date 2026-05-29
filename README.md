# Velvet Slice — BackEnd

API REST do projeto Velvet Slice, responsável por autenticação, produtos, pedidos, cupons, avaliações e pagamentos.

**Stack:** Node.js + Express 5 + SQLite3 + Mercado Pago

---

## Requisitos

- Node.js 20 LTS (recomendado)
- npm 10+

---

## Instalação

```bash
git clone <url-do-repositorio>
cd Velvet/BackEnd
npm install
```

Crie o arquivo `.env` (veja seção abaixo) e suba:

```bash
npm run dev
```

O banco de dados SQLite (`velvetslice_server.db`) é criado automaticamente na primeira execução.

---

## Variáveis de ambiente (.env)

```env
PORT=3000
CLIENT_TOKEN_SECRET=sua_chave_secreta_aqui
ADMIN_REGISTER_CODE=seu_codigo_admin_aqui
MP_ACCESS_TOKEN=seu_token_mercado_pago_aqui
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PORT` | Não | Porta da API. Padrão: `3000` |
| `CLIENT_TOKEN_SECRET` | Sim | Chave para assinar os JWTs. Use string longa e aleatória |
| `ADMIN_REGISTER_CODE` | Sim | Código secreto para cadastrar administrador |
| `MP_ACCESS_TOKEN` | Sim | Token de acesso do Mercado Pago |

> **Nunca commite o `.env`.** O `.gitignore` já está configurado para ignorá-lo.

---

## Como rodar

```bash
# Desenvolvimento (reinicia automaticamente ao salvar)
npm run dev

# Produção
npm start
```

Verificar se está no ar:

```bash
curl http://127.0.0.1:3000/
# Resposta: Servidor Velvet Slice Online!
```

---

## Estrutura do projeto

```
BackEnd/
├── src/
│   ├── config/
│   │   ├── db.js                  # Conexão SQLite + criação/migração das tabelas
│   │   ├── auth.js                # Geração e verificação de JWT
│   │   ├── avatarUpload.js        # Multer para upload de avatares (3MB, jpg/png/webp)
│   │   ├── productImageUpload.js  # Multer para imagens de produtos (5MB)
│   │   └── mercadopago.js         # Configuração do cliente Mercado Pago
│   ├── controllers/
│   │   ├── clientController.js        # Cadastro, login, perfil, avatar
│   │   ├── dashboardController.js     # Painel admin: produtos, pedidos, cupons, stats
│   │   ├── orderController.js         # Pedidos do cliente
│   │   ├── avaliacaoController.js     # Avaliações de produtos
│   │   ├── addressController.js       # Endereços de entrega
│   │   ├── cupomController.js         # Validação de cupom
│   │   └── paymentController.js       # Preferência MP + webhook
│   ├── middleware/
│   │   ├── requireClientAuth.js   # Valida token JWT (cliente ou admin)
│   │   └── requireAdminAuth.js    # Valida token e exige role=admin
│   ├── routes/
│   │   ├── clientRoutes.js        # /api/clients
│   │   ├── dashboardRoutes.js     # /api/dashboard
│   │   ├── orderRoutes.js         # /api/orders
│   │   ├── boloRoutes.js          # /api/bolos
│   │   ├── addressRoutes.js       # /api/addresses
│   │   ├── cupomRoutes.js         # /api/cupons
│   │   └── paymentRoutes.js       # /api/payments
│   └── server.js
├── Dashboard/
│   ├── dashboard.py               # Script Python — gera dashboard de vendas via API
│   ├── dashboard_velvetslice.png  # Última exportação (PNG)
│   └── dashboard_velvetslice.pdf  # Última exportação (PDF)
├── uploads/
│   ├── avatars/     # Fotos de perfil
│   └── products/    # Imagens dos produtos
└── package.json
```

---

## Banco de dados

Tabelas criadas automaticamente na inicialização:

| Tabela | Descrição |
|--------|-----------|
| `cliente` | Usuários — clientes e admins (`role`) |
| `bolo` | Catálogo de produtos |
| `pedido` | Pedidos realizados |
| `item_pedido` | Itens de cada pedido |
| `endereco` | Endereços de entrega |
| `endereco_entrega` | Vínculo cliente ↔ endereço |
| `avaliacao` | Avaliações de produtos (1 por cliente por produto) |
| `cupom` | Cupons de desconto |

Cupons pré-cadastrados:

| Código | Tipo | Valor |
|--------|------|-------|
| `VELVET10` | flat | R$ 10,00 |
| `DESCONTO20` | flat | R$ 20,00 |
| `PRIMEIRA` | flat | R$ 15,00 |

---

## Autenticação

O login retorna um JWT assinado com `CLIENT_TOKEN_SECRET`. Envie em toda requisição autenticada:

```
Authorization: Bearer <token>
```

- `role: "cliente"` — acesso às rotas de cliente
- `role: "admin"` — acesso a todas as rotas

---

## Rotas

### Públicas (sem token)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/clients/register` | Cadastrar cliente (retorna JWT) |
| `POST` | `/api/clients/login` | Login |
| `POST` | `/api/dashboard/register-admin` | Cadastrar admin (exige `ADMIN_REGISTER_CODE`) |
| `GET` | `/api/bolos` | Listar produtos ativos |
| `GET` | `/api/bolos/:id/avaliacoes` | Avaliações de um produto |
| `POST` | `/api/cupons/validate` | Validar cupom |
| `POST` | `/api/payments/create-preference` | Criar preferência de pagamento MP |
| `POST` | `/api/payments/webhook` | Webhook do Mercado Pago |

### Requerem token de cliente

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/orders` | Criar pedido |
| `GET` | `/api/orders/client/:id` | Pedidos do cliente (com itens, endereço, cupom) |
| `GET` | `/api/orders/:id/items` | Itens de um pedido |
| `PUT` | `/api/clients/:id` | Atualizar perfil |
| `PUT` | `/api/clients/:id/password` | Alterar senha |
| `POST` | `/api/clients/:id/avatar` | Atualizar foto de perfil |
| `DELETE` | `/api/clients/:id` | Excluir conta |
| `POST` | `/api/bolos/:id/avaliacoes` | Enviar avaliação |
| `PUT` | `/api/bolos/avaliacoes/:id` | Editar avaliação |
| `DELETE` | `/api/bolos/avaliacoes/:id` | Excluir avaliação |
| `GET` | `/api/addresses/client/:id` | Endereços do cliente |
| `POST` | `/api/addresses` | Adicionar endereço |
| `PUT` | `/api/addresses/:id` | Editar endereço |
| `DELETE` | `/api/addresses/:id` | Excluir endereço |

### Requerem token de admin

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard/stats` | Estatísticas gerais |
| `GET` | `/api/dashboard/mais-vendidos` | Produtos mais vendidos |
| `GET` | `/api/dashboard/pedidos` | Todos os pedidos |
| `GET` | `/api/dashboard/pedidos/:id` | Detalhes de um pedido |
| `PUT` | `/api/dashboard/pedidos/:id/status` | Atualizar status do pedido |
| `GET` | `/api/dashboard/bolos` | Listar todos os produtos |
| `POST` | `/api/dashboard/bolos` | Criar produto |
| `PUT` | `/api/dashboard/bolos/:id` | Atualizar produto |
| `POST` | `/api/dashboard/bolos/:id/image` | Upload de imagem do produto |
| `PATCH` | `/api/dashboard/bolos/:id/toggle` | Ativar/desativar produto |
| `DELETE` | `/api/dashboard/bolos/:id` | Excluir produto |
| `GET` | `/api/dashboard/cupons` | Listar cupons |
| `POST` | `/api/dashboard/cupons` | Criar cupom |
| `PATCH` | `/api/dashboard/cupons/:id/toggle` | Ativar/desativar cupom |

Status possíveis para pedidos: `Pendente`, `Pago`, `Em preparo`, `Em rota`, `Entregue`, `Cancelado`, `Recusado`

---

## Exemplos (PowerShell)

### Login e salvar token

```powershell
$login = Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/clients/login' `
  -ContentType 'application/json' `
  -Body '{"email":"seu@email.com","senha":"suaSenha"}'

$token = $login.access_token
```

### Cadastrar administrador

Via app: na tela de Login, toque **3 vezes** no título "Velvet Slice".

Via terminal:

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/dashboard/register-admin' `
  -ContentType 'application/json' `
  -Body '{"nome":"Admin","email":"admin@velvet.com","senha":"suasenha","telefone":"11999999999","codigo":"SEU_CODIGO"}'
```

### Criar pedido

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/orders' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"valor_total":89.90,"fk_Cliente_id_cliente":1,"fk_Endereco_id_endereco":1,"cupom_codigo":"VELVET10","desconto_valor":10,"itens":[{"id_bolo":1,"quantidade":1,"preco_unitario":89.90,"tamanho":"1Kg"}]}'
```

### Atualizar status do pedido (admin)

```powershell
Invoke-RestMethod -Method PUT -Uri 'http://127.0.0.1:3000/api/dashboard/pedidos/1/status' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"status_pedido":"Em preparo"}'
```

### Criar cupom (admin)

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/dashboard/cupons' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"codigo":"NOVO10","desconto_tipo":"percent","desconto_valor":10}'
```

---

## Webhook Mercado Pago

O endpoint `POST /api/payments/webhook` é chamado automaticamente pelo MP após cada pagamento.

- `approved` → `status_pedido = 'Pago'` + método de pagamento detectado (`PIX`, `Saldo MP`, `Cartão de crédito`, `Cartão de débito`)
- `rejected` / `cancelled` → `status_pedido = 'Recusado'`

> Em desenvolvimento local, use o [ngrok](https://ngrok.com/) para expor a porta 3000 e configure a URL no painel do MP (Configurações → Notificações).

---

## Troubleshooting

### Porta 3000 ocupada

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
npm run dev
```

### FrontEnd não conecta

- BackEnd deve rodar em `0.0.0.0:3000` (não apenas `127.0.0.1`)
- Configure `EXPO_PUBLIC_API_URL` no FrontEnd com o IP local correto
- Celular e PC devem estar na mesma rede Wi-Fi

### Token inválido / expirado

- Faça logout e login novamente no app
- Se `CLIENT_TOKEN_SECRET` mudou no `.env`, todos os tokens existentes ficam inválidos

### Banco de dados corrompido

```powershell
Remove-Item velvetslice_server.db
npm run dev
```

---

## Dashboard Python (Análise de Dados — Fase 4)

O script `Dashboard/dashboard.py` gera um painel visual de vendas e performance em PNG e PDF, consumindo exclusivamente dados da API REST via JSON.

### Como funciona

O script **não acessa o banco de dados diretamente**. Ele autentica na API com credenciais de admin e consome os seguintes endpoints:

| Endpoint | Dados obtidos |
|----------|---------------|
| `POST /api/clients/login` | Autenticação — obtém token JWT |
| `GET /api/dashboard/stats` | Total de pedidos, faturamento e produtos |
| `GET /api/dashboard/mais-vendidos` | Ranking de produtos por unidades vendidas |
| `GET /api/dashboard/pedidos` | Lista completa de pedidos com status e pagamento |
| `GET /api/bolos` | Catálogo de produtos com categoria (público) |

Os dados JSON são processados com `pandas` e transformados em gráficos com `matplotlib`:

- **4 KPIs:** Total de Pedidos, Faturamento Total, Ticket Médio, Produtos Ativos
- **Gráfico de pizza:** Status dos pedidos
- **Gráfico de barras horizontal:** Produtos mais vendidos (unidades)
- **Gráfico de pizza:** Métodos de pagamento
- **Gráfico de barras:** Receita por produto
- **Gráfico de barras:** Receita por categoria

### Pré-requisitos

```bash
pip install requests pandas matplotlib
```

### Como rodar

**1. Suba o BackEnd primeiro:**

```bash
npm run dev
```

**2. Em outro terminal, gere o dashboard:**

```bash
cd Dashboard
python dashboard.py         # Gera apenas PNG
python dashboard.py --pdf   # Gera PNG + PDF
```

Os arquivos são salvos em `Dashboard/dashboard_velvetslice.png` e `.pdf`.

### Configuração de credenciais

Por padrão o script usa `admin@velvet.com` / `admin123`. Para usar outras credenciais sem alterar o código:

```bash
# Windows PowerShell
$env:ADM_EMAIL="outro@email.com"; $env:ADM_SENHA="outrasenha"; python dashboard.py

# Linux/macOS
ADM_EMAIL="outro@email.com" ADM_SENHA="outrasenha" python dashboard.py
```

---

## Segurança

- Nunca commite o `.env`
- `ADMIN_REGISTER_CODE` deve ser conhecido apenas pela equipe
- `CLIENT_TOKEN_SECRET` deve ter no mínimo 32 caracteres aleatórios
