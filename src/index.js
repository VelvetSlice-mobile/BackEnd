const cors = require('cors');
const express = require('express');
const app = express();
const dotenv = require('dotenv');

dotenv.config();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.json({ message: 'Servidor Velvet Slice (Node) a rodar!' });
});


const usuariosMock = [
  { id: '1', nome: 'Utilizador Teste', email: 'teste@velvet.com', senha: '123' }
];

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body; 

  console.log(`>>> Recebida tentativa de login para: ${email} com a senha: ${senha}`);

  
  const user = usuariosMock.find(u => u.email === email && u.senha === senha);

  if (user) {
    
    const { senha, ...userResponse } = user;
    return res.status(200).json(userResponse);
  } else {
    return res.status(401).json({ error: 'Falha na autenticação. Verifica as tuas credenciais.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor na porta ${PORT}`);
});