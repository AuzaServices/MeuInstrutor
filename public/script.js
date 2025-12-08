// Renderiza o formulário de aluno
function carregarFormularioAluno() {
  const area = document.getElementById("form-area");
  area.innerHTML = `
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
            <option value="ACC">ACC</option>
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
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Sem preferencia">Sem preferência</option>
          </select>
        </div>
      </div>

      <button type="submit">Buscar</button>
    </form>
    <div id="resultado"></div>
  `;

  carregarEstados();
  document.getElementById("estado").addEventListener("change", carregarCidades);
}

// Busca de instrutor (única versão, com filtros extras)
function buscarInstrutor(event) {
  event.preventDefault();
  const estado = document.getElementById("estado").selectedOptions[0].text;
  const cidade = document.getElementById("cidade").value;
  const categoria = document.getElementById("categoria").value;
  const sexo = document.getElementById("sexo").value;

  document.getElementById("resultado").innerHTML = `
    <h4>Instrutores disponíveis em ${cidade}/${estado}:</h4>
    <p>Filtro aplicado: Categoria ${categoria}, Sexo ${sexo}</p>
    <ul>
      <li><strong>João Pereira</strong> - Categoria B, 8 anos de experiência</li>
      <li><strong>Maria Silva</strong> - Categoria D, 10 anos de experiência</li>
    </ul>
  `;
}

// Renderiza o formulário de instrutor (em etapas)
function carregarFormularioInstrutor() {
  const area = document.getElementById("form-area");
  area.innerHTML = `
    <h3>Cadastro de Instrutor</h3>
    <form id="formInstrutor">
      <div class="etapa" id="etapa1">
        <label>Nome completo:</label>
        <input type="text" id="nome" required>
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
        <input type="file" id="comprovante" required>
        <label>CNH (obrigatória):</label>
        <input type="file" id="cnh" required>
        <button type="button" onclick="voltarEtapa(2)">Voltar</button>
        <button type="submit">Enviar</button>
      </div>
    </form>
  `;

  // adiciona listener só depois que o form existe
  document.getElementById("formInstrutor").addEventListener("submit", cadastrarInstrutor);
}

// Cadastro de instrutor
function cadastrarInstrutor(event) {
  event.preventDefault();
  const nome = document.getElementById("nome").value;
  const cidade = document.getElementById("cidadeInstrutor").value;
  const estado = document.getElementById("estadoInstrutor").value;
  alert(`Instrutor ${nome} cadastrado com sucesso em ${cidade}/${estado}!`);
}

// Navegação entre etapas com rolagem suave
function proximaEtapa(n) {
  document.querySelectorAll('.etapa').forEach(e => e.style.display = 'none');
  document.getElementById('etapa' + n).style.display = 'block';
  document.querySelector('.formulario').scrollIntoView({ behavior: 'smooth' });
}

function voltarEtapa(n) {
  document.querySelectorAll('.etapa').forEach(e => e.style.display = 'none');
  document.getElementById('etapa' + n).style.display = 'block';
  document.querySelector('.formulario').scrollIntoView({ behavior: 'smooth' });
}

// Carregar estados via API IBGE
async function carregarEstados() {
  try {
    const resp = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const estados = await resp.json();
    const selectEstado = document.getElementById("estado");

    selectEstado.innerHTML = "<option value=''>Selecione o estado</option>";

    estados.sort((a, b) => a.nome.localeCompare(b.nome));

    estados.forEach(estado => {
      const option = document.createElement("option");
      option.value = estado.id;
      option.textContent = estado.nome;
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

// Inicializa com o formulário de aluno
document.addEventListener("DOMContentLoaded", () => {
  carregarFormularioAluno();

  const btnInstrutor = document.querySelector(".btn.amarelo");
  if (btnInstrutor) {
    btnInstrutor.addEventListener("click", carregarFormularioInstrutor);
  }
});