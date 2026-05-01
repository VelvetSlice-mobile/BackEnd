const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/create-preference", paymentController.createPayment);
router.post("/webhook", paymentController.receiveWebhook);

module.exports = router;