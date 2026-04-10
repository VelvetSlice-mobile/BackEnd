const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");


const boloRoutes = require("./routes/boloRoutes");
const clientRoutes = require("./routes/clientRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const clientController = require("./controllers/clientController");
const boloController = require("./controllers/boloController");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/bolos", boloRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Aliases usados pelo FrontEnd
app.post("/api/register", clientController.registerClient);
app.post("/api/login", clientController.loginClient);
app.get("/api/products", boloController.getAllBolos);
app.post("/api/products", boloController.createBolo);
app.delete("/api/products/:id", boloController.deleteBolo);


app.get("/", (req, res) => {
  res.send("Servidor Velvet Slice Online! 🎂");
});


process.on('uncaughtException', (err) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
});