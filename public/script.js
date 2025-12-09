// ================= FORMULÁRIO DE ALUNO =================
function carregarFormularioAluno() {
  document.getElementById("titulo-form").innerText = "Buscar Instrutor";
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
          <label for="categoria">Categoria:</label>
          <select id="categoria" required>
            <option value="">Selecione</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </div>
        <div class="campo">
          <label for="sexo">Sexo:</label>
          <select id="sexo" required>
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
      </div>
      <button type="submit">Buscar</button>
    </form>
    <div id="resultado"></div>
  `;

  // Carrega estados e adiciona listener
  carregarEstados();
  document.getElementById("estado").addEventListener("change", carregarCidades);
}

// Busca de instrutor integrada ao backend
async function buscarInstrutor(event) {
  event.preventDefault();
  const estado = document.getElementById("estado").selectedOptions[0].text;
  const cidade = document.getElementById("cidade").value;
  const categoria = document.getElementById("categoria").value;
  const sexo = document.getElementById("sexo").value;

  try {
    const resposta = await fetch(`https://meuinstrutor.onrender.com/instrutores/aceitos?cidade=${cidade}&estado=${estado}`);
    const instrutores = await resposta.json();

    let html = `<h4>Instrutores disponíveis em ${cidade}/${estado}:</h4>`;
    html += `<p>Filtro aplicado: Categoria ${categoria}, Sexo ${sexo}</p>`;
    html += `<div class="cards-container">`;

    instrutores.forEach(instrutor => {
      const nomes = instrutor.nome.split(" ");
      const primeiroNome = nomes[0] || "";
      const segundoNome = nomes[1] || "";

      const telefone = instrutor.telefone.replace(/\D/g, "");
      const linkWhats = `https://wa.me/55${telefone}`;

      html += `
        <div class="card-instrutor">
          <img src="${instrutor.foto}" alt="Foto de ${instrutor.nome}" class="foto-instrutor">
          <h3>${primeiroNome} ${segundoNome}</h3>
          <a href="${linkWhats}" target="_blank" class="btn-whatsapp">📱 WhatsApp</a>
        </div>
      `;
    });

    html += `</div>`;
    document.getElementById("resultado").innerHTML = html;
  } catch (error) {
    console.error("Erro ao buscar instrutores:", error);
    document.getElementById("resultado").innerHTML = "<p>Erro ao buscar instrutores.</p>";
  }
}

// ================= FORMULÁRIO DE INSTRUTOR =================
function carregarFormularioInstrutor() {
  const area = document.getElementById("form-area");
  area.innerHTML = `
    <div class="formulario">
  <h3>Cadastro de Instrutor</h3>
  <form id="formInstrutor" onsubmit="cadastrarInstrutor(event)">
<div class="etapa" id="etapa1">
  <label>Nome completo:</label>
  <input type="text" id="nome" required>

  <label>CPF:</label>
  <input type="text" id="cpf" maxlength="14" required>

  <!-- Campo Sexo -->
  <label>Sexo:</label>
  <select id="sexoInstrutor" required>
    <option value="">Selecione</option>
    <option value="M">Masculino</option>
    <option value="F">Feminino</option>
  </select>

  <!-- Campo Telefone corrigido -->
  <label>Telefone:</label>
  <input 
    type="tel" 
    id="telefone" 
    name="telefone" 
    placeholder="(99)91234-5678" 
    title="Formato esperado: (XX)9XXXX-XXXX">

  <button type="button" onclick="proximaEtapa(2)">Próximo</button>
</div>

    <div class="etapa" id="etapa2" style="display:none;">
      <h4>Endereço</h4>
      <label>CEP:</label>
      <input type="text" id="cep" required>
      <label>Rua:</label>
      <input type="text" id="rua" required>
      <label>Número:</label>
      <input type="text" id="numero" required>
      <label>Bairro:</label>
      <input type="text" id="bairro" required>
      <label>Cidade:</label>
      <input type="text" id="cidadeInstrutor" required>
      <label>Estado:</label>
      <input type="text" id="estadoInstrutor" required>
      <button type="button" onclick="voltarEtapa(1)">Voltar</button>
      <button type="button" onclick="proximaEtapa(3)">Próximo</button>
    </div>

    <div class="etapa" id="etapa3" style="display:none;">
      <h4>Documentos</h4>
      <label>Comprovante de residência:</label>
      <input type="file" id="comprovante" name="comprovante" required>
      <label>CNH (obrigatória):</label>
      <input type="file" id="cnh" name="cnh" required>

      <h4>Categorias que sabe ensinar:</h4>
      <div class="categorias">
        <label><input type="checkbox" name="categoria" value="A"> A</label>
        <label><input type="checkbox" name="categoria" value="B"> B</label>
        <label><input type="checkbox" name="categoria" value="C"> C</label>
        <label><input type="checkbox" name="categoria" value="D"> D</label>
        <label><input type="checkbox" name="categoria" value="E"> E</label>
      </div>

      <button type="button" onclick="voltarEtapa(2)">Voltar</button>
      <button type="submit">Enviar</button>
    </div>
  </form>
</div>
  `;

  document.getElementById("formInstrutor").addEventListener("submit", cadastrarInstrutor);
}

// Cadastro de instrutor integrado ao backend
document.getElementById("formInstrutor").addEventListener("submit", async function(event) {
  event.preventDefault();

  const categoriasSelecionadas = [];
  document.querySelectorAll('input[name="categoria"]:checked').forEach(el => {
    categoriasSelecionadas.push(el.value);
  });

  const formData = new FormData();
  formData.append("nome", document.getElementById("nome").value);
  formData.append("cpf", document.getElementById("cpf").value);
  formData.append("sexo", document.getElementById("sexoInstrutor").value);

  // 🔎 Validação do telefone
  const telefone = document.getElementById("telefone").value;
  if (!/\(\d{2}\)9\d{4}-\d{4}/.test(telefone)) {
    alert("Telefone inválido. Use o formato (99)91234-5678");
    return;
  }
  formData.append("telefone", telefone);
  formData.append("selfie", document.getElementById("selfie").files[0]);
  formData.append("endereco", document.getElementById("rua").value + ", " + document.getElementById("numero").value);
  formData.append("cidade", document.getElementById("cidadeInstrutor").value);
  formData.append("estado", document.getElementById("estadoInstrutor").selectedOptions[0].text);
  formData.append("comprovante", document.getElementById("comprovante").files[0]);
  formData.append("cnh", document.getElementById("cnh").files[0]);
  formData.append("categorias", categoriasSelecionadas.join(","));

  try {
    console.log("Disparando fetch...");
    const resposta = await fetch("https://meuinstrutor.onrender.com/instrutores", {
      method: "POST",
      body: formData
    });

    if (!resposta.ok) {
      throw new Error("Erro no servidor: " + resposta.status);
    }

    const resultado = await resposta.json();
    alert(resultado.message);
    document.getElementById("formInstrutor").reset();
    proximaEtapa(1);
  } catch (error) {
    console.error("Erro ao cadastrar instrutor:", error);
    alert("Erro ao cadastrar instrutor. Verifique se o servidor está rodando e a tabela existe.");
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