// ================= FORMULÁRIO DE ALUNO =================
function carregarFormularioAluno() {
  document.getElementById("titulo-form").innerText = "Buscar Instrutor(a) Credênciado(a)";
  document.getElementById("form-area").innerHTML = `
    <form onsubmit="buscarInstrutor(event)">
      <div class="linha-horizontal">
        <div class="campo">
          <label for="estado">Estado:</label>
          <select id="estado" required>
            <option value="">Selecione o estado</option>
          </select>
        </div>
        <div class="campo">
          <label for="cidade">Cidade:</label>
          <select id="cidade" required>
            <option value="">Selecione a cidade</option>
          </select>
        </div>
      </div>
      <div class="linha-horizontal">
        <div class="campo">
          <label for="categoria">Categoria CNH:</label>
          <select id="categoria" required>
            <option value="">Selecione a categoria</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </div>
        <div class="campo">
          <label for="sexo">Sexo:</label>
          <select id="sexo" name="sexo" required>
            <option value="">Selecione</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="sem-preferencia">Sem preferência</option>
          </select>
        </div>
      </div>
      <button type="submit">Buscar</button>
    </form>
  `;

  carregarEstadosAluno();
  document.getElementById("estado").addEventListener("change", carregarCidadesAluno);
}

// ================= BUSCA DE INSTRUTOR =================
async function buscarInstrutor(event) {
  event.preventDefault();
  const estado = document.getElementById("estado").selectedOptions[0].text;
  const cidade = document.getElementById("cidade").value;
  const categoria = document.getElementById("categoria").value;
  const sexo = document.getElementById("sexo").value;

  try {
    const resposta = await fetch(
      `https://meuinstrutor.onrender.com/instrutores/aceitos?cidade=${cidade}&estado=${estado}&sexo=${sexo}&categorias=${categoria}`
    );
    const instrutores = await resposta.json();

    let html = `<h4>Instrutores disponíveis em ${cidade}/${estado}:</h4>`;
    html += `<p>Filtro aplicado: Categoria ${categoria}, Sexo ${sexo}</p>`;
    html += `<div class="carousel-container">`;

    instrutores.forEach(instrutor => {
      const nomes = instrutor.nome.split(" ");
      const primeiroNome = nomes[0] || "";
      const segundoNome = nomes[1] || "";
      const telefone = instrutor.telefone.replace(/\D/g, "");
      const linkWhats = `https://wa.me/55${telefone}`;

      html += `
        <div class="card-instrutor">
          <img src="${instrutor.selfie}" alt="Foto de ${instrutor.nome}" class="foto-instrutor">
          <h3>${primeiroNome} ${segundoNome}</h3>
          <p class="categorias">Categoria(s): ${instrutor.categorias}</p>
          <a href="${linkWhats}" target="_blank" class="btn-whatsapp">WhatsApp</a>
        </div>
      `;
    });

    html += `</div>`;
    document.getElementById("resultado").innerHTML = html; // 🔑 injeta na section nova
  } catch (error) {
    console.error("Erro ao buscar instrutores:", error);
    document.getElementById("resultado").innerHTML = "<p>Erro ao buscar instrutores.</p>";
  }
}

