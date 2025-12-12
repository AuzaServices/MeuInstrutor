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
// Middleware
app.use(express.json());
app.use(cors());

// 🔎 Não precisamos mais expor /uploads, pois não salvamos nada em disco.
// As imagens ficam no banco como BLOB e são convertidas para base64 nas rotas.

// Se você ainda quiser servir arquivos estáticos da pasta public (HTML, CSS, JS):
app.use(express.static(path.join(__dirname, "public")));

// Configuração do banco de dados usando Pool
const db = mysql.createPool({
  host: "sql5.freesqldatabase.com",
  user: "sql5802663",
  password: "p56QUxpyQI",
  database: "sql5802663",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testa a conexão inicial
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Erro ao conectar no MySQL:", err);
    return;
  }
  console.log("✅ Conectado ao MySQL!");
  connection.release();
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dzwkr47ib",
  api_key: "553561859359519",
  api_secret: "IYJBytc-xlGnFW87Taguno77LDw",
  secure: true
});

/* ========================= ROTAS ========================= */

// 📌 Listar instrutores pendentes
app.get("/instrutores", (req, res) => {
  db.query("SELECT * FROM instrutores WHERE status = 'pendente'", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
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
app.post("/instrutores", upload.fields([
  { name: "selfie", maxCount: 1 },
  { name: "comprovante", maxCount: 1 },
  { name: "cnh", maxCount: 1 },
  { name: "certificado", maxCount: 1 }
]), async (req, res) => {
  try {
    const uploads = {};

    for (const field of ["selfie", "comprovante", "cnh", "certificado"]) {
      if (req.files[field]) {
        const result = await cloudinary.uploader.upload_stream(
          { folder: "instrutores" },
          (error, uploaded) => {
            if (error) throw error;
            uploads[field] = uploaded.secure_url; // 🔑 link público
          }
        );
        result.end(req.files[field][0].buffer);
      }
    }

    // Agora salva só os links no banco
    db.query(
      "INSERT INTO instrutores (nome, email, cpf, sexo, cidade, estado, telefone, selfie, comprovante_residencia, cnh, certificado, categorias, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')",
      [
        req.body.nome,
        req.body.email,
        req.body.cpf,
        req.body.sexo,
        req.body.cidade,
        req.body.estado,
        req.body.telefone,
        uploads.selfie || null,
        uploads.comprovante || null,
        uploads.cnh || null,
        uploads.certificado || null,
        req.body.categorias
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Instrutor cadastrado com sucesso!" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Aceitar instrutor (única versão correta)
app.put("/instrutores/aceitar/:id", (req, res) => {
  const { id } = req.params;

  // Ajuste para fuso horário local
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  const dataFormatada = local.toISOString().split("T")[0]; // YYYY-MM-DD

  db.query(
    "UPDATE instrutores SET status = 'aceito', data_pagamento = ? WHERE id = ?",
    [dataFormatada, id],
    (err) => {
      if (err) {
        console.error("❌ Erro ao aceitar instrutor:", err.sqlMessage || err);
        return res.status(500).json({ error: err.sqlMessage || String(err) });
      }
      res.json({ message: "Instrutor aceito e data de pagamento registrada!", data_pagamento: dataFormatada });
    }
  );
});

// 📌 Listar instrutores aceitos com filtro
app.get("/instrutores/aceitos", (req, res) => {
  const { cidade, estado, sexo, categorias } = req.query;
  if (!cidade || !estado) {
    return res.status(400).json({ error: "Cidade e estado são obrigatórios" });
  }

  let sql = "SELECT * FROM instrutores WHERE status = 'aceito' AND cidade = ? AND estado = ?";
  const params = [cidade, estado];

  if (sexo && sexo.toLowerCase() !== "sem-preferencia") {
    sql += " AND LOWER(sexo) = LOWER(?)";
    params.push(sexo);
  }

  if (categorias) {
    sql += " AND UPPER(categorias) LIKE ?";
    params.push(`%${categorias.toUpperCase()}%`);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results); // já são URLs
  });
});

// 📌 Listar todos os instrutores (pendentes e aceitos)
// 📌 Listar todos os instrutores (pendentes e aceitos)
app.get("/instrutores/todos", (req, res) => {
  db.query("SELECT * FROM instrutores", (err, results) => {
    if (err) {
      console.error("❌ Erro ao listar todos:", err);
      return res.status(500).json({ error: err });
    }

    // Agora os campos já são URLs do Cloudinary, não precisa converter
    res.json(results);
  });
});

// Atualizar Selfie
// Atualizar Selfie
app.put("/instrutores/:id/selfie", upload.single("selfie"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhuma selfie enviada" });

  try {
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "instrutores/selfies" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    db.query("UPDATE instrutores SET selfie = ? WHERE id = ?", [url, id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Selfie atualizada com sucesso!", url });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar Comprovante
app.put("/instrutores/:id/comprovante", upload.single("comprovante"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhum comprovante enviado" });

  try {
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "instrutores/comprovantes" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    db.query("UPDATE instrutores SET comprovante_residencia = ? WHERE id = ?", [url, id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Comprovante atualizado com sucesso!", url });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar CNH
app.put("/instrutores/:id/cnh", upload.single("cnh"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhuma CNH enviada" });

  try {
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "instrutores/cnhs" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    db.query("UPDATE instrutores SET cnh = ? WHERE id = ?", [url, id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "CNH atualizada com sucesso!", url });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar Certificado
app.put("/instrutores/:id/certificado", upload.single("certificado"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhum certificado enviado" });

  try {
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "instrutores/certificados" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    db.query("UPDATE instrutores SET certificado = ? WHERE id = ?", [url, id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Certificado atualizado com sucesso!", url });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ========================= START ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});