// ===== CONFIGURAÇÃO FIXA DO ALUNO =====
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 30,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// ===== DADOS BRUTOS (exatamente como fornecidos) =====
// Array de objetos: cada objeto é uma disciplina com suas notas e faltas
const dadosBrutos = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// ===== ESTADO DA SESSÃO =====
// O PIN fica somente em memória, durante a sessão.
let pinDaSessao = null;
let dadosAtuais = null; // dados exibidos no momento (locais ou vindos da API)
let modoEdicao = false;

// ===== REFERÊNCIAS DO DOM =====
const elAcessoPin = document.getElementById("acesso-pin");
const elAreaBoletim = document.getElementById("area-boletim");
const elCampoPin = document.getElementById("campo-pin");
const elBotaoEntrar = document.getElementById("botao-entrar");
const elMensagemAcesso = document.getElementById("mensagem-acesso");
const elBotaoAlterar = document.getElementById("botao-alterar");
const elBotaoSalvar = document.getElementById("botao-salvar");
const elBotaoCancelar = document.getElementById("botao-cancelar");
const elMensagemEdicao = document.getElementById("mensagem-edicao");
const corpoTabela = document.getElementById("corpo-tabela");
const containerCards = document.getElementById("cards-resumo");

// ===== FUNÇÃO PARA NORMALIZAR NOTA =====
// Converte qualquer formato para a escala 0–10.
// Retorna null quando a nota não existe ou é inválida.
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const texto = String(valor).replace(",", ".");
  const numero = parseFloat(texto);

  if (isNaN(numero)) {
    return null;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  return null;
}

// ===== VALIDAÇÃO DE NOTA DIGITADA (modo edição) =====
// Aceita somente 0–10 (ponto ou vírgula) ou vazio (vira null).
// Retorna { ok: true, valor } ou { ok: false, erro }.
function validarNotaDigitada(texto) {
  const limpo = String(texto).trim();
  if (limpo === "") {
    return { ok: true, valor: null };
  }
  const numero = Number(limpo.replace(",", "."));
  if (isNaN(numero)) {
    return { ok: false, erro: "Nota inválida" };
  }
  if (numero < 0 || numero > 10) {
    return { ok: false, erro: "Nota deve estar entre 0 e 10" };
  }
  return { ok: true, valor: numero };
}

// ===== VALIDAÇÃO DE FALTA DIGITADA =====
// Aceita somente inteiro >= 0.
function validarFaltaDigitada(texto) {
  const limpo = String(texto).trim();
  if (limpo === "") {
    return { ok: false, erro: "Falta não pode ficar vazia" };
  }
  if (!/^\d+$/.test(limpo)) {
    return { ok: false, erro: "Falta deve ser inteiro >= 0" };
  }
  return { ok: true, valor: parseInt(limpo, 10) };
}

// ===== FUNÇÕES DE CÁLCULO =====
function calcularMedia(notas) {
  const validas = notas.filter((n) => n !== null);
  if (validas.length === 0) return null;
  const soma = validas.reduce((acc, n) => acc + n, 0);
  return soma / validas.length;
}

function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= 6.0) return "Bom desempenho";
  return "Atenção";
}

function formatarNota(nota) {
  if (nota === null) return "Ainda não lançada";
  return nota.toFixed(1).replace(".", ",");
}

// ===== PROCESSAR DADOS =====
// Se já estiverem normalizados (vindos da API em formato 0-10), mantém.
// Caso contrário, usa normalizarNota (regra para dados antigos locais).
function processarDisciplina(item) {
  const tri1 = normalizarNota(item.tri1);
  const tri2 = normalizarNota(item.tri2);
  const tri3 = normalizarNota(item.tri3);

  const faltas = Array.isArray(item.faltas)
    ? item.faltas
    : [0, 0, 0];

  const f1 = Number(faltas[0]) || 0;
  const f2 = Number(faltas[1]) || 0;
  const f3 = Number(faltas[2]) || 0;

  const media = calcularMedia([tri1, tri2, tri3]);
  const totalFaltas = f1 + f2 + f3;
  const situacao = definirSituacao(media);

  return {
    disciplina: String(item.disciplina || ""),
    tri1,
    tri2,
    tri3,
    faltas: [f1, f2, f3],
    totalFaltas,
    media,
    situacao
  };
}

