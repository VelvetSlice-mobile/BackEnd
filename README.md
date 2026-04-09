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
```

Notas:
- `PORT` define a porta da API.
- `MP_ACCESS_TOKEN` e obrigatorio para criar preferencias de pagamento.

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

