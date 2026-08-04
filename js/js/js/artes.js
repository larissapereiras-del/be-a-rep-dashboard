/* =========================================================
   CENTRAL BE A REP
   ARTES E GERAÇÃO DE PNG
========================================================= */

import {
  AREAS_VALIDAS,
  EXCECOES_SETOR
} from "./config.js";


import {
  escaparHTML,
  formatarPorcentagem,
  normalizarTexto,
  aguardarImagens
} from "./utils.js";


import {
  filtrarPessoasOcultadas
} from "./dashboard.js";


/* =========================================================
   ESTADO
========================================================= */

let dadosAtuais =
  null;


let arteAtual =
  "geral";


/* =========================================================
   CONFIGURAR EVENTOS DAS ARTES
========================================================= */

export function configurarArtes() {

  const botoesArte =
    document.querySelectorAll(
      "[data-arte]"
    );


  botoesArte.forEach(
    botao => {

      botao.addEventListener(
        "click",
        () => {

          const nomeArte =
            botao.dataset.arte;


          if (
            nomeArte
          ) {

            mostrarArte(
              nomeArte
            );

          }

        }
      );

    }
  );


  const botaoBaixar =
    document.getElementById(
      "baixar-png"
    );


  if (
    botaoBaixar
  ) {

    botaoBaixar.addEventListener(
      "click",
      baixarArteAtual
    );

  }

}


/* =========================================================
   PREENCHER TODAS AS ARTES
========================================================= */

export function preencherArtes(
  dados
) {

  dadosAtuais =
    dados;


  preencherArteGeral(
    dados
  );


  preencherArteProcesso(
    dados.processo
  );


  preencherArteNaoRealizaram(
    dados.naoRealizaram
  );


  preencherArteGuembaPendente(
    dados.guembaPendente
  );


  preencherArteGuembaProcessando(
    dados.guembaProcessando
  );


  mostrarArte(
    arteAtual
  );

}


/* =========================================================
   ATUALIZAR SOMENTE AS LISTAS NOMINAIS

   Utilizado após incluir ou remover uma exceção.
========================================================= */

export function atualizarListasDasArtes() {

  if (
    !dadosAtuais
  ) {

    return;

  }


  preencherArteProcesso(
    dadosAtuais.processo
  );


  preencherArteNaoRealizaram(
    dadosAtuais.naoRealizaram
  );


  preencherArteGuembaPendente(
    dadosAtuais.guembaPendente
  );


  preencherArteGuembaProcessando(
    dadosAtuais.guembaProcessando
  );

}


/* =========================================================
   ARTE GERAL

   As exceções não alteram:
   - HC
   - Quantidades
   - Percentuais
========================================================= */

function preencherArteGeral(
  dados
) {

  const geral =
    dados.geral;


  definirTexto(
    "percentual-geral",
    formatarPorcentagem(
      geral.percentual
    )
  );


  definirTexto(
    "arte-geral-realizaram",
    geral.realizaram
  );


  definirTexto(
    "arte-geral-processo",
    geral.processo
  );


  definirTexto(
    "arte-geral-nao",
    geral.naoRealizaram
  );


  definirTexto(
    "arte-geral-hc",
    geral.hc
  );


  definirTexto(

    "arte-percentual-realizaram",

    formatarPorcentagem(

      geral.hc > 0

        ? geral.realizaram /
          geral.hc

        : 0

    )

  );


  definirTexto(

    "arte-percentual-processo",

    formatarPorcentagem(

      geral.hc > 0

        ? geral.processo /
          geral.hc

        : 0

    )

  );


  definirTexto(

    "arte-percentual-nao",

    formatarPorcentagem(

      geral.hc > 0

        ? geral.naoRealizaram /
          geral.hc

        : 0

    )

  );


  preencherResultadoPorArea(
    dados
  );

}


/* =========================================================
   RESULTADO POR ÁREA
========================================================= */