function processarTodos(itens) {
  return itens.map(processarDisciplina);
}

// ===== CARREGAR DADOS LOCAIS =====
function carregarDadosLocais() {
  return processarTodos(dadosBrutos);
}

// ===== RENDERIZAÇÃO DOS CARDS =====
function limparCards() {
  containerCards.innerHTML = "";
}

function criarCard(titulo, valor, detalhe) {
  const card = document.createElement("div");
  card.className = "card";

  const h3 = document.createElement("h3");
  h3.textContent = titulo;
  card.appendChild(h3);

  const divValor = document.createElement("div");
  divValor.className = "valor";
  divValor.textContent = valor;
  card.appendChild(divValor);

  if (detalhe) {
    const divDetalhe = document.createElement("div");
    divDetalhe.className = "detalhe";
    divDetalhe.textContent = detalhe;
    card.appendChild(divDetalhe);
  }

  containerCards.appendChild(card);
}

function renderizarCards(disciplinas) {
  limparCards();

  const mediasDisponiveis = disciplinas
    .map((d) => d.media)
    .filter((m) => m !== null);

  const mediaGeral = mediasDisponiveis.length > 0
    ? mediasDisponiveis.reduce((acc, m) => acc + m, 0) / mediasDisponiveis.length
    : null;

  const totalFaltasGeral = disciplinas.reduce((acc, d) => acc + d.totalFaltas, 0);

  const bonsDesempenhos = disciplinas.filter((d) => d.situacao === "Bom desempenho").length;
  const atencao = disciplinas.filter((d) => d.situacao === "Atenção").length;

  // Frequência demonstrativa (apenas fictícia nesta etapa)
  // Este percentual é apenas demonstrativo e será tratado de outra forma no futuro.
  const frequenciaDemonstrativa = 92;

  criarCard(
    "Média Geral",
    mediaGeral !== null ? mediaGeral.toFixed(1).replace(".", ",") : "—",
    "Média das disciplinas com nota"
  );
  criarCard("Total de Faltas", totalFaltasGeral, "Soma de todas as disciplinas");
  criarCard("Bom Desempenho", bonsDesempenhos, "Disciplinas com média ≥ 6,0");
  criarCard("Atenção", atencao, "Disciplinas com média < 6,0");
  criarCard("Frequência", frequenciaDemonstrativa + "%", "Frequência adequada");
}

// ===== RENDERIZAÇÃO DA TABELA =====
function limparTabela() {
  corpoTabela.innerHTML = "";
}

function criarCelulaTexto(texto, classe) {
  const td = document.createElement("td");
  td.textContent = texto;
  if (classe) td.classList.add(classe);
  return td;
}

function renderizarTabela(disciplinas) {
  limparTabela();

  disciplinas.forEach((d, indice) => {
    const linha = document.createElement("tr");

    // Disciplina
    linha.appendChild(criarCelulaTexto(d.disciplina));

    // Notas dos trimestres (com edição, se estiver no modo edição)
    [d.tri1, d.tri2, d.tri3].forEach((nota, i) => {
      const td = document.createElement("td");
      if (modoEdicao) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "campo-nota";
        input.dataset.indice = indice;
        input.dataset.trimestre = i;
        input.value = nota !== null ? nota.toFixed(1).replace(".", ",") : "";
        input.placeholder = "—";
        td.appendChild(input);
      } else {
        td.textContent = formatarNota(nota);
      }
      linha.appendChild(td);
    });

    // Média
    linha.appendChild(criarCelulaTexto(
      d.media !== null ? d.media.toFixed(1).replace(".", ",") : "—"
    ));

    // Faltas (edições por trimestre no modo edição; fora dele, total)
    if (modoEdicao) {
      const td = document.createElement("td");
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.gap = "4px";
      wrapper.style.justifyContent = "center";
      d.faltas.forEach((f, i) => {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "campo-falta";
        input.style.width = "44px";
        input.dataset.indice = indice;
        input.dataset.trimestre = i;
        input.value = String(f);
        wrapper.appendChild(input);
      });
      td.appendChild(wrapper);
      linha.appendChild(td);
    } else {
      linha.appendChild(criarCelulaTexto(String(d.totalFaltas)));
    }

    // Situação
    const tdSituacao = document.createElement("td");
    tdSituacao.textContent = d.situacao;
    if (d.situacao === "Bom desempenho") tdSituacao.classList.add("situacao-bom");
    else if (d.situacao === "Atenção") tdSituacao.classList.add("situacao-atencao");
    else tdSituacao.classList.add("situacao-indisponivel");
    linha.appendChild(tdSituacao);

    corpoTabela.appendChild(linha);
  });
}

