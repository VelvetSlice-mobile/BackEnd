const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { signClientToken } = require("../config/auth");

const PUBLIC_UPLOAD_PREFIX = "/uploads/avatars";

function buildPublicAvatarUrl(req, avatarPath) {
  if (!avatarPath) {
    return null;
  }

  if (/^https?:\/\//i.test(avatarPath)) {
    return avatarPath;
  }

  const normalizedPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  return `${req.protocol}://${req.get("host")}${normalizedPath}`;
}

function buildClientPayload(req, row) {
  return {
    id_cliente: row.id_cliente,
    id: row.id_cliente,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    avatar_url: buildPublicAvatarUrl(req, row.avatar_url),
  };
}

function buildLegacyClientPayload(req, row, includeToken = false) {
  const payload = buildClientPayload(req, row);
  const legacy = {
    id_cliente: payload.id_cliente,
    nome: payload.nome,
    email: payload.email,
    telefone: payload.telefone,
    avatar_url: payload.avatar_url,
  };

  if (includeToken) {
    legacy.access_token = signClientToken({ sub: String(row.id_cliente) });
    legacy.token_type = "Bearer";
  }

  return legacy;
}

function getAvatarDiskPath(storedAvatarUrl) {
  if (!storedAvatarUrl) {
    return null;
  }

  let pathname = storedAvatarUrl;

  if (/^https?:\/\//i.test(storedAvatarUrl)) {
    try {
      pathname = new URL(storedAvatarUrl).pathname;
    } catch (error) {
      return null;
    }
  }

  if (!pathname.startsWith(PUBLIC_UPLOAD_PREFIX)) {
    return null;
  }

  return path.resolve(__dirname, `../../${pathname.replace(/^\//, "")}`);
}

function removeFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  fs.unlink(filePath, (error) => {
    if (error && error.code !== "ENOENT") {
      console.warn("Falha ao remover avatar antigo:", error.message);
    }
  });
}

exports.registerClient = (req, res) => {
  const { nome, email, senha, telefone } = req.body;
  const sql = `INSERT INTO cliente (nome, email, senha, telefone) VALUES (?, ?, ?, ?)`;

  db.run(sql, [nome, email, senha, telefone], function (err) {
    if (err) {
      return res.status(400).json({ error: "Email já cadastrado ou erro no banco." });
    }

    const row = {
      id_cliente: this.lastID,
      nome,
      email,
      telefone,
      avatar_url: null,
    };

    res.status(201).json({
      ...buildLegacyClientPayload(req, row, true),
    });
  });
};

exports.loginClient = (req, res) => {
  const { email, senha } = req.body;
  const sql = `SELECT id_cliente, nome, email, telefone, avatar_url FROM cliente WHERE email = ? AND senha = ?`;

  db.get(sql, [email, senha], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Credenciais inválidas." });

    res.json({
      ...buildLegacyClientPayload(req, row, true),
    });
  });
};

exports.getAllClients = (req, res) => {
  db.all(
    "SELECT id_cliente, nome, email, telefone, avatar_url FROM cliente",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map((row) => buildLegacyClientPayload(req, row, false)));
    },
  );
};

exports.getClientById = (req, res) => {
  db.get(
    "SELECT id_cliente, nome, email, telefone, avatar_url FROM cliente WHERE id_cliente = ?",
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Cliente não encontrado." });

      res.json(buildLegacyClientPayload(req, row, false));
    },
  );
};

exports.updateClient = (req, res) => {
  const { nome, email, telefone } = req.body;

  const sql = `UPDATE cliente SET nome = ?, email = ?, telefone = ? WHERE id_cliente = ?`;

  db.run(sql, [nome, email, telefone, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.updateAvatar = (req, res) => {
  const clientId = String(req.params.id);
  const authenticatedClientId = String(req.clientAuth?.id || "");

  if (!authenticatedClientId) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  if (authenticatedClientId !== clientId) {
    return res.status(403).json({ error: "Você não pode alterar a foto de outro usuário." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Envie um arquivo no campo 'file'." });
  }

  db.get(
    "SELECT id_cliente, nome, email, telefone, avatar_url FROM cliente WHERE id_cliente = ?",
    [clientId],
    (err, currentClient) => {
      if (err) {
        removeFileIfExists(req.file.path);
        return res.status(500).json({ error: err.message });
      }

      if (!currentClient) {
        removeFileIfExists(req.file.path);
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      const storedAvatarPath = `${PUBLIC_UPLOAD_PREFIX}/${req.file.filename}`;
      const oldAvatarDiskPath = getAvatarDiskPath(currentClient.avatar_url);

      db.run(
        "UPDATE cliente SET avatar_url = ? WHERE id_cliente = ?",
        [storedAvatarPath, clientId],
        function (updateErr) {
          if (updateErr) {
            removeFileIfExists(req.file.path);
            return res.status(500).json({ error: updateErr.message });
          }

          const updatedClient = {
            ...currentClient,
            avatar_url: storedAvatarPath,
          };

          if (oldAvatarDiskPath && oldAvatarDiskPath !== req.file.path) {
            removeFileIfExists(oldAvatarDiskPath);
          }

          return res.json({
            user: {
              id: updatedClient.id_cliente,
              nome: updatedClient.nome,
              email: updatedClient.email,
              telefone: updatedClient.telefone,
              avatar_url: buildPublicAvatarUrl(req, updatedClient.avatar_url),
            },
          });
        },
      );
    },
  );
};

exports.deleteClient = (req, res) => {
  const id = req.params.id;

  db.get(
    "SELECT avatar_url FROM cliente WHERE id_cliente = ?",
    [id],
    (lookupErr, clientRow) => {
      if (lookupErr) {
        return res.status(500).json({ error: lookupErr.message });
      }

      db.run("DELETE FROM cliente WHERE id_cliente = ?", id, function (err) {
        if (err) {
          return res.status(500).json({
            error:
              "Não foi possível deletar a conta. Verifique se existem pedidos vinculados a este usuário.",
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: "Cliente não encontrado." });
        }

        removeFileIfExists(getAvatarDiskPath(clientRow?.avatar_url));

        res.json({ message: "Conta removida com sucesso!", deleted: this.changes });
      });
    },
  );
};
