const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const path = require("node:path");


const boloRoutes = require("./routes/boloRoutes");
const clientRoutes = require("./routes/clientRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
<<<<<<< Updated upstream
=======
const dashboardRoutes = require("./routes/dashboardRoutes");
const cupomRoutes = require("./routes/cupomRoutes");
>>>>>>> Stashed changes

dotenv.config();
const app = express();

app.disable("x-powered-by");
app.use(express.json());
<<<<<<< Updated upstream
app.use(cors());

=======
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
>>>>>>> Stashed changes

app.use("/api/bolos", boloRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
<<<<<<< Updated upstream

=======
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cupons", cupomRoutes);
>>>>>>> Stashed changes

app.get("/", (req, res) => {
  res.send("Servidor Velvet Slice Online!");
});

<<<<<<< Updated upstream

process.on('uncaughtException', (err) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});
=======
process.on('uncaughtException', () => process.exit(1));
process.on('unhandledRejection', () => process.exit(1));
>>>>>>> Stashed changes

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
<<<<<<< Updated upstream
});
=======
  console.log(`Servidor rodando na porta ${PORT}`);
});
>>>>>>> Stashed changes