function renderizarTudo(disciplinas) {
  renderizarCards(disciplinas);
  renderizarTabela(disciplinas);
  atualizarGraficos();
}

// ===== MENSAGENS =====
function mostrarMensagemAcesso(texto, tipo) {
  elMensagemAcesso.textContent = texto;
  elMensagemAcesso.className = "mensagem" + (tipo ? " " + tipo : "");
}

function mostrarMensagemEdicao(texto, tipo) {
  elMensagemEdicao.textContent = texto;
  elMensagemEdicao.className = "mensagem" + (tipo ? " " + tipo : "");
}

// ===== LOGIN =====
async function entrar() {
  const pin = elCampoPin.value.trim();

  if (!pin) {
    mostrarMensagemAcesso("Digite o PIN.", "erro");
    return;
  }

  elBotaoEntrar.disabled = true;
  mostrarMensagemAcesso("Conectando...", "info");

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pin
      })
    });

    if (resposta.status === 401) {
      mostrarMensagemAcesso("Turma, chamada ou PIN inválidos.", "erro");
      elBotaoEntrar.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      mostrarMensagemAcesso("Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      elBotaoEntrar.disabled = false;
      return;
    }

    if (!resposta.ok) {
      mostrarMensagemAcesso("Não foi possível conectar ao servidor. Tente novamente.", "erro");
      elBotaoEntrar.disabled = false;
      return;
    }

    const resultado = await resposta.json();
    pinDaSessao = pin;

    // Limpa o campo do PIN após o login bem-sucedido
    elCampoPin.value = "";

    if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      // Dados da API têm prioridade sobre os dados locais
      dadosAtuais = processarTodos(resultado.dados.disciplinas);
    } else {
      // Sem dados salvos: usa os dados locais existentes
      dadosAtuais = carregarDadosLocais();
    }

    // Troca de tela
    elAcessoPin.hidden = true;
    elAreaBoletim.hidden = false;

    renderizarTudo(dadosAtuais);
    elBotaoEntrar.disabled = false;
  } catch (erro) {
    mostrarMensagemAcesso("Não foi possível conectar ao servidor. Tente novamente.", "erro");
    elBotaoEntrar.disabled = false;
  }
}

// ===== MODO EDIÇÃO =====
function entrarModoEdicao() {
  modoEdicao = true;
  elBotaoAlterar.hidden = true;
  elBotaoSalvar.hidden = false;
  elBotaoCancelar.hidden = false;
  mostrarMensagemEdicao("");
  renderizarTabela(dadosAtuais);
}

function cancelarEdicao() {
  modoEdicao = false;
  elBotaoAlterar.hidden = false;
  elBotaoSalvar.hidden = true;
  elBotaoCancelar.hidden = true;
  mostrarMensagemEdicao("");
  // Descarta alterações não salvas: re-renderiza a partir dos dados atuais
  renderizarTabela(dadosAtuais);
}

