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

// ===== FUNÇÃO PARA NORMALIZAR NOTA =====
// Converte qualquer formato para a escala 0–10.
// Retorna null quando a nota não existe ou é inválida.
function normalizarNota(valor) {
  // Se for vazio, null ou undefined, a nota ainda não foi lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Transforma em texto e troca vírgula por ponto
  const texto = String(valor).replace(",", ".");
  const numero = parseFloat(texto);

  // Se não for um número válido, retorna null
  if (isNaN(numero)) {
    return null;
  }

  // Valores entre 0 e 10 permanecem iguais
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Valores maiores que 10 e menores ou iguais a 100 são divididos por 10
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Qualquer outro valor é inválido
  return null;
}

// ===== FUNÇÃO PARA CALCULAR A MÉDIA =====
// Usa somente as notas disponíveis (não nulas). Se não houver nenhuma, retorna null.
function calcularMedia(notas) {
  const validas = notas.filter((n) => n !== null);
  if (validas.length === 0) return null;
  const soma = validas.reduce((acc, n) => acc + n, 0);
  return soma / validas.length;
}

// ===== FUNÇÃO PARA DEFINIR A SITUAÇÃO =====
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= 6.0) return "Bom desempenho";
  return "Atenção";
}

// ===== FUNÇÃO PARA FORMATAR NOTA =====
// Exibe com uma casa decimal e vírgula. Se for null, mostra "Ainda não lançada".
function formatarNota(nota) {
  if (nota === null) return "Ainda não lançada";
  return nota.toFixed(1).replace(".", ",");
}

// ===== PROCESSAR DADOS =====
// Para cada disciplina, normalizamos as notas, calculamos média, faltas e situação.
const disciplinasProcessadas = dadosBrutos.map((item) => {
  const tri1 = normalizarNota(item.tri1);
  const tri2 = normalizarNota(item.tri2);
  const tri3 = normalizarNota(item.tri3);

  const media = calcularMedia([tri1, tri2, tri3]);
  const totalFaltas = item.faltas.reduce((acc, f) => acc + f, 0);
  const situacao = definirSituacao(media);

  return {
    disciplina: item.disciplina,
    tri1,
    tri2,
    tri3,
    media,
    faltas: totalFaltas,
    situacao
  };
});

// ===== PREENCHER A TABELA =====
const corpoTabela = document.getElementById("corpo-tabela");

disciplinasProcessadas.forEach((d) => {
  const linha = document.createElement("tr");

  // Disciplina
  const tdDisciplina = document.createElement("td");
  tdDisciplina.textContent = d.disciplina;
  linha.appendChild(tdDisciplina);

  // Notas dos trimestres
  [d.tri1, d.tri2, d.tri3].forEach((nota) => {
    const td = document.createElement("td");
    td.textContent = formatarNota(nota);
    linha.appendChild(td);
  });

  // Média
  const tdMedia = document.createElement("td");
  tdMedia.textContent = d.media !== null ? d.media.toFixed(1).replace(".", ",") : "—";
  linha.appendChild(tdMedia);

  // Faltas
  const tdFaltas = document.createElement("td");
  tdFaltas.textContent = d.faltas;
  linha.appendChild(tdFaltas);

  // Situação com classe de cor
  const tdSituacao = document.createElement("td");
  tdSituacao.textContent = d.situacao;
  if (d.situacao === "Bom desempenho") tdSituacao.classList.add("situacao-bom");
  else if (d.situacao === "Atenção") tdSituacao.classList.add("situacao-atencao");
  else tdSituacao.classList.add("situacao-indisponivel");
  linha.appendChild(tdSituacao);

  corpoTabela.appendChild(linha);
});

// ===== CALCULAR CARDS DE RESUMO =====
// Média geral: média das médias disponíveis (ignora as que são null)
const mediasDisponiveis = disciplinasProcessadas
  .map((d) => d.media)
  .filter((m) => m !== null);

const mediaGeral = mediasDisponiveis.length > 0
  ? mediasDisponiveis.reduce((acc, m) => acc + m, 0) / mediasDisponiveis.length
  : null;

// Total de faltas de todas as disciplinas
const totalFaltasGeral = disciplinasProcessadas.reduce((acc, d) => acc + d.faltas, 0);

// Contagem de disciplinas por situação
const bonsDesempenhos = disciplinasProcessadas.filter((d) => d.situacao === "Bom desempenho").length;
const atencao = disciplinasProcessadas.filter((d) => d.situacao === "Atenção").length;

// Frequência demonstrativa (apenas fictícia nesta etapa)
// Este percentual é apenas demonstrativo e será tratado de outra forma no futuro.
const frequenciaDemonstrativa = 92;

// ===== PREENCHER OS CARDS =====
const containerCards = document.getElementById("cards-resumo");

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

// Card 1: Média geral
criarCard(
  "Média Geral",
  mediaGeral !== null ? mediaGeral.toFixed(1).replace(".", ",") : "—",
  "Média das disciplinas com nota"
);

// Card 2: Total de faltas
criarCard("Total de Faltas", totalFaltasGeral, "Soma de todas as disciplinas");

// Card 3: Disciplinas com bom desempenho
criarCard("Bom Desempenho", bonsDesempenhos, "Disciplinas com média ≥ 6,0");

// Card 4: Disciplinas que precisam de atenção
criarCard("Atenção", atencao, "Disciplinas com média < 6,0");

// Card 5: Frequência demonstrativa
criarCard(
  "Frequência",
  frequenciaDemonstrativa + "%",
  "Frequência adequada"
);