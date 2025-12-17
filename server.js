// server.js
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

// Configuração do banco de dados usando Pool
const db = mysql.createPool({
  host: "sql5.freesqldatabase.com",
  user: "sql5802663",
  password: "p56QUxpyQI",
  database: "sql5802663",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 segundos
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

// Função auxiliar para upload no Cloudinary

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
// Função auxiliar para upload no Cloudinary
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // 🔑 retorna o link público
      }
    );
    stream.end(buffer);
  });
}

// 📌 Cadastro de instrutor
app.post("/instrutores", upload.fields([
  { name: "selfie", maxCount: 1 },
  { name: "comprovante", maxCount: 1 },
  { name: "cnh", maxCount: 1 },
  { name: "certificado", maxCount: 1 }
]), async (req, res) => {
  try {
    // 🔎 Validação antes de enviar pro Cloudinary
    const totalUploads = Object.keys(req.files).length;

    // Se não forem exatamente 4 arquivos, rejeita sem enviar nada
    if (totalUploads !== 4) {
      return res.status(400).json({ error: "É obrigatório enviar exatamente 4 arquivos (selfie, comprovante, cnh e certificado)." });
    }

    // Valida se todos são imagens
    for (const field of ["selfie", "comprovante", "cnh", "certificado"]) {
      if (!req.files[field]) {
        return res.status(400).json({ error: `Arquivo obrigatório não enviado: ${field}` });
      }
      if (!req.files[field][0].mimetype.startsWith("image/")) {
        return res.status(400).json({ error: `O arquivo de ${field} deve ser uma imagem.` });
      }
    }

    // ✅ Só chega aqui se passou na validação
    const uploads = {};
    uploads.selfie = await uploadToCloudinary(req.files.selfie[0].buffer, "instrutores/selfies");
    uploads.comprovante = await uploadToCloudinary(req.files.comprovante[0].buffer, "instrutores/comprovantes");
    uploads.cnh = await uploadToCloudinary(req.files.cnh[0].buffer, "instrutores/cnhs");
    uploads.certificado = await uploadToCloudinary(req.files.certificado[0].buffer, "instrutores/certificados");

    // Salva no banco
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
        uploads.selfie,
        uploads.comprovante,
        uploads.cnh,
        uploads.certificado,
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
    // Normaliza o valor recebido
    let filtroSexo = sexo.toLowerCase();
    if (filtroSexo === "masculino") filtroSexo = "M";
    if (filtroSexo === "feminino") filtroSexo = "F";

    sql += " AND sexo = ?";
    params.push(filtroSexo);
  }

  if (categorias) {
    sql += " AND UPPER(categorias) LIKE ?";
    params.push(`%${categorias.toUpperCase()}%`);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage || err.message });
    res.json(results);
  });
});

// 📌 Listar todos os instrutores (pendentes e aceitos)
app.get("/instrutores/todos", (req, res) => {
  db.query("SELECT * FROM instrutores", (err, results) => {
    if (err) {
      console.error("❌ Erro ao listar todos:", err.sqlMessage || err.message || err);
      return res.status(500).json({ error: "Erro ao buscar instrutores" });
    }

    res.json(results);
  });
});

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

// Buscar todas as avaliações de um instrutor
app.get("/avaliacoes/:instrutorId", async (req, res) => {
  const { instrutorId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT estrelas, comentario, primeiro_nome, sobrenome, telefone, data_avaliacao FROM avaliacoes WHERE instrutor_id = ? ORDER BY data_avaliacao DESC",
      [instrutorId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar avaliações" });
  }
});

// Inserir nova avaliação
app.post("/avaliacoes", async (req, res) => {
  const { instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone } = req.body;
  try {
    await db.query(
      "INSERT INTO avaliacoes (instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone) VALUES (?, ?, ?, ?, ?, ?)",
      [instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone]
    );
    res.json({ mensagem: "Avaliação registrada com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar avaliação" });
  }
});

// Calcular média de estrelas e total de avaliações por instrutor
app.get("/instrutores/avaliacoes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT instrutor_id, AVG(estrelas) AS media_estrelas, COUNT(*) AS total_avaliacoes
      FROM avaliacoes
      GROUP BY instrutor_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao calcular médias" });
  }
});

/* ========================= START ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});