// ===== SALVAR ALTERAÇÕES =====
async function salvarAlteracoes() {
  // Lê os inputs e valida
  const inputsNota = document.querySelectorAll(".campo-nota");
  const inputsFalta = document.querySelectorAll(".campo-falta");

  // Cópia de trabalho para aplicar valores e validar
  const novos = dadosAtuais.map((d) => ({
    disciplina: d.disciplina,
    tri1: d.tri1,
    tri2: d.tri2,
    tri3: d.tri3,
    faltas: d.faltas.slice()
  }));

  let temErro = false;

  // Remove marcações antigas
  document.querySelectorAll(".campo-invalido").forEach((el) => el.classList.remove("campo-invalido"));

  inputsNota.forEach((input) => {
    const indice = Number(input.dataset.indice);
    const trimestre = Number(input.dataset.trimestre);
    const resultado = validarNotaDigitada(input.value);

    if (!resultado.ok) {
      temErro = true;
      input.classList.add("campo-invalido");
      return;
    }

    const chave = "tri" + (trimestre + 1);
    novos[indice][chave] = resultado.valor;
  });

  inputsFalta.forEach((input) => {
    const indice = Number(input.dataset.indice);
    const trimestre = Number(input.dataset.trimestre);
    const resultado = validarFaltaDigitada(input.value);

    if (!resultado.ok) {
      temErro = true;
      input.classList.add("campo-invalido");
      return;
    }

    novos[indice].faltas[trimestre] = resultado.valor;
  });

  if (temErro) {
    mostrarMensagemEdicao("Existem campos inválidos. Corrija os campos destacados.", "erro");
    return;
  }

  // Recalcula médias/faltas/situação a partir dos valores editados
  const processados = novos.map((d) => {
    const media = calcularMedia([d.tri1, d.tri2, d.tri3]);
    const totalFaltas = d.faltas.reduce((acc, f) => acc + f, 0);
    return {
      disciplina: d.disciplina,
      tri1: d.tri1,
      tri2: d.tri2,
      tri3: d.tri3,
      faltas: d.faltas,
      totalFaltas,
      media,
      situacao: definirSituacao(media)
    };
  });

  elBotaoSalvar.disabled = true;
  mostrarMensagemEdicao("Salvando...", "info");

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/salvar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDaSessao,
        dados: {
          disciplinas: processados.map((d) => ({
            disciplina: d.disciplina,
            tri1: d.tri1,
            tri2: d.tri2,
            tri3: d.tri3,
            faltas: d.faltas
          }))
        }
      })
    });

    if (!resposta.ok) {
      mostrarMensagemEdicao("Não foi possível salvar. Tente novamente.", "erro");
      elBotaoSalvar.disabled = false;
      return;
    }

    // Atualiza o estado local com os dados salvos
    dadosAtuais = processados;
    modoEdicao = false;
    elBotaoAlterar.hidden = false;
    elBotaoSalvar.hidden = true;
    elBotaoSalvar.disabled = false;
    elBotaoCancelar.hidden = true;

    renderizarTudo(dadosAtuais);
    mostrarMensagemEdicao("Dados salvos com sucesso.", "sucesso");
  } catch (erro) {
    mostrarMensagemEdicao("Não foi possível salvar. Tente novamente.", "erro");
    elBotaoSalvar.disabled = false;
  }
}

// ===== EVENTOS =====
elBotaoEntrar.addEventListener("click", entrar);
elCampoPin.addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrar();
});

elBotaoAlterar.addEventListener("click", entrarModoEdicao);
elBotaoCancelar.addEventListener("click", cancelarEdicao);
elBotaoSalvar.addEventListener("click", salvarAlteracoes);

// ===== GRÁFICOS (somente leitura dos dadosAtuais) =====
// Instâncias do Chart.js (para poder destruir antes de recriar)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Referência interna de risco (NÃO exibir na interface)
// Usada apenas para avaliar a situação geral de faltas.
const REFERENCIA_FALTAS = 350;

// Paleta coerente com o tema do projeto
const CORES_GRAFICOS = {
  azulPrincipal: "#6EC6FF",
  azulEscuro: "#1E88E5",
  amareloClaro: "#FFF9C4",
  verdeMenta: "#B2DFDB",
  texto: "#333333",
  grade: "rgba(0, 0, 0, 0.08)",
  perigo: "#C62828"
};

// Formata número para exibição em tooltip (1 casa decimal com vírgula)
function formatarNumeroBR(valor) {
  if (valor === null || valor === undefined) return "—";
  return Number(valor).toFixed(1).replace(".", ",");
}

