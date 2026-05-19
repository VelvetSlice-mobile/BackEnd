# Velvet Slice — BackEnd

API REST do projeto Velvet Slice, responsável por autenticação, produtos, pedidos, cupons, avaliações e pagamentos.

**Stack:** Node.js + Express 5 + SQLite3 + Mercado Pago

---

## Requisitos

- Node.js 20 LTS (recomendado)
- npm 10+

> Node 24 pode funcionar, mas para padrão de equipe recomenda-se Node 20 LTS.

---

## Instalação do zero (a partir do git)

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd Velvet/BackEnd

# 2. Instale as dependências
npm install

# 3. Crie o arquivo de variáveis de ambiente
# (veja a seção "Variáveis de ambiente" abaixo)

# 4. Suba o servidor
npm run dev
```

O banco de dados SQLite (`velvetslice_server.db`) é criado automaticamente na primeira execução. Não é necessário rodar nenhuma migration.

---

## Variáveis de ambiente (.env)

Crie o arquivo `.env` na raiz do BackEnd:

```env
PORT=3000
CLIENT_TOKEN_SECRET=sua_chave_secreta_aqui
ADMIN_REGISTER_CODE=seu_codigo_admin_aqui
MP_ACCESS_TOKEN=seu_token_mercado_pago_aqui
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PORT` | Não | Porta da API. Padrão: `3000` |
| `CLIENT_TOKEN_SECRET` | Sim | Chave usada para assinar e verificar os JWTs de autenticação. Use uma string longa e aleatória |
| `ADMIN_REGISTER_CODE` | Sim | Código secreto exigido para cadastrar um administrador. Nunca exponha esse valor |
| `MP_ACCESS_TOKEN` | Sim (para pagamentos) | Token de acesso do Mercado Pago para criar preferências de pagamento |

> **Nunca commite o `.env`.** O `.gitignore` já está configurado para ignorá-lo.

---

## Como rodar

### Desenvolvimento (recomendado)

```bash
npm run dev
```

Usa `nodemon` — reinicia o servidor automaticamente ao salvar qualquer arquivo.

### Produção

```bash
npm start
```

### Verificar se está no ar

```bash
curl http://127.0.0.1:3000/
```

Resposta esperada:

```
Servidor Velvet Slice Online! 🎂
```

---

## Estrutura do projeto

```
BackEnd/
├── src/
│   ├── config/
│   │   ├── db.js               # Conexão SQLite + criação das tabelas
│   │   ├── auth.js             # Geração e verificação de JWT (HMAC-SHA256)
│   │   ├── avatarUpload.js     # Configuração multer para upload de avatares
│   │   ├── productImageUpload.js # Configuração multer para imagens de produtos
│   │   └── syncData.js         # Seed inicial de produtos no banco
│   ├── controllers/
│   │   ├── clientController.js     # Cadastro, login, perfil, avatar
│   │   ├── dashboardController.js  # Painel admin: produtos, pedidos, cupons
│   │   ├── orderController.js      # Pedidos do cliente
│   │   ├── avaliacaoController.js  # Avaliações de produtos
│   │   ├── addressController.js    # Endereços
│   │   ├── cupomController.js      # Validação de cupom
│   │   └── paymentController.js    # Mercado Pago
│   ├── middleware/
│   │   ├── requireClientAuth.js    # Verifica token de cliente/admin
│   │   └── requireAdminAuth.js     # Verifica token e exige role=admin
│   └── routes/
│       ├── clientRoutes.js         # /api/clients
│       ├── dashboardRoutes.js      # /api/dashboard
│       ├── orderRoutes.js          # /api/orders
│       ├── boloRoutes.js           # /api/bolos
│       ├── addressRoutes.js        # /api/addresses
│       ├── cupomRoutes.js          # /api/cupons
│       └── paymentRoutes.js        # /api/payments
├── uploads/
│   ├── avatars/    # Fotos de perfil dos clientes
│   └── products/   # Imagens dos produtos (bolos)
├── server.js
└── package.json
```

---

## Banco de dados

O SQLite cria as tabelas automaticamente ao subir o servidor pela primeira vez. As tabelas são:

| Tabela | Descrição |
|--------|-----------|
| `cliente` | Usuários (clientes e admins) |
| `bolo` | Catálogo de produtos |
| `pedido` | Pedidos realizados |
| `item_pedido` | Itens de cada pedido |
| `endereco` | Endereços de entrega |
| `endereco_entrega` | Vínculo cliente ↔ endereço |
| `avaliacao` | Avaliações de produtos |
| `cupom` | Cupons de desconto |

### Limpar dados de teste mantendo o catálogo

```bash
npm run db:clean
```

Remove: clientes, endereços, pedidos, itens de pedido.
Mantém: bolos, cupons.

---

## Autenticação

O login retorna um JWT assinado com `CLIENT_TOKEN_SECRET`. Ele deve ser enviado no header:

```
Authorization: Bearer <token>
```

O campo `role` dentro do token define as permissões:
- `"cliente"` — acesso às rotas de cliente
- `"admin"` — acesso às rotas de admin e de cliente

### Rotas públicas (sem token)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/clients/register` | Cadastrar cliente (retorna JWT igual ao login) |
| `POST` | `/api/clients/login` | Login |
| `POST` | `/api/dashboard/register-admin` | Cadastrar admin (exige código secreto) |
| `GET` | `/api/bolos` | Listar produtos ativos |
| `GET` | `/api/bolos/:id/avaliacoes` | Avaliações de um produto |
| `POST` | `/api/cupons/validate` | Validar cupom |
| `GET` | `/api/addresses/client/:id` | Endereços de um cliente |
| `POST` | `/api/payments/create-preference` | Criar preferência de pagamento |

