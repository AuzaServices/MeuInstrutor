document.addEventListener("DOMContentLoaded", () => {
  const tabela = document.getElementById("tabelaInstrutores");

  tabela.addEventListener("click", async (e) => {
    // Aceitar instrutor
    if (e.target.classList.contains("admitir")) {
      const id = e.target.dataset.id; // id do instrutor vindo do backend
      const resposta = await fetch(`https://meuinstrutor.onrender.com/instrutores/aceitar/${id}`, {
        method: "PUT"
      });
      const resultado = await resposta.json();
      alert(resultado.message);

      // recarregar lista
      carregarInstrutores();
    }

    // Recusar instrutor
    if (e.target.classList.contains("excluir")) {
      const id = e.target.dataset.id;
      const resposta = await fetch(`https://meuinstrutor.onrender.com/instrutores/recusar/${id}`, {
        method: "PUT"
      });
      const resultado = await resposta.json();
      alert(resultado.message);

      // recarregar lista
      carregarInstrutores();
    }
  });
});