// server.js
const express = require("express");
const mysql = require("mysql2/promise");
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
  connectTimeout: 10000
});


// Testa a conexão inicial
// Testa a conexão inicial
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Conectado ao MySQL!");
    connection.release();
  } catch (err) {
    console.error("❌ Erro ao conectar no MySQL:", err.message || err);
  }
})();

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
app.get("/instrutores", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM instrutores WHERE status = 'pendente'");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Excluir instrutor (Recusar)
// 📌 Excluir instrutor (Recusar)
app.delete("/instrutores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM instrutores WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instrutor não encontrado" });
    }

    res.json({ message: "Instrutor excluído com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao excluir:", err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
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

    if (totalUploads !== 4) {
      return res.status(400).json({ error: "É obrigatório enviar exatamente 4 arquivos (selfie, comprovante, cnh e certificado)." });
    }

    for (const field of ["selfie", "comprovante", "cnh", "certificado"]) {
      if (!req.files[field]) {
        return res.status(400).json({ error: `Arquivo obrigatório não enviado: ${field}` });
      }
      if (!req.files[field][0].mimetype.startsWith("image/")) {
        return res.status(400).json({ error: `O arquivo de ${field} deve ser uma imagem.` });
      }
    }

    // ✅ Uploads para o Cloudinary
    const uploads = {};
    uploads.selfie = await uploadToCloudinary(req.files.selfie[0].buffer, "instrutores/selfies");
    uploads.comprovante = await uploadToCloudinary(req.files.comprovante[0].buffer, "instrutores/comprovantes");
    uploads.cnh = await uploadToCloudinary(req.files.cnh[0].buffer, "instrutores/cnhs");
    uploads.certificado = await uploadToCloudinary(req.files.certificado[0].buffer, "instrutores/certificados");

    // ✅ Salva no banco usando async/await
    await db.query(
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
      ]
    );

    res.json({ message: "Instrutor cadastrado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao cadastrar instrutor:", error.message || error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// 📌 Aceitar instrutor (única versão correta)
// 📌 Aceitar instrutor
app.put("/instrutores/aceitar/:id", async (req, res) => {
  const { id } = req.params;

  // Ajuste para fuso horário local
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  const dataFormatada = local.toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const [result] = await db.query(
      "UPDATE instrutores SET status = 'aceito', data_pagamento = ? WHERE id = ?",
      [dataFormatada, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instrutor não encontrado" });
    }

    res.json({
      message: "Instrutor aceito e data de pagamento registrada!",
      data_pagamento: dataFormatada
    });
  } catch (err) {
    console.error("❌ Erro ao aceitar instrutor:", err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 📌 Listar instrutores aceitos com filtro
// 📌 Listar instrutores aceitos com filtro
// 📌 Listar instrutores aceitos com filtro + média e quantidade de avaliações
app.get("/instrutores/aceitos", async (req, res) => {
  const { cidade, estado, sexo, categorias } = req.query;

  if (!cidade || !estado) {
    return res.status(400).json({ error: "Cidade e estado são obrigatórios" });
  }

  // Base SQL com JOIN na tabela de avaliações
  let sql = `
    SELECT i.*, 
           COALESCE(AVG(a.estrelas), 0) AS media_estrelas,
           COUNT(a.id) AS total_avaliacoes
    FROM instrutores i
    LEFT JOIN avaliacoes a ON a.instrutor_id = i.id AND a.status = 'aceita'
    WHERE i.status = 'aceito' AND i.cidade = ? AND i.estado = ?
  `;
  const params = [cidade, estado];

  // Filtro de sexo
  if (sexo && sexo.toLowerCase() !== "sem-preferencia") {
    let filtroSexo = sexo.toLowerCase();
    if (filtroSexo === "masculino") filtroSexo = "M";
    if (filtroSexo === "feminino") filtroSexo = "F";

    sql += " AND i.sexo = ?";
    params.push(filtroSexo);
  }

  // Filtro de categorias
  if (categorias) {
    sql += " AND UPPER(i.categorias) LIKE ?";
    params.push(`%${categorias.toUpperCase()}%`);
  }

  // Agrupamento para calcular AVG e COUNT corretamente
  sql += " GROUP BY i.id";

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("❌ Erro ao listar instrutores aceitos:", err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 📌 Listar todos os instrutores (pendentes e aceitos)
// 📌 Listar todos os instrutores (pendentes e aceitos)
app.get("/instrutores/todos", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM instrutores");
    res.json(results);
  } catch (err) {
    console.error("❌ Erro ao listar todos:", err.message || err);
    res.status(500).json({ error: "Erro ao buscar instrutores" });
  }
});

// Atualizar Selfie
// 📌 Atualizar Selfie
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

    const [result] = await db.query("UPDATE instrutores SET selfie = ? WHERE id = ?", [url, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instrutor não encontrado" });
    }

    res.json({ message: "Selfie atualizada com sucesso!", url });
  } catch (error) {
    console.error("❌ Erro ao atualizar selfie:", error.message || error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Atualizar Comprovante
// 📌 Atualizar Comprovante
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

    const [result] = await db.query(
      "UPDATE instrutores SET comprovante_residencia = ? WHERE id = ?",
      [url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instrutor não encontrado" });
    }

    res.json({ message: "Comprovante atualizado com sucesso!", url });
  } catch (error) {
    console.error("❌ Erro ao atualizar comprovante:", error.message || error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Atualizar CNH
// 📌 Atualizar CNH
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

    const [result] = await db.query(
      "UPDATE instrutores SET cnh = ? WHERE id = ?",
      [url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instrutor não encontrado" });
    }

    res.json({ message: "CNH atualizada com sucesso!", url });
  } catch (error) {
    console.error("❌ Erro ao atualizar CNH:", error.message || error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Atualizar Certificado
// 📌 Atualizar Certificado
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

    const [result] = await db.query(
      "UPDATE instrutores SET certificado = ? WHERE id = ?",
      [url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instrutor não encontrado" });
    }

    res.json({ message: "Certificado atualizado com sucesso!", url });
  } catch (error) {
    console.error("❌ Erro ao atualizar certificado:", error.message || error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Buscar todas as avaliações de um instrutor
// 📌 Buscar todas as avaliações de um instrutor
// 📌 Buscar apenas avaliações aceitas de um instrutor (site público)

app.get("/avaliacoes/todas", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone, ip, status, data_avaliacao
      FROM avaliacoes
      ORDER BY data_avaliacao DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar todas as avaliações:", err.message || err);
    res.status(500).json({ erro: "Erro ao buscar todas as avaliações" });
  }
});

app.get("/avaliacoes/:instrutorId", async (req, res) => {
  const { instrutorId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT estrelas, comentario, primeiro_nome, sobrenome, telefone, data_avaliacao
       FROM avaliacoes
       WHERE instrutor_id = ? AND status = 'aceita'
       ORDER BY data_avaliacao DESC`,
      [instrutorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Nenhuma avaliação aprovada para este instrutor" });
    }

    res.json(rows);
  } catch (err) {
    console.error("❌ Erro MySQL:", err.message || err);
    res.status(500).json({ erro: "Erro ao buscar avaliações" });
  }
});

// 📌 Inserir nova avaliação
// 📌 Inserir nova avaliação (captura IP automaticamente)
app.post("/avaliacoes", async (req, res) => {
  const { instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone } = req.body;

  // Captura IP do cliente
  const ipHeader = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader.split(",")[0].trim();

  if (!instrutor_id || !estrelas) {
    return res.status(400).json({ erro: "Instrutor e estrelas são obrigatórios" });
  }

  // 🔎 Limite de linhas no comentário (ex: máximo 3 linhas)
  const linhas = comentario ? comentario.split(/\r?\n/).length : 0;
  if (linhas > 3) {
    return res.status(400).json({ erro: "O comentário deve ter no máximo 3 linhas." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO avaliacoes (instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone, ip, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [instrutor_id, estrelas, comentario, primeiro_nome, sobrenome, telefone, ip, "pendente"]
    );

    res.json({ mensagem: "Avaliação registrada com sucesso e aguardando aprovação!", id: result.insertId });
  } catch (err) {
    console.error("❌ Erro ao salvar avaliação:", err.message || err);
    res.status(500).json({ erro: "Erro ao salvar avaliação" });
  }
});

// 📌 Calcular média de estrelas e total de avaliações por instrutor (somente aceitas)
app.get("/instrutores/avaliacoes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT instrutor_id,
             AVG(estrelas) AS media_estrelas,
             COUNT(*) AS total_avaliacoes
      FROM avaliacoes
      WHERE status = 'aceita'
      GROUP BY instrutor_id
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao calcular médias:", err.message || err);
    res.status(500).json({ erro: "Erro ao calcular médias" });
  }
});

// 📌 Aceitar avaliação (muda status para 'aceita')
app.patch("/avaliacoes/aceitar/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE avaliacoes SET status = 'aceita' WHERE id = ?", [id]);
    res.json({ mensagem: "Avaliação aceita com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao aceitar avaliação:", err.message || err);
    res.status(500).json({ erro: "Erro ao aceitar avaliação" });
  }
});

// 📌 Recusar avaliação (muda status para 'rejeitada')
app.delete("/avaliacoes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE avaliacoes SET status = 'rejeitada' WHERE id = ?", [id]);
    res.json({ mensagem: "Avaliação rejeitada." });
  } catch (err) {
    console.error("❌ Erro ao recusar avaliação:", err.message || err);
    res.status(500).json({ erro: "Erro ao recusar avaliação" });
  }
});

// 📌 Apagar avaliação (remove do banco)
app.delete("/avaliacoes/apagar/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM avaliacoes WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Avaliação não encontrada" });
    }
    res.json({ mensagem: "Avaliação apagada definitivamente." });
  } catch (err) {
    console.error("❌ Erro ao apagar avaliação:", err.message || err);
    res.status(500).json({ erro: "Erro ao apagar avaliação" });
  }
});

/* ========================= START ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});