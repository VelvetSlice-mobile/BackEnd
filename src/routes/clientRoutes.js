const express = require("express");
const multer = require("multer");
const router = express.Router();
const clientController = require("../controllers/clientController");
const requireClientAuth = require("../middleware/requireClientAuth");
const { uploadAvatar } = require("../config/avatarUpload");

function handleAvatarUpload(req, res, next) {
  uploadAvatar.single("file")(req, res, (err) => {
	if (!err) {
	  return next();
	}

	if (err instanceof multer.MulterError) {
	  if (err.code === "LIMIT_FILE_SIZE") {
		return res.status(400).json({ error: "Arquivo muito grande. O limite é 3MB." });
	  }

	  return res.status(400).json({ error: "Falha no upload do avatar." });
	}

	return res.status(400).json({ error: err.message || "Falha no upload do avatar." });
  });
}

router.post("/register", clientController.registerClient);
router.post("/login", clientController.loginClient);
router.get("/", clientController.getAllClients);
router.get("/:id", clientController.getClientById);
router.post("/:id/avatar", requireClientAuth, handleAvatarUpload, clientController.updateAvatar);
router.put("/:id", clientController.updateClient);
router.delete("/:id", clientController.deleteClient);

module.exports = router;
