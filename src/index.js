const cors = require('cors'); // No topo do arquivo
const express = require('express');
const app = express();
const dotenv = require('dotenv');

dotenv.config();
app.use(express.json()); // Permite que o Node entenda JSON, como o @RequestBody do Java
app.use(cors()); // Logo abaixo do app.use(express.json())

const PORT = process.env.PORT || 3000;

// Rota de Teste
app.get('/', (req, res) => {
  res.json({ message: 'Servidor Velvet Slice (Node) a rodar!' });
});

// Simulação de Base de Dados (Para testar a conexão do App)
// Na próxima etapa, trocaremos isto por uma consulta real ao SQLite
const usuariosMock = [
  { id: '1', nome: 'Utilizador Teste', email: 'teste@velvet.com', senha: '123' }
];

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body; // Equivale ao LoginUserDto do Java

  console.log(`>>> Recebida tentativa de login para: ${email} com a senha: ${senha}`);

  // Lógica traduzida do LoginService.java
  const user = usuariosMock.find(u => u.email === email && u.senha === senha);

  if (user) {
    // Se encontrar, retorna o objeto (sem a senha por segurança)
    const { senha, ...userResponse } = user;
    return res.status(200).json(userResponse);
  } else {
    // Se não encontrar, erro 401 (Não Autorizado)
    return res.status(401).json({ error: 'Falha na autenticação. Verifica as tuas credenciais.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor na porta ${PORT}`);
});