function preencherResultadoPorArea(
  dados
) {

  const container =
    document.getElementById(
      "lista-areas"
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";


  const areasOrdenadas =

    AREAS_VALIDAS
      .slice()
      .sort(
        (
          areaA,
          areaB
        ) => {

          const percentualA =

            Number(

              dados
                .areas
                ?.[areaA]
                ?.percentual

            ) || 0;


          const percentualB =

            Number(

              dados
                .areas
                ?.[areaB]
                ?.percentual

            ) || 0;


          return (
            percentualB -
            percentualA
          );

        }
      );


  areasOrdenadas.forEach(
    nomeArea => {

      const area =
        dados.areas[
          nomeArea
        ];


      if (
        !area
      ) {

        return;

      }


      const linha =
        document.createElement(
          "div"
        );


      linha.className =
        "area-row";


      linha.innerHTML = `

        <span>
          ${escaparHTML(
            nomeArea
          )}
        </span>

        <span>
          ${area.realizaram}
        </span>

        <span>
          ${area.processo}
        </span>

        <span>
          ${area.naoRealizaram}
        </span>

        <span>
          ${area.hc}
        </span>

        <strong>
          ${formatarPorcentagem(
            area.percentual
          )}
        </strong>

      `;


      container.appendChild(
        linha
      );

    }
  );

}


/* =========================================================
   ARTE EM PROCESSO
========================================================= */

function preencherArteProcesso(
  listaOriginal
) {

  const pessoas =
    prepararListaNominal(
      listaOriginal,
      true
    );


  definirTexto(
    "total-processo",
    pessoas.length
  );


  montarListaComTempo(
    pessoas,
    "listas-processo"
  );

}


/* =========================================================
   ARTE NÃO REALIZARAM
========================================================= */

function preencherArteNaoRealizaram(
  listaOriginal
) {

  const pessoas =
    prepararListaNominal(
      listaOriginal,
      false
    );


  definirTexto(
    "total-nao",
    pessoas.length
  );


  montarListaSemTempo(
    pessoas,
    "listas-nao"
  );

}


/* =========================================================
   GUEMBA REALIZADO / BAR PENDENTE
========================================================= */

function preencherArteGuembaPendente(
  listaOriginal
) {

  const pessoas =
    prepararListaNominal(
      listaOriginal,
      false
    );


  definirTexto(
    "total-guemba-pendente",
    pessoas.length
  );


  montarListaSemTempo(
    pessoas,
    "listas-guemba-pendente"
  );

}


/* =========================================================
   GUEMBA REALIZADO / BAR PROCESSANDO
========================================================= */

function preencherArteGuembaProcessando(
  listaOriginal
) {

  const pessoas =
    prepararListaNominal(
      listaOriginal,
      true
    );


  definirTexto(
    "total-guemba-processando",
    pessoas.length
  );


  montarListaComTempo(
    pessoas,
    "listas-guemba-processando"
  );

}


/* =========================================================
   PREPARAR LISTA NOMINAL

   Aqui as pessoas ocultadas são retiradas somente das listas.
========================================================= */

function prepararListaNominal(
  listaOriginal,
  ordenarPorTempo
) {

  const listaFiltrada =

    filtrarPessoasOcultadas(
      listaOriginal ||
      []
    );


  const listaPreparada =

    listaFiltrada.map(
      pessoa => ({

        ...pessoa,

        setor:
          ajustarSetor(
            pessoa.nome,
            pessoa.setor
          )

      })
    );


  listaPreparada.sort(
    (
      pessoaA,
      pessoaB
    ) => {

      if (
        ordenarPorTempo &&
        pessoaB.minutos !==
        pessoaA.minutos
      ) {

        return (

          (
            pessoaB.minutos ||
            0
          ) -

          (
            pessoaA.minutos ||
            0
          )

        );

      }


      return pessoaA.nome.localeCompare(
        pessoaB.nome,
        "pt-BR"
      );

    }
  );


  return listaPreparada;

}


/* =========================================================
   AJUSTAR SETOR
========================================================= */

function ajustarSetor(
  nome,
  setor
) {

  const nomeNormalizado =
    normalizarTexto(
      nome
    );


  if (
    EXCECOES_SETOR[
      nomeNormalizado
    ]
  ) {

    return EXCECOES_SETOR[
      nomeNormalizado
    ];

  }


  return String(
    setor ||
    ""
  )
    .trim()
    .toUpperCase();

}


/* =========================================================
   QUANTIDADE DE COLUNAS
========================================================= */

function quantidadeColunas(
  total
) {

  if (
    total <= 14
  ) {

    return 1;

  }


  if (
    total <= 28
  ) {

    return 2;

  }


  return 3;

}


/* =========================================================
   DIVIDIR LISTA
========================================================= */

function dividirLista(
  lista,
  quantidade
) {

  if (
    lista.length === 0
  ) {

    return [
      []
    ];

  }


  const tamanho =

    Math.ceil(

      lista.length /
      quantidade

    );


  const partes =
    [];


  for (
    let indice = 0;
    indice < quantidade;
    indice++
  ) {

    partes.push(

      lista.slice(

        indice *
        tamanho,

        (
          indice +
          1
        ) *
        tamanho

      )

    );

  }


  return partes;

}


/* =========================================================
   LISTA COM TEMPO
========================================================= */

function montarListaComTempo(
  pessoas,
  idContainer
) {

  const container =
    document.getElementById(
      idContainer
    );


  if (
    !container
  ) {

    return;

  }


  if (
    pessoas.length === 0
  ) {

    renderizarListaVazia(
      container
    );

    return;

  }


  const colunas =
    quantidadeColunas(
      pessoas.length
    );


  container.className =

    `listas-grid colunas-${colunas}`;


  container.innerHTML =
    "";


  const partes =
    dividirLista(
      pessoas,
      colunas
    );


  partes.forEach(
    grupo => {

      if (
        grupo.length === 0
      ) {

        return;

      }


      const tabela =
        document.createElement(
          "div"
        );


      tabela.className =
        "tabela";


      let html = `

        <div
          class="
            linha-pessoa
            processo
            cabecalho-tabela
          "
        >

          <div>
            NOME
          </div>

          <div class="setor">
            SETOR
          </div>

          <div class="tempo">
            TEMPO
          </div>

        </div>

      `;


      grupo.forEach(
        pessoa => {

          html += `

            <div
              class="
                linha-pessoa
                processo
              "
            >

              <div class="nome-pessoa">

                ${escaparHTML(
                  pessoa.nome
                )}

              </div>

              <div class="setor">

                ${escaparHTML(
                  pessoa.setor
                )}

              </div>

              <div class="tempo">

                ${escaparHTML(
                  pessoa.tempo ||
                  ""
                )}

              </div>

            </div>

          `;

        }
      );


      tabela.innerHTML =
        html;


      container.appendChild(
        tabela
      );

    }
  );

}


/* =========================================================
   LISTA SEM TEMPO
========================================================= */

function montarListaSemTempo(
  pessoas,
  idContainer
) {

  const container =
    document.getElementById(
      idContainer
    );


  if (
    !container
  ) {

    return;

  }


  if (
    pessoas.length === 0
  ) {

    renderizarListaVazia(
      container
    );

    return;

  }


  const colunas =
    quantidadeColunas(
      pessoas.length
    );


  container.className =

    `listas-grid colunas-${colunas}`;


  container.innerHTML =
    "";


  const partes =
    dividirLista(
      pessoas,
      colunas
    );


  partes.forEach(
    grupo => {

      if (
        grupo.length === 0
      ) {

        return;

      }


      const tabela =
        document.createElement(
          "div"
        );


      tabela.className =
        "tabela";


      let html = `

        <div
          class="
            linha-pessoa
            nao-realizou
            cabecalho-tabela
          "
        >

          <div>
            NOME
          </div>

          <div class="setor">
            SETOR
          </div>

        </div>

      `;


      grupo.forEach(
        pessoa => {

          html += `

            <div
              class="
                linha-pessoa
                nao-realizou
              "
            >

              <div class="nome-pessoa">

                ${escaparHTML(
                  pessoa.nome
                )}

              </div>

              <div class="setor">

                ${escaparHTML(
                  pessoa.setor
                )}

              </div>

            </div>

          `;

        }
      );


      tabela.innerHTML =
        html;


      container.appendChild(
        tabela
      );

    }
  );

}


/* =========================================================
   LISTA VAZIA
========================================================= */

function renderizarListaVazia(
  container
) {

  container.className =
    "listas-grid colunas-1";


  container.innerHTML = `

    <div class="tabela">

      <div
        class="
          linha-pessoa
          nao-realizou
        "
        style="
          display: flex;
          justify-content: center;
          text-align: center;
          min-height: 70px;
        "
      >

        Nenhuma pessoa para exibir.

      </div>

    </div>

  `;

}


/* =========================================================
   MOSTRAR ARTE
========================================================= */

export function mostrarArte(
  nome
) {

  arteAtual =
    nome;


  document
    .querySelectorAll(
      ".arte"
    )
    .forEach(
      arte => {

        arte.classList.remove(
          "ativa"
        );

      }
    );


  document
    .querySelectorAll(
      "[data-arte]"
    )
    .forEach(
      botao => {

        botao.classList.toggle(

          "ativo",

          botao.dataset.arte ===
          nome

        );

      }
    );


  const arte =
    document.getElementById(
      `arte-${nome}`
    );


  if (
    arte
  ) {

    arte.classList.add(
      "ativa"
    );

  }

}


/* =========================================================
   BAIXAR PNG
========================================================= */

async function baixarArteAtual() {

  const arte =
    document.getElementById(
      `arte-${arteAtual}`
    );


  const botao =
    document.getElementById(
      "baixar-png"
    );


  if (
    !arte
  ) {

    alert(
      "Arte não encontrada."
    );

    return;

  }


  if (
    typeof html2canvas ===
    "undefined"
  ) {

    alert(
      "Não foi possível carregar o gerador de PNG."
    );

    return;

  }


  const textoOriginal =

    botao
      ? botao.textContent
      : "";


  try {

    if (
      botao
    ) {

      botao.disabled =
        true;


      botao.textContent =
        "⏳ Gerando PNG...";

    }


    await aguardarImagens(
      arte
    );


    const canvas =

      await html2canvas(
        arte,
        {

          backgroundColor:
            "#ffffff",

          scale:
            2,

          useCORS:
            true,

          logging:
            false,

          scrollX:
            0,

          scrollY:
            0

        }
      );


    const nomeBase =

      arte.dataset.nomeArquivo ||
      "Be-a-Rep";


    const mes =

      dadosAtuais
        ?.mes ||
      "";


    const nomeArquivo =

      nomeBase +

      (
        mes

          ? "-" +
            mes.replace(
              /\s+/g,
              "-"
            )

          : ""
      ) +

      ".png";


    const link =
      document.createElement(
        "a"
      );


    link.download =
      nomeArquivo;


    link.href =
      canvas.toDataURL(
        "image/png"
      );


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();

  }

  catch (
    erro
  ) {

    console.error(
      "Erro ao gerar PNG:",
      erro
    );


    alert(

      "Não foi possível gerar o PNG.\n\n" +

      erro.message

    );

  }

  finally {

    if (
      botao
    ) {

      botao.disabled =
        false;


      botao.textContent =

        textoOriginal ||
        "📥 Baixar PNG";

    }

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
