// server.js
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer"); // para upload de imagens
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuração do banco de dados
const db = mysql.createConnection({
  host: "sql5.freesqldatabase.com",
  user: "sql5802663",
  password: "p56QUxpyQI",
  database: "sql5802663"
});

// Testar conexão
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    return;
  }
  console.log("Conectado ao MySQL!");
});

// Configuração do multer para salvar imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* ========================= ROTAS ========================= */

// 📌 Rota para listar instrutores pendentes
app.get("/instrutores", (req, res) => {
  db.query("SELECT * FROM instrutores WHERE status = 'pendente'", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 📌 Rota para aceitar instrutor
app.put("/instrutores/aceitar/:id", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE instrutores SET status = 'aceito' WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Instrutor aceito com sucesso!" });
  });
});

// 📌 Rota para recusar instrutor
app.put("/instrutores/recusar/:id", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE instrutores SET status = 'recusado' WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Instrutor recusado com sucesso!" });
  });
});

// 📌 Rota para cadastro (quando usuário se inscreve)
app.post("/instrutores", upload.fields([{ name: "comprovante" }, { name: "cnh" }]), (req, res) => {
  const { nome, cpf, endereco, cidade, estado, categorias } = req.body;
  const comprovante = req.files["comprovante"][0].path;
  const cnh = req.files["cnh"][0].path;

  db.query(
    "INSERT INTO instrutores (nome, cpf, endereco, cidade, estado, comprovante_residencia, cnh, categorias, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')",
    [nome, cpf, endereco, cidade, estado, comprovante, cnh, categorias],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Cadastro enviado para análise!" });
    }
  );
});

// 📌 Rota para listar instrutores aceitos com filtro por cidade/estado
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

/* ========================= START ========================= */

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});