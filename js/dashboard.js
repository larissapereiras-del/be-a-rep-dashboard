/* =========================================================
   CENTRAL BE A REP
   DASHBOARD + GESTÃO DE EXCEÇÕES
========================================================= */

import {
  TARGET_BE_A_REP,
  CHAVE_EXCECOES
} from "./config.js";


import {
  limparTexto,
  normalizarTexto,
  escaparHTML,
  formatarPorcentagem
} from "./utils.js";


/* =========================================================
   ESTADO DO MÓDULO
========================================================= */

let dadosAtuais =
  null;


let pessoasOcultadas =
  carregarPessoasOcultadas();


let callbackExcecoes =
  null;


/* =========================================================
   PREENCHER DASHBOARD
========================================================= */

export function preencherDashboard(
  dados
) {

  dadosAtuais =
    dados;


  preencherMes(
    dados.mes
  );


  preencherIndicadores(
    dados
  );


  preencherMeta(
    dados
  );


  preencherSituacaoAtual(
    dados
  );


  preencherListaDeNomes();


  renderizarPessoasOcultadas();

}


/* =========================================================
   CONFIGURAR GESTÃO DE EXCEÇÕES
========================================================= */

export function configurarGestaoExcecoes(
  callback
) {

  callbackExcecoes =
    callback;


  const botaoAdicionar =
    document.getElementById(
      "botao-adicionar-excecao"
    );


  const campoNome =
    document.getElementById(
      "excecao-nome"
    );


  if (
    botaoAdicionar
  ) {

    botaoAdicionar.addEventListener(
      "click",
      adicionarPessoaOcultada
    );

  }


  if (
    campoNome
  ) {

    campoNome.addEventListener(
      "keydown",
      evento => {

        if (
          evento.key === "Enter"
        ) {

          evento.preventDefault();


          adicionarPessoaOcultada();

        }

      }
    );

  }


  renderizarPessoasOcultadas();

}


/* =========================================================
   PREENCHER INDICADORES
========================================================= */

function preencherIndicadores(
  dados
) {

  const geral =
    dados.geral;


  definirTexto(
    "resumo-hc",
    geral.hc
  );


  definirTexto(
    "resumo-realizaram",
    geral.realizaram
  );


  definirTexto(
    "resumo-processo",
    geral.processo
  );


  definirTexto(
    "resumo-nao",
    geral.naoRealizaram
  );


  definirTexto(

    "percentual-resumo-realizaram",

    formatarPorcentagem(

      geral.hc > 0

        ? geral.realizaram /
          geral.hc

        : 0

    )

  );


  definirTexto(

    "percentual-resumo-processo",

    formatarPorcentagem(

      geral.hc > 0

        ? geral.processo /
          geral.hc

        : 0

    )

  );


  definirTexto(

    "percentual-resumo-nao",

    formatarPorcentagem(

      geral.hc > 0

        ? geral.naoRealizaram /
          geral.hc

        : 0

    )

  );

}


/* =========================================================
   PREENCHER META
========================================================= */

function preencherMeta(
  dados
) {

  const geral =
    dados.geral;


  const percentual =
    geral.percentual;


  const quantidadeNecessaria =

    Math.ceil(

      geral.hc *
      TARGET_BE_A_REP

    );


  const quantidadeFaltante =

    Math.max(

      0,

      quantidadeNecessaria -
      geral.realizaram

    );


  definirTexto(

    "percentual-meta-dashboard",

    formatarPorcentagem(
      percentual
    )

  );


  definirTexto(

    "texto-progresso-meta",

    `${formatarPorcentagem(
      percentual
    )} de 90%`

  );


  definirTexto(

    "situacao-atual",

    formatarPorcentagem(
      percentual
    )

  );


  definirTexto(

    "situacao-faltam",

    quantidadeFaltante

  );


  const barra =
    document.getElementById(
      "barra-meta-preenchida"
    );


  if (
    barra
  ) {

    barra.style.width =

      Math.max(

        0,

        Math.min(
          100,
          percentual * 100
        )

      ) +
      "%";

  }


  const statusMeta =
    document.getElementById(
      "status-meta"
    );


  const mensagemMeta =
    document.getElementById(
      "mensagem-meta"
    );


  if (
    percentual >=
    TARGET_BE_A_REP
  ) {

    if (
      statusMeta
    ) {

      statusMeta.textContent =
        "🏆 META BATIDA";


      statusMeta.classList.add(
        "meta-batida"
      );

    }


    if (
      mensagemMeta
    ) {

      mensagemMeta.textContent =

        `Meta atingida com ${geral.realizaram} pessoas realizando o Be a Rep.`;

    }

  }

  else {

    if (
      statusMeta
    ) {

      statusMeta.textContent =
        "Target: 90%";


      statusMeta.classList.remove(
        "meta-batida"
      );

    }


    if (
      mensagemMeta
    ) {

      mensagemMeta.textContent =

        `Faltam ${quantidadeFaltante} pessoa${

          quantidadeFaltante === 1

            ? ""

            : "s"

        } para atingir o target.`;

    }

  }

}


