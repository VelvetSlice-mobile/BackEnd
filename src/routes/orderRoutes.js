const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const requireClientAuth = require("../middleware/requireClientAuth");

router.post("/", requireClientAuth, orderController.createOrder);
router.get("/client/:id_cliente", orderController.getOrdersByClient);
router.get("/:id/items", orderController.getOrderItems);
router.put("/:id", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);

module.exports = router;