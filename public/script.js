function escolha(tipo) {
  const area = document.getElementById("form-area");
  area.innerHTML = "";

  if (tipo === "aluno") {
    area.innerHTML = `
      <h3>Buscar Instrutor</h3>
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
        <button type="submit">Buscar</button>
      </form>
      <div id="resultado"></div>
    `;

    // Carregar estados assim que o formulário do aluno for renderizado
    carregarEstados();
    document.getElementById("estado").addEventListener("change", carregarCidades);

  } else {
    area.innerHTML = `
      <h3>Cadastro de Instrutor</h3>
      <form onsubmit="cadastrarInstrutor(event)">
        <label>Nome completo:</label>
        <input type="text" id="nome" required>

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

        <h4>Documentos</h4>
        <label>Comprovante de residência:</label>
        <input type="file" id="comprovante" required>
        <label>CNH (obrigatória):</label>
        <input type="file" id="cnh" required>

        <button type="submit">Enviar</button>
      </form>
    `;
  }
}

// Cadastro de instrutor
function cadastrarInstrutor(event) {
  event.preventDefault();
  const nome = document.getElementById("nome").value;
  const cidade = document.getElementById("cidadeInstrutor").value;
  const estado = document.getElementById("estadoInstrutor").value;

  alert(`Instrutor ${nome} cadastrado com sucesso em ${cidade}/${estado}!`);
}

// Busca de instrutor
function buscarInstrutor(event) {
  event.preventDefault();
  const estado = document.getElementById("estado").selectedOptions[0].text;
  const cidade = document.getElementById("cidade").value;

  document.getElementById("resultado").innerHTML = `
    <h4>Instrutores disponíveis em ${cidade}/${estado}:</h4>
    <ul>
      <li><strong>João Pereira</strong> - 8 anos de experiência</li>
      <li><strong>Maria Silva</strong> - 10 anos de experiência</li>
    </ul>
  `;
}

// Carregar estados via IBGE
async function carregarEstados() {
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
}

// Carregar cidades via IBGE
async function carregarCidades() {
  const estadoId = document.getElementById("estado").value;
  if (!estadoId) return;

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
}