/* =========================================================
   SITUAÇÃO ATUAL
========================================================= */

function preencherSituacaoAtual(
  dados
) {

  const geral =
    dados.geral;


  const quantidadeNecessaria =

    Math.ceil(

      geral.hc *
      TARGET_BE_A_REP

    );


  const quantidadeFaltante =

    Math.max(

      0,

      quantidadeNecessaria -
      geral.realizaram

    );


  if (
    geral.percentual >=
    TARGET_BE_A_REP
  ) {

    definirTexto(

      "titulo-situacao",

      "Meta do mês atingida"

    );


    definirTexto(

      "descricao-situacao",

      `O resultado alcançou ${formatarPorcentagem(
        geral.percentual
      )} de realização.`

    );

  }

  else {

    definirTexto(

      "titulo-situacao",

      "Meta em andamento"

    );


    definirTexto(

      "descricao-situacao",

      `${geral.realizaram} pessoas realizaram. Faltam ${quantidadeFaltante} para chegar aos 90%.`

    );

  }

}


/* =========================================================
   PREENCHER MÊS
========================================================= */

function preencherMes(
  mes
) {

  document
    .querySelectorAll(
      "[data-mes]"
    )
    .forEach(
      elemento => {

        elemento.textContent =
          mes ||
          "MÊS";

      }
    );

}


/* =========================================================
   PREENCHER LISTA DE NOMES
========================================================= */

function preencherListaDeNomes() {

  const datalist =
    document.getElementById(
      "lista-pessoas-excecao"
    );


  if (
    !datalist ||
    !dadosAtuais
  ) {

    return;

  }


  datalist.innerHTML =
    "";


  dadosAtuais
    .registros
    .slice()
    .sort(
      (
        pessoaA,
        pessoaB
      ) =>
        pessoaA.nome.localeCompare(
          pessoaB.nome,
          "pt-BR"
        )
    )
    .forEach(
      pessoa => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          pessoa.nome;


        option.label =

          `${pessoa.area || "SEM ÁREA"} • ${pessoa.setor || "SEM SETOR"}`;


        datalist.appendChild(
          option
        );

      }
    );

}


/* =========================================================
   ADICIONAR PESSOA OCULTADA
========================================================= */

function adicionarPessoaOcultada() {

  if (
    !dadosAtuais
  ) {

    alert(
      "Carregue os dados antes de adicionar uma exceção."
    );

    return;

  }


  const campoNome =
    document.getElementById(
      "excecao-nome"
    );


  const campoMotivo =
    document.getElementById(
      "excecao-motivo"
    );


  const nomeDigitado =
    limparTexto(

      campoNome
        ? campoNome.value
        : ""

    );


  const motivo =

    limparTexto(

      campoMotivo
        ? campoMotivo.value
        : ""

    ) ||
    "Outro";


  if (
    !nomeDigitado
  ) {

    alert(
      "Digite ou selecione o nome da pessoa."
    );

    return;

  }


  const pessoaEncontrada =

    dadosAtuais
      .registros
      .find(
        pessoa =>
          normalizarTexto(
            pessoa.nome
          ) ===
          normalizarTexto(
            nomeDigitado
          )
      );


  if (
    !pessoaEncontrada
  ) {

    alert(
      "Não encontrei esse nome na base atual."
    );

    return;

  }


  if (
    pessoaEstaOcultada(
      pessoaEncontrada.nome
    )
  ) {

    alert(
      "Essa pessoa já está ocultada das listas."
    );

    return;

  }


  pessoasOcultadas.push({

    nome:
      pessoaEncontrada.nome,

    motivo:
      motivo

  });


  salvarPessoasOcultadas();


  if (
    campoNome
  ) {

    campoNome.value =
      "";

  }


  renderizarPessoasOcultadas();


  executarCallbackExcecoes();

}


