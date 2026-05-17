<<<<<<< Updated upstream
=======
const fs = require("fs");
const path = require("node:path");
>>>>>>> Stashed changes
const db = require("../config/db");

<<<<<<< Updated upstream
=======
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

function buildLegacyClientPayload(req, row, includeToken = false) {
  const payload = {
    id_cliente: row.id_cliente,
    id: row.id_cliente,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    avatar_url: buildPublicAvatarUrl(req, row.avatar_url),
    role: row.role || 'cliente',
  };

  if (includeToken) {
    payload.access_token = signClientToken({ sub: String(row.id_cliente) });
    payload.token_type = "Bearer";
  }

  return payload;
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
>>>>>>> Stashed changes

exports.registerClient = (req, res) => {
  const { nome, email, senha, telefone } = req.body;
  const sql = `INSERT INTO cliente (nome, email, senha, telefone) VALUES (?, ?, ?, ?)`;

  db.run(sql, [nome, email, senha, telefone], function (err) {
    if (err) {

      return res.status(400).json({ error: "Email já cadastrado ou erro no banco." });
    }

    res.status(201).json({ id_cliente: this.lastID, nome });
  });
};

<<<<<<< Updated upstream

exports.getAllClients = (req, res) => {

  db.all("SELECT id_cliente, nome, email, telefone FROM cliente", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

=======
exports.loginClient = (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT id_cliente, nome, email, telefone, avatar_url, role, senha as senha_stored FROM cliente WHERE email = ?`,
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!row) {
        return res.status(401).json({ error: "Não encontramos uma conta com esse e-mail. Verifique ou cadastre-se." });
      }

      if (row.senha_stored !== senha) {
        return res.status(401).json({ error: "Senha incorreta. Tente novamente." });
      }

      const { senha_stored, ...clientRow } = row;
      res.json({ ...buildLegacyClientPayload(req, clientRow, true) });
    }
  );
};

exports.getAllClients = (req, res) => {
  db.all(
    "SELECT id_cliente, nome, email, telefone, avatar_url, role FROM cliente",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map((row) => buildLegacyClientPayload(req, row, false)));
    },
  );
};

exports.getClientById = (req, res) => {
  db.get(
    "SELECT id_cliente, nome, email, telefone, avatar_url, role FROM cliente WHERE id_cliente = ?",
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Cliente não encontrado." });

      res.json(buildLegacyClientPayload(req, row, false));
    },
  );
};
>>>>>>> Stashed changes

exports.updateClient = (req, res) => {
  const { nome, email, telefone } = req.body;

  const sql = `UPDATE cliente SET nome = ?, email = ?, telefone = ? WHERE id_cliente = ?`;

  db.run(sql, [nome, email, telefone, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

<<<<<<< Updated upstream
=======
exports.updatePassword = (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  const { id } = req.params;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: "Informe a senha atual e a nova senha." });
  }

  db.get("SELECT senha FROM cliente WHERE id_cliente = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Usuário não encontrado." });
    if (row.senha !== senhaAtual) return res.status(401).json({ error: "Senha atual incorreta." });

    db.run("UPDATE cliente SET senha = ? WHERE id_cliente = ?", [novaSenha, id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ updated: this.changes });
    });
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
    "SELECT id_cliente, nome, email, telefone, avatar_url, role FROM cliente WHERE id_cliente = ?",
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
>>>>>>> Stashed changes

exports.deleteClient = (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM cliente WHERE id_cliente = ?", id, function (err) {
    if (err) {
      return res.status(500).json({
        error: "Não foi possível deletar a conta. Verifique se existem pedidos vinculados a este usuário."
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    res.json({ message: "Conta removida com sucesso!", deleted: this.changes });
  });
};