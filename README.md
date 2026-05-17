# Velvet Slice BackEnd

API REST do projeto Velvet Slice (Node.js + Express + SQLite).

## Requisitos

- Node.js 20 LTS (recomendado)
- npm 10+

Observacao:
Node 24 pode funcionar, mas para padrao de equipe recomenda-se Node 20 LTS.

## Instalacao

1. Na pasta do BackEnd, instale as dependencias:

```bash
npm install
```

## Variaveis de ambiente (.env)

Crie o arquivo `.env` na raiz do BackEnd com:

```env
PORT=3000
MP_ACCESS_TOKEN=SEU_TOKEN_MERCADO_PAGO
CLIENT_TOKEN_SECRET=UMA_CHAVE_SECRETA_FORTE
```

Notas:
- `PORT` define a porta da API.
- `MP_ACCESS_TOKEN` e obrigatorio para criar preferencias de pagamento.
- `CLIENT_TOKEN_SECRET` assina o token de autenticação retornado no login/registro.

## Como rodar

Ambiente de desenvolvimento:

```bash
npm run dev
```

Use esse comando no dia a dia de desenvolvimento, porque ele executa o servidor com `nodemon` e reinicia automaticamente quando algum arquivo do BackEnd for alterado.

Ambiente normal:

```bash
npm start
```

Use `npm start` quando quiser apenas subir o servidor sem recarregamento automatico.

Teste rapido da API:

```bash
curl http://127.0.0.1:3000/
```

Resposta esperada:

```text
Servidor Velvet Slice Online! 🎂
```

## Banco de dados e limpeza

Script para limpar dados transacionais e manter catalogo:

```bash
npm run db:clean
```

Esse script limpa:
- `cliente`
- `endereco`
- `endereco_entrega`
- `pedido`
- `item_pedido`

E mantem:
- `bolo`

## Troubleshooting

### Porta 3000 ocupada

- Finalize o processo que esta usando a porta e rode `npm run dev` novamente durante o desenvolvimento.

### Erro de token Mercado Pago

- Verifique se `MP_ACCESS_TOKEN` foi configurado corretamente no `.env`.

### FrontEnd nao conecta na API

- Confirme se o BackEnd esta rodando em `0.0.0.0:3000`.
- No FrontEnd, ajuste `EXPO_PUBLIC_API_URL` para o IP local correto da maquina do BackEnd.

## Upload de avatar de cliente

### Endpoints envolvidos

- `POST /api/clients/login`
- `POST /api/clients/register`
- `GET /api/clients/:id`
- `POST /api/clients/:id/avatar`

### Regras do upload

- Campo do arquivo: `file`
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: `3MB`
- Arquivos ficam em `uploads/avatars`
- As imagens são servidas publicamente em `/uploads/...`

### Autenticação

O login e o cadastro retornam `access_token` no formato `Bearer` assinado com `CLIENT_TOKEN_SECRET`.

Exemplo de uso do token no upload:

```bash
Authorization: Bearer SEU_TOKEN
```

### Exemplo de login

```bash
curl -X POST http://127.0.0.1:3000/api/clients/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"cliente@exemplo.com\",\"senha\":\"123456\"}"
```

Resposta esperada inclui `avatar_url` e `access_token`:

```json
{
  "id_cliente": 1,
  "nome": "Cliente Exemplo",
  "email": "cliente@exemplo.com",
  "telefone": "11999999999",
  "avatar_url": null,
  "access_token": "...",
  "token_type": "Bearer"
}
```

### Upload de avatar com sucesso

```bash
curl -X POST http://127.0.0.1:3000/api/clients/1/avatar \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@C:/imagens/avatar.jpg"
```

Resposta esperada:

```json
{
  "user": {
	"id": 1,
	"nome": "Cliente Exemplo",
	"email": "cliente@exemplo.com",
	"telefone": "11999999999",
	"avatar_url": "http://127.0.0.1:3000/uploads/avatars/avatar-...jpg"
  }
}
```

### Exemplo de arquivo invalido

```bash
curl -X POST http://127.0.0.1:3000/api/clients/1/avatar \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@C:/imagens/arquivo.pdf"
```

Resposta esperada:

```json
{ "error": "Formato inválido. Use JPG, PNG ou WEBP." }
```

### Exemplo de acesso não autorizado

```bash
curl -X POST http://127.0.0.1:3000/api/clients/2/avatar \
  -H "Authorization: Bearer TOKEN_DO_CLIENTE_1" \
  -F "file=@C:/imagens/avatar.jpg"
```

Resposta esperada:

```json
{ "error": "Você não pode alterar a foto de outro usuário." }
```

### Observação sobre migração

Na primeira inicialização após esta mudança, o backend adiciona automaticamente a coluna `avatar_url` na tabela `cliente` sem apagar dados existentes.

## Integracao de branches (sem quebrar fluxo)

Ordem recomendada para integrar novas frentes (ex.: login/notificacoes):

1. Atualize a branch de trabalho:

```bash
git checkout <sua-branch>
git pull
```

2. Faça merge da branch de login e resolva conflitos.
3. Rode BackEnd + FrontEnd e valide cadastro/login/pedido.
4. Faça merge da branch de notificacoes e repita validacao.

Pontos comuns de conflito no BackEnd:
- `src/controllers/clientController.js`
- `src/controllers/orderController.js`
- `src/routes/clientRoutes.js`
- `src/routes/orderRoutes.js`
- `src/config/db.js`

## Seguranca

- O `.gitignore` do BackEnd ja ignora `.env` e variacoes.
- Nunca commite tokens reais.
- Se um `.env` ja foi versionado no passado:

```bash
git rm --cached .env
git commit -m "chore: stop tracking .env"
```