/* =========================================================
   REMOVER PESSOA OCULTADA
========================================================= */

function removerPessoaOcultada(
  nome
) {

  pessoasOcultadas =

    pessoasOcultadas
      .filter(
        pessoa =>
          normalizarTexto(
            pessoa.nome
          ) !==
          normalizarTexto(
            nome
          )
      );


  salvarPessoasOcultadas();


  renderizarPessoasOcultadas();


  executarCallbackExcecoes();

}


/* =========================================================
   RENDERIZAR PESSOAS OCULTADAS
========================================================= */

function renderizarPessoasOcultadas() {

  const container =
    document.getElementById(
      "lista-excecoes"
    );


  const contador =
    document.getElementById(
      "total-excecoes"
    );


  if (
    contador
  ) {

    contador.textContent =

      `${pessoasOcultadas.length} ocultada${

        pessoasOcultadas.length === 1

          ? ""

          : "s"

      }`;

  }


  if (
    !container
  ) {

    return;

  }


  if (
    pessoasOcultadas.length === 0
  ) {

    container.innerHTML = `

      <p class="empty-state">

        Nenhuma pessoa ocultada das listas.

      </p>

    `;


    return;

  }


  container.innerHTML =
    "";


  pessoasOcultadas
    .slice()
    .sort(
      (
        pessoaA,
        pessoaB
      ) =>
        pessoaA.nome.localeCompare(
          pessoaB.nome,
          "pt-BR"
        )
    )
    .forEach(
      pessoa => {

        const linha =
          document.createElement(
            "div"
          );


        linha.className =
          "exception-row";


        linha.innerHTML = `

          <strong>

            ${escaparHTML(
              pessoa.nome
            )}

          </strong>


          <span>

            ${escaparHTML(
              pessoa.motivo
            )}

          </span>


          <button
            type="button"
          >

            Reativar nome

          </button>

        `;


        const botao =
          linha.querySelector(
            "button"
          );


        botao.addEventListener(
          "click",
          () => {

            removerPessoaOcultada(
              pessoa.nome
            );

          }
        );


        container.appendChild(
          linha
        );

      }
    );

}


/* =========================================================
   FILTRAR LISTAS NOMINAIS

   Não altera HC, target, percentuais ou quantidades.
========================================================= */

export function filtrarPessoasOcultadas(
  lista
) {

  if (
    !Array.isArray(
      lista
    )
  ) {

    return [];

  }


  return lista.filter(
    pessoa =>
      !pessoaEstaOcultada(
        pessoa.nome
      )
  );

}


/* =========================================================
   VALIDAR PESSOA OCULTADA
========================================================= */

export function pessoaEstaOcultada(
  nome
) {

  const nomeNormalizado =
    normalizarTexto(
      nome
    );


  return pessoasOcultadas
    .some(
      pessoa =>
        normalizarTexto(
          pessoa.nome
        ) ===
        nomeNormalizado
    );

}


/* =========================================================
   RETORNAR EXCEÇÕES
========================================================= */

export function obterPessoasOcultadas() {

  return pessoasOcultadas
    .map(
      pessoa => ({
        ...pessoa
      })
    );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function carregarPessoasOcultadas() {

  try {

    const valorSalvo =
      localStorage.getItem(
        CHAVE_EXCECOES
      );


    if (
      !valorSalvo
    ) {

      return [];

    }


    const lista =
      JSON.parse(
        valorSalvo
      );


    return Array.isArray(
      lista
    )
      ? lista
      : [];

  }

  catch (
    erro
  ) {

    console.error(
      "Erro ao carregar pessoas ocultadas:",
      erro
    );


    return [];

  }

}


function salvarPessoasOcultadas() {

  try {

    localStorage.setItem(

      CHAVE_EXCECOES,

      JSON.stringify(
        pessoasOcultadas
      )

    );

  }

  catch (
    erro
  ) {

    console.error(
      "Erro ao salvar pessoas ocultadas:",
      erro
    );

  }

}


/* =========================================================
   CALLBACK
========================================================= */

function executarCallbackExcecoes() {

  if (
    typeof callbackExcecoes ===
    "function"
  ) {

    callbackExcecoes(

      obterPessoasOcultadas()

    );

  }

}


/* =========================================================
   DEFINIR TEXTO
========================================================= */

function definirTexto(
  id,
  valor
) {

  const elemento =
    document.getElementById(
      id
    );


  if (
    elemento
  ) {

    elemento.textContent =
      valor;

  }

}