// ================= FORMULÁRIO DE INSTRUTOR =================
function carregarFormularioInstrutor() {
  document.getElementById("titulo-form").innerText = "Cadastro de Instrutor";
  document.getElementById("form-area").innerHTML = `
    <form id="formInstrutor">
      
      <!-- Etapa 1: Dados pessoais -->
      <div class="etapa" id="etapa1">
        <label>Nome completo:</label>
        <input type="text" id="nome" name="nome" required>

        <label>Email:</label>
        <input type="email" id="email" name="email" required>

        <label>CPF:</label>
        <input type="text" id="cpf" name="cpf" maxlength="14" required>

        <label>Sexo:</label>
        <select id="sexoInstrutor" name="sexo" required>
          <option value="">Selecione</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>

        <label>Telefone (Whatsapp):</label>
        <input type="tel" id="telefone" name="telefone" placeholder="(XX)9XXXX-XXXX" title="Formato esperado: (XX)9XXXX-XXXX">

        <button type="button" onclick="validarEAvancar(1,2)">Próximo</button>
      </div>

      <!-- Etapa 2: Endereço -->
      <div class="etapa" id="etapa2" style="display:none;">
        <h4>Localização</h4>
        
        <label>Estado:</label>
        <select id="estadoInstrutor" name="estado" required>
          <option value="">Selecione o estado</option>
        </select>

        <label>Cidade:</label>
        <select id="cidadeInstrutor" name="cidade" required>
          <option value="">Selecione a cidade</option>
        </select>

        <button type="button" onclick="voltarEtapa(1)">Voltar</button>
        <button type="button" onclick="validarEAvancar(2,3)">Próximo</button>
      </div>

      <!-- Etapa 3: Identificação Pessoal -->
      <div class="etapa" id="etapa3" style="display:none;">
        <h4>Identificação Pessoal</h4>

        <label for="selfie" class="custom-file-label">
          <i class="fa-solid fa-upload"></i> Carregar Foto do instrutor(a)
        </label>
        <input type="file" id="selfie" name="selfie" accept="image/*" required>
        <span class="upload-check" id="check-selfie"></span>

        <label for="comprovante" class="custom-file-label">
          <i class="fa-solid fa-upload"></i> Enviar Comprovante de Residência
        </label>
        <input type="file" id="comprovante" name="comprovante" required>
        <span class="upload-check" id="check-comprovante"></span>

        <button type="button" onclick="voltarEtapa(2)">Voltar</button>
        <button type="button" onclick="validarEAvancar(3,4)">Próximo</button>
      </div>

      <!-- Etapa 4: CNH, Certificado e Categorias -->
      <div class="etapa" id="etapa4" style="display:none;">
        <h4>Habilitação e Certificação</h4>

        <label for="cnh" class="custom-file-label">
          <i class="fa-solid fa-upload"></i> Carteira Nacional de Habilitação
        </label>
        <input type="file" id="cnh" name="cnh" required>
        <span class="upload-check" id="check-cnh"></span>

        <label for="certificado" class="custom-file-label">
          <i class="fa-solid fa-upload"></i> Certificado de Instrutor de Trânsito
        </label>
        <input type="file" id="certificado" name="certificado" required>
        <span class="upload-check" id="check-certificado"></span>

        <h4>Especializações de ensino:</h4>
        <div class="categorias">
          <label><input type="checkbox" name="categoria" value="A"> A</label>
          <label><input type="checkbox" name="categoria" value="B"> B</label>
          <label><input type="checkbox" name="categoria" value="C"> C</label>
          <label><input type="checkbox" name="categoria" value="D"> D</label>
          <label><input type="checkbox" name="categoria" value="E"> E</label>
        </div>

        <button type="button" onclick="voltarEtapa(3)">Voltar</button>
        <button type="submit">Enviar</button>

        <p style="font-size: 12px; color: #555; margin-top: 8px;">
          Ao clicar em <strong>Enviar</strong>, você concorda com os 
          <a href="/termos" target="_blank" style="color: orange;">Termos de Uso</a> e com a 
          <a href="/privacidade" target="_blank" style="color: orange;">Política de Privacidade</a>.
        </p>
      </div>
    </form>

    <!-- Modal de sucesso -->
    <div id="successModal" class="modal">
      <div class="modal-content">
        <div class="icon-check">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h2>Cadastro realizado</h2>
        <p>Seu cadastro foi feito e está em análise.<br>
        Dentro de um período de 24 horas nossa equipe entrará em contato com você para dar prosseguimento.</p>
        <div class="progress-bar">
          <div class="progress"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("formInstrutor").addEventListener("submit", cadastrarInstrutor);
}

document.getElementById("formInstrutor").addEventListener("submit", async function(event) {
  event.preventDefault();

  const categoriasSelecionadas = [];
  document.querySelectorAll('input[name="categoria"]:checked').forEach(el => {
    categoriasSelecionadas.push(el.value);
  });

  const formData = new FormData();
  formData.append("nome", document.getElementById("nome").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("cpf", document.getElementById("cpf").value);
  formData.append("sexo", document.getElementById("sexoInstrutor").value);

  // 🔎 Validação do telefone
  const telefone = document.getElementById("telefone").value;
  if (!/\(\d{2}\)9\d{4}-\d{4}/.test(telefone)) {
    alert("Telefone inválido. Use o formato (XX)9XXXX-XXXX");
    return;
  }
  formData.append("telefone", telefone);

  formData.append("selfie", document.getElementById("selfie").files[0]);
  formData.append("cidade", document.getElementById("cidadeInstrutor").value);

  // ✅ Correção: pegar o nome do estado
  const estadoSelect = document.getElementById("estadoInstrutor");
  const estadoNome = estadoSelect.options[estadoSelect.selectedIndex].text;
  formData.append("estado", estadoNome);

  formData.append("comprovante", document.getElementById("comprovante").files[0]);
  formData.append("cnh", document.getElementById("cnh").files[0]);
  formData.append("certificado", document.getElementById("certificado").files[0]);
  formData.append("categorias", categoriasSelecionadas.join(","));

  try {
    console.log("📤 Disparando fetch...");
    const resposta = await fetch("https://meuinstrutor.onrender.com/instrutores", {
      method: "POST",
      body: formData
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.error || "Erro no servidor");
    }

    alert(resultado.message);
    document.getElementById("formInstrutor").reset();
    proximaEtapa(1);
  } catch (error) {
    console.error("❌ Erro ao cadastrar instrutor:", error);
    alert("Erro ao cadastrar instrutor: " + error.message);
  }
});

// ================= NAVEGAÇÃO ENTRE ETAPAS =================
function proximaEtapa(n) {
  document.querySelectorAll('.etapa').forEach(e => e.style.display = 'none');
  document.getElementById('etapa' + n).style.display = 'block';
  document.querySelector('#form-area').scrollIntoView({ behavior: 'smooth' });
}

function voltarEtapa(n) {
  document.querySelectorAll('.etapa').forEach(e => e.style.display = 'none');
  document.getElementById('etapa' + n).style.display = 'block';
  document.querySelector('#form-area').scrollIntoView({ behavior: 'smooth' });
}

// ====== FUNÇÃO DO MODAL ======
function mostrarModalSucesso() {
  const modal = document.getElementById("successModal");
  const progress = modal.querySelector(".progress");
  modal.style.display = "flex"; // exibe o modal centralizado

  // anima barra decrescente
  progress.style.width = "100%";
  setTimeout(() => { progress.style.width = "0%"; }, 50);

  // fecha modal em 5s
  setTimeout(() => {
    modal.style.display = "none";
    progress.style.width = "100%"; // resetar barra para próxima vez
  }, 5000);
}

// ================= CARREGAR ESTADOS E CIDADES (IBGE) =================
async function carregarEstados() {
  try {
    const resp = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const estados = await resp.json();
    const selectEstado = document.getElementById("estado");

    selectEstado.innerHTML = "<option value=''>Selecione o estado</option>";
    estados.sort((a, b) => a.nome.localeCompare(b.nome));

    estados.forEach(estado => {
      const option = document.createElement("option");
      option.value = estado.id;        // usamos o ID para buscar cidades depois
      option.textContent = estado.nome; // nome exibido no select
      selectEstado.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar estados:", error);
  }
}

// Carregar cidades via API IBGE
async function carregarCidades() {
  const estadoId = document.getElementById("estado").value;
  if (!estadoId) return;

  try {
    const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`);
    const cidades = await resp.json();
    const selectCidade = document.getElementById("cidade");

    selectCidade.innerHTML = "<option value=''>Selecione a cidade</option>";
    cidades.sort((a, b) => a.nome.localeCompare(b.nome));

    cidades.forEach(cidade => {
      const option = document.createElement("option");
      option.value = cidade.nome;
      option.textContent = cidade.nome;
      selectCidade.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
  }
}

// ================= INICIALIZAÇÃO =================
document.addEventListener("DOMContentLoaded", () => {
  // Carrega inicialmente o formulário de aluno (buscar instrutor)
  carregarFormularioAluno();

  // Botão para trocar para formulário de instrutor (se existir no HTML)
  const btnInstrutor = document.querySelector(".btn.amarelo");
  if (btnInstrutor) {
    btnInstrutor.addEventListener("click", carregarFormularioInstrutor);
  }
});

// Menu toggle (se existir no HTML)
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector("nav.menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }
});