### Rotas que exigem token de cliente

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/orders` | Criar pedido (retorna `id_pedido`) |
| `GET` | `/api/orders/client/:id` | Pedidos do cliente (inclui itens, endereço, cupom e desconto) |
| `GET` | `/api/orders/:id/items` | Itens de um pedido específico |
| `PUT` | `/api/clients/:id` | Atualizar perfil |
| `PUT` | `/api/clients/:id/password` | Alterar senha |
| `DELETE` | `/api/clients/:id` | Excluir conta |
| `POST` | `/api/clients/:id/avatar` | Atualizar foto de perfil |
| `POST` | `/api/bolos/:id/avaliacoes` | Enviar avaliação |
| `PUT` | `/api/bolos/avaliacoes/:id` | Editar avaliação |
| `DELETE` | `/api/bolos/avaliacoes/:id` | Excluir avaliação |

### Rotas que exigem token de admin

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/clients` | Listar todos os clientes |
| `GET` | `/api/dashboard/stats` | Estatísticas da loja |
| `GET` | `/api/dashboard/mais-vendidos` | Produtos mais vendidos |
| `GET` | `/api/dashboard/pedidos` | Todos os pedidos |
| `GET` | `/api/dashboard/pedidos/:id` | Detalhes de um pedido |
| `PUT` | `/api/dashboard/pedidos/:id/status` | Atualizar status do pedido |
| `GET` | `/api/dashboard/bolos` | Listar todos os produtos (admin) |
| `POST` | `/api/dashboard/bolos` | Criar produto |
| `PUT` | `/api/dashboard/bolos/:id` | Atualizar produto |
| `POST` | `/api/dashboard/bolos/:id/image` | Upload de imagem |
| `PATCH` | `/api/dashboard/bolos/:id/toggle` | Ativar/desativar produto |
| `DELETE` | `/api/dashboard/bolos/:id` | Excluir produto |
| `GET` | `/api/dashboard/cupons` | Listar cupons |
| `POST` | `/api/dashboard/cupons` | Criar cupom |
| `PATCH` | `/api/dashboard/cupons/:id/toggle` | Ativar/desativar cupom |

Resposta sem token:
```json
{ "error": "Token de autenticacao ausente." }
```

Resposta com token de cliente em rota de admin:
```json
{ "error": "Acesso restrito a administradores." }
```

---

## Exemplos de uso

