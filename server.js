// server.js
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

// 🔐 Garante que a pasta uploads existe
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(uploadsPath));
app.use(express.static(path.join(__dirname, "public")));

// Configuração do banco de dados
const db = mysql.createConnection({
  host: "sql5.freesqldatabase.com",
  user: "sql5802663",
  password: "p56QUxpyQI",
  database: "sql5802663"
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    return;
  }
  console.log("✅ Conectado ao MySQL!");
});

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* ========================= ROTAS ========================= */

// 📌 Listar instrutores pendentes
app.get("/instrutores", (req, res) => {
  db.query("SELECT * FROM instrutores WHERE status = 'pendente'", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 📌 Aceitar instrutor
app.put("/instrutores/aceitar/:id", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE instrutores SET status = 'aceito' WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Instrutor aceito com sucesso!" });
  });
});

// 📌 Excluir instrutor (Recusar)
app.delete("/instrutores/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM instrutores WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("❌ Erro ao excluir:", err);
      return res.status(500).json({ error: err });
    }
    res.json({ message: "Instrutor excluído com sucesso!" });
  });
});

// 📌 Cadastro de instrutor
app.post("/instrutores", upload.fields([{ name: "comprovante" }, { name: "cnh" }]), (req, res) => {
  console.log("📥 Recebendo cadastro...");
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { nome, cpf, endereco, cidade, estado, categorias } = req.body;

  if (!req.files || !req.files["comprovante"] || !req.files["cnh"]) {
    return res.status(400).json({ error: "Arquivos obrigatórios não enviados" });
  }

  const comprovante = req.files["comprovante"][0].path;
  const cnh = req.files["cnh"][0].path;

  db.query(
    "INSERT INTO instrutores (nome, cpf, endereco, cidade, estado, comprovante_residencia, cnh, categorias, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')",
    [nome, cpf, endereco, cidade, estado, comprovante, cnh, categorias],
    (err) => {
      if (err) {
        console.error("❌ Erro no INSERT:", err);
        return res.status(500).json({ error: err });
      }
      res.json({ message: "Cadastro enviado para análise!" });
    }
  );
});

// 📌 Listar instrutores aceitos com filtro
app.get("/instrutores/aceitos", (req, res) => {
  const { cidade, estado } = req.query;

  let sql = "SELECT * FROM instrutores WHERE status = 'aceito'";
  const params = [];

  if (cidade) {
    sql += " AND cidade = ?";
    params.push(cidade);
  }
  if (estado) {
    sql += " AND estado = ?";
    params.push(estado);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 📌 Listar todos os instrutores (pendentes e aceitos)
app.get("/instrutores/todos", (req, res) => {
  db.query("SELECT * FROM instrutores", (err, results) => {
    if (err) {
      console.error("❌ Erro ao listar todos:", err);
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});

/* ========================= START ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});