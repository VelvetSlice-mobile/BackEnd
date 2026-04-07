const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Importação das Rotas
const boloRoutes = require("./routes/boloRoutes");
const clientRoutes = require("./routes/clientRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Registro das Rotas na API
app.use("/api/bolos", boloRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Rota de teste para ver se o servidor está online
app.get("/", (req, res) => {
  res.send("Servidor Velvet Slice Online! 🎂");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Velvet Slice rodando na porta ${PORT}`);
});