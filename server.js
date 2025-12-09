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
app.post(
  "/instrutores",
  upload.fields([
    { name: "comprovante" },
    { name: "cnh" },
    { name: "selfie" }
  ]),
  (req, res) => {
    console.log("📥 Recebendo cadastro...");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const { nome, cpf, endereco, cidade, estado, categorias, telefone, sexo } = req.body;

    // valida campos obrigatórios
    if (!nome || !cpf || !cidade || !estado || !telefone || !categorias || !sexo) {
      return res.status(400).json({ error: "Campos obrigatórios não enviados" });
    }

    // valida arquivos obrigatórios
    if (!req.files || !req.files["comprovante"] || !req.files["cnh"] || !req.files["selfie"]) {
      return res.status(400).json({ error: "Arquivos obrigatórios não enviados" });
    }

    // salva apenas o filename
    const comprovante = req.files["comprovante"][0].filename;
    const cnh = req.files["cnh"][0].filename;
    const selfie = req.files["selfie"][0].filename;

    // 🔎 Aqui entra a normalização do sexo
    let sexoNormalizado = req.body.sexo;
    if (sexoNormalizado === "M") sexoNormalizado = "masculino";
    if (sexoNormalizado === "F") sexoNormalizado = "feminino";
    if (sexoNormalizado && sexoNormalizado.toLowerCase() === "sem-preferencia") {
      sexoNormalizado = null; // ignora filtro
    }

    // normaliza categorias (sem espaços, em maiúsculo)
    const categoriasNormalizadas = categorias.replace(/\s+/g, "").toUpperCase();

    db.query(
      "INSERT INTO instrutores (nome, cpf, endereco, cidade, estado, telefone, comprovante_residencia, cnh, selfie, categorias, sexo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')",
      [nome, cpf, endereco, cidade, estado, telefone, comprovante, cnh, selfie, categoriasNormalizadas, sexoNormalizado],
      (err) => {
        if (err) {
          console.error("❌ Erro no INSERT:", err);
          return res.status(500).json({ error: err });
        }
        res.json({ message: "Cadastro enviado para análise!" });
      }
    );
  }
);

// 📌 Listar instrutores aceitos com filtro
app.get("/instrutores/aceitos", (req, res) => {
  const { cidade, estado, sexo, categorias } = req.query;

  if (!cidade || !estado) {
    return res.status(400).json({ error: "Cidade e estado são obrigatórios" });
  }

  let sql = "SELECT * FROM instrutores WHERE status = 'aceito' AND cidade = ? AND estado = ?";
  const params = [cidade, estado];

  // aplica filtro de sexo apenas se não for "sem-preferencia"
  if (sexo && sexo.toLowerCase() !== "sem-preferencia") {
    sql += " AND LOWER(sexo) = LOWER(?)";
    params.push(sexo);
  }

  // aplica filtro de categorias se informado
  if (categorias) {
    sql += " AND UPPER(categorias) LIKE ?";
    params.push(`%${categorias.toUpperCase()}%`);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    results.forEach(instrutor => {
      if (instrutor.comprovante_residencia) {
        instrutor.comprovante_residencia = `https://meuinstrutor.onrender.com/uploads/${instrutor.comprovante_residencia}`;
      }
      if (instrutor.cnh) {
        instrutor.cnh = `https://meuinstrutor.onrender.com/uploads/${instrutor.cnh}`;
      }
      if (instrutor.selfie) {
        instrutor.selfie = `https://meuinstrutor.onrender.com/uploads/${instrutor.selfie}`;
      }
    });

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

    results.forEach(instrutor => {
      if (instrutor.comprovante_residencia) {
        instrutor.comprovante_residencia = `https://meuinstrutor.onrender.com/uploads/${instrutor.comprovante_residencia}`;
      }
      if (instrutor.cnh) {
        instrutor.cnh = `https://meuinstrutor.onrender.com/uploads/${instrutor.cnh}`;
      }
      if (instrutor.selfie) {
        instrutor.selfie = `https://meuinstrutor.onrender.com/uploads/${instrutor.selfie}`;
      }
    });

    res.json(results);
  });
});

// Atualizar Selfie
app.put("/instrutores/:id/selfie", upload.single("selfie"), (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma selfie enviada" });
  }

  const selfie = req.file.filename;

  db.query("UPDATE instrutores SET selfie = ? WHERE id = ?", [selfie, id], (err) => {
    if (err) {
      console.error("❌ Erro ao atualizar selfie:", err);
      return res.status(500).json({ error: err });
    }
    res.json({ message: "Selfie atualizada com sucesso!" });
  });
});

// Atualizar Comprovante
app.put("/instrutores/:id/comprovante", upload.single("comprovante"), (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum comprovante enviado" });
  }

  const comprovante = req.file.filename;

  db.query("UPDATE instrutores SET comprovante_residencia = ? WHERE id = ?", [comprovante, id], (err) => {
    if (err) {
      console.error("❌ Erro ao atualizar comprovante:", err);
      return res.status(500).json({ error: err });
    }
    res.json({ message: "Comprovante atualizado com sucesso!" });
  });
});

// Atualizar CNH
app.put("/instrutores/:id/cnh", upload.single("cnh"), (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma CNH enviada" });
  }

  const cnh = req.file.filename;

  db.query("UPDATE instrutores SET cnh = ? WHERE id = ?", [cnh, id], (err) => {
    if (err) {
      console.error("❌ Erro ao atualizar CNH:", err);
      return res.status(500).json({ error: err });
    }
    res.json({ message: "CNH atualizada com sucesso!" });
  });
});

/* ========================= START ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});