> Os exemplos abaixo usam **PowerShell** (Windows). Se estiver no Git Bash, Linux ou Mac, substitua `Invoke-RestMethod` pelo `curl` equivalente.

### Passo 0 — Salvar o token após o login

Todos os exemplos com token dependem desta variável `$token`. Execute o login uma vez e reutilize:

```powershell
$login = Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/clients/login' `
  -ContentType 'application/json' `
  -Body '{"email":"seu@email.com","senha":"suaSenha"}'

$token = $login.access_token
```

> O token é válido por **7 dias**. Se aparecer erro de token inválido, repita o login para gerar um novo.

---

### Cadastrar cliente

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/clients/register' `
  -ContentType 'application/json' `
  -Body '{"nome":"Maria Silva","email":"maria@email.com","senha":"123456","telefone":"11999999999"}'
```

### Login

```powershell
$login = Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/clients/login' `
  -ContentType 'application/json' `
  -Body '{"email":"maria@email.com","senha":"123456"}'

$token = $login.access_token
$login
```

Resposta:

```
id_cliente           : 1
id                   : 1
nome                 : Maria Silva
email                : maria@email.com
telefone             : 11999999999
avatar_url           :
role                 : cliente
ultima_alteracao_senha :
access_token         : eyJ...
token_type           : Bearer
```

> Para admin, `role` retorna `"admin"`. O app usa esse campo para redirecionar ao painel correto.

---

### Cadastrar administrador

O cadastro de admin não é uma tela pública. A forma recomendada é pelo app:

1. Acesse a tela de **Login**
2. Toque **3 vezes rapidamente** no título "Velvet Slice" — um modal abrirá
3. Preencha nome, telefone, e-mail, senha e o **código de acesso** (`ADMIN_REGISTER_CODE`)
4. Faça login — o app detecta `role: "admin"` e redireciona ao painel

Via PowerShell (substitua `SEU_CODIGO_ADMIN` pelo valor definido no `.env`):

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/dashboard/register-admin' `
  -ContentType 'application/json' `
  -Body '{"nome":"Admin","email":"admin@velvet.com","senha":"suasenha","telefone":"11999999999","codigo":"SEU_CODIGO_ADMIN"}'
```

Resposta de sucesso: `{ id_cliente: 2, nome: "Admin" }`

Código inválido: `{ error: "Codigo de acesso invalido." }`

---

### Alterar senha (requer token)

A senha deve ter entre **6 e 100 caracteres**.

```powershell
Invoke-RestMethod -Method PUT -Uri 'http://127.0.0.1:3000/api/clients/1/password' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"senhaAtual":"senhaAtual123","novaSenha":"novaSenha456"}'
```

Erros possíveis:

| Situação | Resposta |
|----------|----------|
| Senha atual incorreta | `"Senha atual incorreta. Sua senha foi alterada há X dia(s)."` |
| Nova senha muito curta (< 6) | `"A nova senha deve ter no mínimo 6 caracteres."` |
| Igual à senha atual | `"A nova senha não pode ser igual à senha atual."` |

> **Esqueci minha senha:** não há recuperação por e-mail. Verifique o banco de dados com o SQLite Viewer. Em produção, implemente recuperação por e-mail antes do lançamento.

---

### Listar produtos (público)

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/bolos'
```

Retorna apenas produtos com `ativo = 1`.

### Validar cupom

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/cupons/validate' `
  -ContentType 'application/json' `
  -Body '{"codigo":"VELVET10"}'
```

Resposta (cupom válido):
```json
{
  "id_cupom": 1,
  "codigo": "VELVET10",
  "desconto_tipo": "flat",
  "desconto_valor": 10,
  "ativo": 1
}
```

Tipos de desconto:
- `"flat"` — valor fixo em reais (ex: `10` = R$ 10,00 de desconto)
- `"percent"` — percentual (ex: `10` = 10% de desconto)

Cupons pré-cadastrados no banco (seed):
| Código | Tipo | Valor |
|--------|------|-------|
| `VELVET10` | flat | R$ 10,00 |
| `DESCONTO20` | flat | R$ 20,00 |
| `PRIMEIRA` | flat | R$ 15,00 |

