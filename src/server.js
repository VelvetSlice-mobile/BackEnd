const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const path = require("node:path");


const boloRoutes = require("./routes/boloRoutes");
const clientRoutes = require("./routes/clientRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const cupomRoutes = require("./routes/cupomRoutes");

dotenv.config();
const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/bolos", boloRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cupons", cupomRoutes);

app.get("/", (req, res) => {
  res.send("Servidor Velvet Slice Online!");
});

process.on('uncaughtException', () => process.exit(1));
process.on('unhandledRejection', () => process.exit(1));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
