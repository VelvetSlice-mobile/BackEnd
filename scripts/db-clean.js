const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./velvetslice_server.db");

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function all(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function cleanTransactionalData() {
  try {
    await run("PRAGMA foreign_keys = ON");
    await run("BEGIN TRANSACTION");

    await run("DELETE FROM item_pedido");
    await run("DELETE FROM pedido");
    await run("DELETE FROM endereco_entrega");
    await run("DELETE FROM endereco");
    await run("DELETE FROM cliente");

    await run("COMMIT");

    const tables = [
      "cliente",
      "endereco",
      "endereco_entrega",
      "pedido",
      "item_pedido",
      "bolo",
    ];

    const counts = {};
    for (const table of tables) {
      const rows = await all(`SELECT COUNT(*) as c FROM ${table}`);
      counts[table] = rows[0].c;
    }

    console.log("DB_CLEAN_OK", counts);
  } catch (error) {
    try {
      await run("ROLLBACK");
    } catch (_) {
    }
    console.error("DB_CLEAN_ERROR", error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

cleanTransactionalData();