### Criar pedido (requer token)

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/orders' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"valor_total":89.90,"fk_Cliente_id_cliente":1,"fk_Endereco_id_endereco":1,"cupom_codigo":"VELVET10","desconto_valor":10,"itens":[{"id_bolo":1,"quantidade":1,"preco_unitario":89.90,"tamanho":"1Kg"}]}'
```

### Atualizar status do pedido (admin)

Status possíveis: `Pendente`, `Pago`, `Em preparo`, `Saiu para entrega`, `Entregue`, `Cancelado`, `Recusado`

```powershell
Invoke-RestMethod -Method PUT -Uri 'http://127.0.0.1:3000/api/dashboard/pedidos/1/status' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"status_pedido":"Em preparo"}'
```

### Upload de foto de perfil (requer token)

O upload de avatar é feito pelo app (câmera ou galeria). Para testar via terminal:

```powershell
$form = [System.Net.Http.MultipartFormDataContent]::new()
$file = [System.IO.File]::OpenRead('C:\caminho\para\foto.jpg')
$content = [System.Net.Http.StreamContent]::new($file)
$content.Headers.ContentType = 'image/jpeg'
$form.Add($content, 'file', 'foto.jpg')

$client = [System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token)
$client.PostAsync('http://127.0.0.1:3000/api/clients/1/avatar', $form).Result
```

Regras:
- Campo: `file`
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: 3MB
- Arquivos salvos em `uploads/avatars/`

### Criar cupom (admin)

```powershell
Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3000/api/dashboard/cupons' `
  -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"codigo":"NOVO10","desconto_tipo":"percent","desconto_valor":10}'
```

---

## Troubleshooting

### Porta 3000 ocupada

```bash
# Windows — encontrar o processo na porta 3000
netstat -ano | findstr :3000
# Finalizar pelo PID encontrado
taskkill /PID <PID> /F
```

### FrontEnd não conecta na API

- Confirme que o BackEnd está rodando em `0.0.0.0:3000` (não apenas `127.0.0.1`)
- No FrontEnd, ajuste `EXPO_PUBLIC_API_URL` para o IP local correto (ex: `http://192.168.1.10:3000`)
- Verifique se o celular e o PC estão na mesma rede Wi-Fi
- Teste no navegador do PC: `http://SEU_IP_LOCAL:3000/`

### Webhook do Mercado Pago

O endpoint `POST /api/payments/webhook` é chamado pelo Mercado Pago após cada evento de pagamento. Configure a URL pública do servidor no painel do MP (Configurações → Notificações IPN/Webhook).

Comportamento:
- `approved` → atualiza `status_pedido = 'Pago'` e grava o método de pagamento detectado (`Saldo MP`, `PIX`, `Cartão de crédito`, `Cartão de débito`)
- `rejected` ou `cancelled` → atualiza `status_pedido = 'Recusado'`

> Em desenvolvimento sem URL pública, o webhook não chega ao servidor. Use o [ngrok](https://ngrok.com/) para expor a porta 3000 e configure a URL gerada no painel do MP.

---

### Erro de token Mercado Pago

- Verifique se `MP_ACCESS_TOKEN` está correto no `.env`
- Tokens de teste começam com `TEST-`; tokens de produção com `APP_USR-`

### Banco de dados corrompido ou travado

```powershell
# Apague o banco e suba novamente — será recriado do zero
Remove-Item velvetslice_server.db
npm run dev
```

### Token JWT inválido ou expirado

- Faça logout e login novamente no app para gerar um novo token
- Verifique se `CLIENT_TOKEN_SECRET` não mudou entre sessões (se mudar, todos os tokens existentes ficam inválidos)

---

## Segurança

- Nunca commite o `.env` — o `.gitignore` já está configurado
- `ADMIN_REGISTER_CODE` deve ser uma string forte e conhecida apenas pela equipe
- `CLIENT_TOKEN_SECRET` deve ser uma string longa e aleatória (mínimo 32 caracteres)
- Se um `.env` já foi versionado por engano:

```bash
git rm --cached .env
git commit -m "remover .env do versionamento"
```
