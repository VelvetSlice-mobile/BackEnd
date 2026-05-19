const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const requireClientAuth = require("../middleware/requireClientAuth");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const { handleAvatarUpload } = require("../config/avatarUpload");


router.post("/register", clientController.registerClient);
router.post("/login", clientController.loginClient);
router.post("/reset-password", clientController.resetPassword);
router.get("/", requireAdminAuth, clientController.getAllClients);
router.get("/:id", clientController.getClientById);
router.post("/:id/avatar", requireClientAuth, handleAvatarUpload, clientController.updateAvatar);
router.put("/:id/password", requireClientAuth, clientController.updatePassword);
router.put("/:id", requireClientAuth, clientController.updateClient);
router.delete("/:id", requireClientAuth, clientController.deleteClient);

module.exports = router;