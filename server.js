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

// Configuração do multer para salvar em memória (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
app.post(
  "/instrutores",
  upload.fields([
    { name: "comprovante" },
    { name: "cnh" },
    { name: "selfie" },
    { name: "certificado" }
  ]),
  (req, res) => {
    console.log("📥 Recebendo cadastro...");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const { nome, cpf, cidade, estado, categorias, telefone, sexo, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    if (!nome || !cpf || !cidade || !estado || !telefone || !categorias || !sexo) {
      return res.status(400).json({ error: "Campos obrigatórios não enviados" });
    }

    if (!req.files || !req.files["comprovante"] || !req.files["cnh"] || !req.files["selfie"]) {
      return res.status(400).json({ error: "Arquivos obrigatórios não enviados" });
    }

    // 🔎 Agora pegamos o buffer (conteúdo binário) em vez do filename
    const comprovante = req.files["comprovante"][0].buffer;
    const cnh = req.files["cnh"][0].buffer;
    const selfie = req.files["selfie"][0].buffer;
    const certificado = req.files["certificado"] ? req.files["certificado"][0].buffer : null;

    const categoriasNormalizadas = categorias ? categorias.replace(/\s+/g, "").toUpperCase() : null;

    let sexoNormalizado = sexo;
    if (sexoNormalizado === "M") sexoNormalizado = "masculino";
    if (sexoNormalizado === "F") sexoNormalizado = "feminino";
    if (sexoNormalizado && sexoNormalizado.toLowerCase() === "sem-preferencia") {
      sexoNormalizado = null;
    }

    const dataCadastro = new Date().toISOString().slice(0, 19).replace("T", " ");

    db.query(
      "INSERT INTO instrutores (nome, cpf, cidade, estado, telefone, email, comprovante_residencia, cnh, selfie, certificado, categorias, sexo, status, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        cpf,
        cidade,
        estado,
        telefone,
        email,
        comprovante,
        cnh,
        selfie,
        certificado,
        categoriasNormalizadas,
        sexoNormalizado,
        "pendente",
        dataCadastro
      ],
      (err) => {
        if (err) {
          console.error("❌ Erro no INSERT:", err.sqlMessage);
          return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Cadastro enviado para análise!" });
      }
    );
  }
);

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

    results.forEach(instrutor => {
      if (instrutor.comprovante_residencia) {
        instrutor.comprovante_residencia = `data:image/jpeg;base64,${instrutor.comprovante_residencia.toString("base64")}`;
      }
      if (instrutor.cnh) {
        instrutor.cnh = `data:image/jpeg;base64,${instrutor.cnh.toString("base64")}`;
      }
      if (instrutor.selfie) {
        instrutor.selfie = `data:image/jpeg;base64,${instrutor.selfie.toString("base64")}`;
      }
      if (instrutor.certificado) {
        instrutor.certificado = `data:image/jpeg;base64,${instrutor.certificado.toString("base64")}`;
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
        instrutor.comprovante_residencia = `data:image/jpeg;base64,${instrutor.comprovante_residencia.toString("base64")}`;
      }
      if (instrutor.cnh) {
        instrutor.cnh = `data:image/jpeg;base64,${instrutor.cnh.toString("base64")}`;
      }
      if (instrutor.selfie) {
        instrutor.selfie = `data:image/jpeg;base64,${instrutor.selfie.toString("base64")}`;
      }
      if (instrutor.certificado) {
        instrutor.certificado = `data:image/jpeg;base64,${instrutor.certificado.toString("base64")}`;
      }
    });

    res.json(results);
  });
});

// Atualizar Selfie
app.put("/instrutores/:id/selfie", upload.single("selfie"), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhuma selfie enviada" });

  const selfie = req.file.buffer;
  db.query("UPDATE instrutores SET selfie = ? WHERE id = ?", [selfie, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Selfie atualizada com sucesso!" });
  });
});

// Atualizar Comprovante
app.put("/instrutores/:id/comprovante", upload.single("comprovante"), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhum comprovante enviado" });

  const comprovante = req.file.buffer;
  db.query("UPDATE instrutores SET comprovante_residencia = ? WHERE id = ?", [comprovante, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Comprovante atualizado com sucesso!" });
  });
});

// Atualizar CNH
app.put("/instrutores/:id/cnh", upload.single("cnh"), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhuma CNH enviada" });

  const cnh = req.file.buffer;
  db.query("UPDATE instrutores SET cnh = ? WHERE id = ?", [cnh, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "CNH atualizada com sucesso!" });
  });
});

// Atualizar Certificado
app.put("/instrutores/:id/certificado", upload.single("certificado"), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Nenhum certificado enviado" });

  const certificado = req.file.buffer;
  db.query("UPDATE instrutores SET certificado = ? WHERE id = ?", [certificado, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Certificado atualizado com sucesso!" });
  });
});

/* ========================= START ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});