// GRÁFICO 1 — Média por disciplina (barras horizontais)
function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas) return;

  if (graficoMedias) {
    graficoMedias.destroy();
    graficoMedias = null;
  }

  const disciplinas = dadosAtuais || [];

  const labels = disciplinas.map((d) => d.disciplina);
  // Se não houver nota, mantém null (não vira zero)
  const valores = disciplinas.map((d) => (d.media !== null ? d.media : null));

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Média",
        data: valores,
        backgroundColor: CORES_GRAFICOS.azulPrincipal,
        borderColor: CORES_GRAFICOS.azulEscuro,
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { color: CORES_GRAFICOS.texto },
          grid: { color: CORES_GRAFICOS.grade }
        },
        y: {
          ticks: { color: CORES_GRAFICOS.texto, autoSkip: false },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.x;
              return v === null ? "Sem nota" : "Média: " + formatarNumeroBR(v);
            }
          }
        }
      }
    }
  });
}

// GRÁFICO 2 — Evolução da média geral (linha)
function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas) return;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
    graficoEvolucao = null;
  }

  const disciplinas = dadosAtuais || [];

  // Só entram notas válidas (não nulas) em cada trimestre
  const coletarValidos = (chave) =>
    disciplinas
      .map((d) => d[chave])
      .filter((n) => n !== null && n !== undefined);

  const calcularMediaOuNull = (lista) => {
    if (lista.length === 0) return null;
    return lista.reduce((acc, n) => acc + n, 0) / lista.length;
  };

  const media1 = calcularMediaOuNull(coletarValidos("tri1"));
  const media2 = calcularMediaOuNull(coletarValidos("tri2"));
  const media3 = calcularMediaOuNull(coletarValidos("tri3"));

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média geral",
        data: [media1, media2, media3],
        borderColor: CORES_GRAFICOS.azulEscuro,
        backgroundColor: "rgba(110, 198, 255, 0.25)",
        pointBackgroundColor: CORES_GRAFICOS.azulEscuro,
        pointRadius: 5,
        tension: 0.3,
        spanGaps: true,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { color: CORES_GRAFICOS.texto },
          grid: { color: CORES_GRAFICOS.grade }
        },
        x: {
          ticks: { color: CORES_GRAFICOS.texto },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              return v === null ? "Sem nota" : "Média: " + formatarNumeroBR(v);
            }
          }
        }
      }
    }
  });
}

// GRÁFICO 3 — Faltas por trimestre (barras)
function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas) return;

  if (graficoFaltas) {
    graficoFaltas.destroy();
    graficoFaltas = null;
  }

  const disciplinas = dadosAtuais || [];

  // Soma as faltas de cada trimestre (posições 0, 1, 2 do array)
  let f1 = 0, f2 = 0, f3 = 0;
  disciplinas.forEach((d) => {
    if (Array.isArray(d.faltas)) {
      f1 += Number(d.faltas[0]) || 0;
      f2 += Number(d.faltas[1]) || 0;
      f3 += Number(d.faltas[2]) || 0;
    }
  });

  const total = f1 + f2 + f3;

  // Avaliação interna de risco (referência NÃO aparece na interface)
  const emPerigo = total >= REFERENCIA_FALTAS;

  // Atualiza o badge "Perigo" e o destaque do card
  const badge = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("card-grafico-faltas");
  if (badge) badge.hidden = !emPerigo;
  if (cardFaltas) cardFaltas.classList.toggle("critico", emPerigo);

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: [f1, f2, f3],
        backgroundColor: [
          CORES_GRAFICOS.azulPrincipal,
          CORES_GRAFICOS.verdeMenta,
          CORES_GRAFICOS.amareloClaro
        ],
        borderColor: [
          CORES_GRAFICOS.azulEscuro,
          CORES_GRAFICOS.azulEscuro,
          CORES_GRAFICOS.azulEscuro
        ],
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: CORES_GRAFICOS.texto, precision: 0 },
          grid: { color: CORES_GRAFICOS.grade }
        },
        x: {
          ticks: { color: CORES_GRAFICOS.texto },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.parsed.y + " faltas"
          }
        }
      }
    }
  });
}

// Atualiza os três gráficos de uma vez
function atualizarGraficos() {
  // Não desenha antes do login (dadosAtuais ainda é null)
  if (!Array.isArray(dadosAtuais) || dadosAtuais.length === 0) return;
  // Só faz sentido desenhar quando a área do boletim está visível
  if (!elAreaBoletim || elAreaBoletim.hidden) return;

  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}