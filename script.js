console.log("✅ NOVO SCRIPT.JS CARREGADO");
/* =========================================================
   BE A REP DASHBOARD
   CARREGAMENTO AUTOMÁTICO + BACKUP MANUAL
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const API_DADOS =
  "/api/dados";


const AREAS_VALIDAS = [
  "Outbound",
  "Inbound",
  "OPEX",
  "ICQA"
];


let dadosProcessados = null;

let arteAtual = "geral";


/* =========================================================
   ELEMENTOS
========================================================= */

const inputArquivo =
  document.getElementById(
    "arquivo-base"
  );


const statusArquivo =
  document.getElementById(
    "status-arquivo"
  );


const resumoDados =
  document.getElementById(
    "resumo-dados"
  );


const menuArtes =
  document.getElementById(
    "menu-artes"
  );


const areaArtes =
  document.getElementById(
    "area-artes"
  );


const botoesArte =
  document.querySelectorAll(
    ".botao-arte"
  );


const botaoBaixar =
  document.getElementById(
    "baixar-png"
  );


const botaoAtualizar =
  document.getElementById(
    "botao-atualizar"
  );


const textoAtualizacao =
  document.getElementById(
    "texto-atualizacao"
  );


/* =========================================================
   INICIAR SISTEMA
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await carregarDadosAutomaticos();

  }
);


/* =========================================================
   EVENTO — ATUALIZAR DADOS
========================================================= */

if (
  botaoAtualizar
) {

  botaoAtualizar.addEventListener(
    "click",
    async () => {

      await carregarDadosAutomaticos();

    }
  );

}


/* =========================================================
   EVENTO — UPLOAD MANUAL
========================================================= */

if (
  inputArquivo
) {

  inputArquivo.addEventListener(
    "change",
    async evento => {

      const arquivo =
        evento.target.files[0];


      if (
        !arquivo
      ) {

        return;

      }


      await processarArquivo(
        arquivo
      );

    }
  );

}


/* =========================================================
   EVENTOS — TROCAR ARTE
========================================================= */

botoesArte.forEach(
  botao => {

    botao.addEventListener(
      "click",
      () => {

        const nomeArte =
          botao.dataset.arte;


        mostrarArte(
          nomeArte
        );

      }
    );

  }
);


/* =========================================================
   EVENTO — BAIXAR PNG
========================================================= */

if (
  botaoBaixar
) {

  botaoBaixar.addEventListener(
    "click",
    baixarArteAtual
  );

}


/* =========================================================
   CARREGAR DADOS AUTOMATICAMENTE
========================================================= */

async function carregarDadosAutomaticos() {

  console.log("🔄 Iniciando atualização automática...");

  const textoOriginalBotao =
    botaoAtualizar
      ? botaoAtualizar.textContent
      : "";

  try {

    if (
      botaoAtualizar
    ) {

      botaoAtualizar.disabled =
        true;


      botaoAtualizar.textContent =
        "Atualizando...";

    }


    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
        "Buscando os dados mais recentes da planilha...";

    }


    atualizarStatus(
      "Conectando à base...",
      ""
    );


    /*
     * O parâmetro _ evita que o navegador
     * reaproveite uma resposta antiga.
     */

    const resposta =
      await fetch(
        `${API_DADOS}?_=${Date.now()}`,
        {

          method:
            "GET",

          headers: {

            Accept:
              "application/json"

          },

          cache:
            "no-store"

        }
      );


    if (
      !resposta.ok
    ) {

      let mensagem =
        `Erro ${resposta.status} ao consultar a base.`;


      try {

        const erroApi =
          await resposta.json();


        if (
          erroApi &&
          erroApi.erro
        ) {

          mensagem =
            erroApi.erro;

        }

      }

      catch (
        erroLeitura
      ) {

        console.warn(
          "Não foi possível ler o erro da API.",
          erroLeitura
        );

      }


      throw new Error(
        mensagem
      );

    }


    const registrosApi =
      await resposta.json();


    if (
      !Array.isArray(
        registrosApi
      )
    ) {

      throw new Error(
        "A API não retornou uma lista válida de pessoas."
      );

    }


    if (
      registrosApi.length === 0
    ) {

      throw new Error(
        "A API retornou uma base vazia."
      );

    }


    dadosProcessados =
      processarDadosApi(
        registrosApi
      );


    preencherSistema(
      dadosProcessados
    );


    exibirDashboard();


    const horario =
      new Date()
        .toLocaleTimeString(
          "pt-BR",
          {

            hour:
              "2-digit",

            minute:
              "2-digit"

          }
        );


    atualizarStatus(
      `✅ Dados atualizados automaticamente às ${horario}.`,
      "sucesso"
    );


    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
  'Dados sincronizados diretamente da planilha. Clique em "Atualizar dados" para buscar as informações mais recentes.';

    }


    mostrarArte(
      "geral"
    );

  }

  catch (
    erro
  ) {

    console.error(
      "Erro ao carregar dados automáticos:",
      erro
    );


    atualizarStatus(
      `❌ Não foi possível atualizar automaticamente: ${erro.message}`,
      "erro"
    );


    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
        "A atualização automática falhou. Use o carregamento manual como backup.";

    }


    ocultarDashboard();

  }

  finally {

    if (
      botaoAtualizar
    ) {

      botaoAtualizar.disabled =
        false;


      botaoAtualizar.textContent =
        textoOriginalBotao ||
        "Atualizar dados";

    }

  }

}


/* =========================================================
   PROCESSAR DADOS RECEBIDOS DA API

   CAMPOS DA API:
   Nombre
   Mes
   Horas Mes
   Gemba
   Status BAR
   SETOR
   ÁREA CONSOLIDADA
========================================================= */

function processarDadosApi(
  dadosApi
) {

  const registros =
    dadosApi
      .map(
        item => {

          const nome =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "Nombre",
                  "Nome"
                ]
              )
            );


          const mes =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "Mes",
                  "Mês"
                ]
              )
            );


          const tempo =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "Horas Mes",
                  "Horas Mês",
                  "Tempo"
                ]
              )
            );


          const gemba =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "Gemba"
                ]
              )
            );


          const statusBar =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "Status BAR",
                  "Status Bar"
                ]
              )
            );


          const setor =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "SETOR",
                  "Setor"
                ]
              )
            )
              .toUpperCase();


          const area =
            normalizarArea(
              obterValorObjeto(
                item,
                [
                  "ÁREA CONSOLIDADA",
                  "AREA CONSOLIDADA",
                  "Área Consolidada"
                ]
              )
            );


          if (
            !nome
          ) {

            return null;

          }


          const situacao =
            classificarSituacao(
              gemba,
              statusBar
            );


          return {

            nome:
              nome,

            mes:
              mes,

            tempo:
              tempo,

            minutos:
              converterTempoParaMinutos(
                tempo
              ),

            gemba:
              gemba,

            statusBar:
              statusBar,

            setor:
              setor,

            area:
              area,

            situacao:
              situacao

          };

        }
      )
      .filter(
        Boolean
      );


  return processarRegistros(
    registros
  );

}


/* =========================================================
   PROCESSAR ARQUIVO MANUAL
========================================================= */

async function processarArquivo(
  arquivo
) {

  try {

    atualizarStatus(
      "Lendo arquivo manual...",
      ""
    );


    const extensao =
      obterExtensao(
        arquivo.name
      );


    let linhas =
      [];


    if (
      extensao ===
      "csv"
    ) {

      linhas =
        await lerCSV(
          arquivo
        );

    }

    else if (
      extensao ===
      "xlsx" ||
      extensao ===
      "xls"
    ) {

      linhas =
        await lerExcel(
          arquivo
        );

    }

    else {

      throw new Error(
        "Formato não suportado. Use XLSX, XLS ou CSV."
      );

    }


    if (
      !linhas ||
      linhas.length === 0
    ) {

      throw new Error(
        "O arquivo está vazio."
      );

    }


    dadosProcessados =
      processarLinhasBase(
        linhas
      );


    preencherSistema(
      dadosProcessados
    );


    exibirDashboard();


    atualizarStatus(
      `✅ Arquivo carregado manualmente com sucesso: ${arquivo.name}`,
      "sucesso"
    );


    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
        "Dados carregados pelo arquivo manual.";

    }


    mostrarArte(
      "geral"
    );

  }

  catch (
    erro
  ) {

    console.error(
      erro
    );


    atualizarStatus(
      "❌ " +
      erro.message,
      "erro"
    );


    ocultarDashboard();

  }

}


/* =========================================================
   LER EXCEL
========================================================= */

async function lerExcel(
  arquivo
) {

  const buffer =
    await arquivo.arrayBuffer();


  const workbook =
    XLSX.read(
      buffer,
      {

        type:
          "array"

      }
    );


  let nomeAbaBase =
    workbook
      .SheetNames
      .find(
        nome =>
          normalizarTexto(
            nome
          ) ===
          "BASE"
      );


  if (
    !nomeAbaBase
  ) {

    nomeAbaBase =
      workbook
        .SheetNames[0];

  }


  const worksheet =
    workbook
      .Sheets[
        nomeAbaBase
      ];


  return XLSX.utils
    .sheet_to_json(
      worksheet,
      {

        header:
          1,

        defval:
          "",

        raw:
          false

      }
    );

}


/* =========================================================
   LER CSV
========================================================= */

async function lerCSV(
  arquivo
) {

  const texto =
    await arquivo.text();


  const workbook =
    XLSX.read(
      texto,
      {

        type:
          "string"

      }
    );


  const nomeAba =
    workbook
      .SheetNames[0];


  const worksheet =
    workbook
      .Sheets[
        nomeAba
      ];


  return XLSX.utils
    .sheet_to_json(
      worksheet,
      {

        header:
          1,

        defval:
          "",

        raw:
          false

      }
    );

}


/* =========================================================
   PROCESSAR BASE DO ARQUIVO MANUAL
========================================================= */

function processarLinhasBase(
  linhas
) {

  /*
   * F = Nome
   * I = Mês
   * J = Tempo
   * K = Gemba
   * L = Status BAR
   * N = Setor
   * O = Área Consolidada
   */

  const registros =
    linhas
      .slice(
        1
      )
      .map(
        linha => {

          const nome =
            limparTexto(
              linha[5]
            );


          const mes =
            limparTexto(
              linha[8]
            );


          const tempo =
            limparTexto(
              linha[9]
            );


          const gemba =
            normalizarTexto(
              linha[10]
            );


          const statusBar =
            normalizarTexto(
              linha[11]
            );


          const setor =
            limparTexto(
              linha[13]
            )
              .toUpperCase();


          const area =
            normalizarArea(
              linha[14]
            );


          if (
            !nome
          ) {

            return null;

          }


          return {

            nome:
              nome,

            mes:
              mes,

            tempo:
              tempo,

            minutos:
              converterTempoParaMinutos(
                tempo
              ),

            gemba:
              gemba,

            statusBar:
              statusBar,

            setor:
              setor,

            area:
              area,

            situacao:
              classificarSituacao(
                gemba,
                statusBar
              )

          };

        }
      )
      .filter(
        Boolean
      );


  return processarRegistros(
    registros
  );

}


/* =========================================================
   PROCESSAMENTO CENTRAL
========================================================= */

function processarRegistros(
  registros
) {

  if (
    registros.length === 0
  ) {

    throw new Error(
      "Nenhuma pessoa válida foi encontrada na BASE."
    );

  }


  const mes =
    obterMesPredominante(
      registros
    );


  const areas =
    criarEstruturaAreas();


  const processo =
    [];


  const naoRealizaram =
    [];


  registros.forEach(
    pessoa => {

      if (
        !AREAS_VALIDAS.includes(
          pessoa.area
        )
      ) {

        return;

      }


      const dadosArea =
        areas[
          pessoa.area
        ];


      dadosArea.hc++;


      if (
        pessoa.situacao ===
        "REALIZOU"
      ) {

        dadosArea.realizaram++;

      }

      else if (
        pessoa.situacao ===
        "EM_PROCESSO"
      ) {

        dadosArea.processo++;


        processo.push({

          nome:
            pessoa.nome,

          setor:
            ajustarSetorNaArte(
              pessoa.nome,
              pessoa.setor
            ),

          tempo:
            pessoa.tempo,

          minutos:
            pessoa.minutos,

          area:
            pessoa.area

        });

      }

      else {

        dadosArea.naoRealizaram++;


        naoRealizaram.push({

          nome:
            pessoa.nome,

          setor:
            ajustarSetorNaArte(
              pessoa.nome,
              pessoa.setor
            ),

          area:
            pessoa.area

        });

      }

    }
  );


  AREAS_VALIDAS.forEach(
    area => {

      const dados =
        areas[
          area
        ];


      dados.percentual =

        dados.hc > 0

          ? dados.realizaram /
            dados.hc

          : 0;

    }
  );


  /*
   * Em processo:
   * maior tempo para menor tempo.
   */

  processo.sort(
    (
      a,
      b
    ) => {

      if (
        b.minutos !==
        a.minutos
      ) {

        return (
          b.minutos -
          a.minutos
        );

      }


      return a.nome.localeCompare(
        b.nome,
        "pt-BR"
      );

    }
  );


  /*
   * Não realizaram:
   * ordem alfabética.
   */

  naoRealizaram.sort(
    (
      a,
      b
    ) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
  );


  const geral =
    calcularGeral(
      areas
    );


  areas.Geral =
    geral;


  return {

    mes:
      mes,

    areas:
      areas,

    geral:
      geral,

    processo:
      processo,

    naoRealizaram:
      naoRealizaram

  };

}


/* =========================================================
   CLASSIFICAR SITUAÇÃO
========================================================= */

function classificarSituacao(
  valorK,
  valorL
) {

  const k =
    normalizarTexto(
      valorK
    );


  const l =
    normalizarTexto(
      valorL
    );


  if (
    k === "HECHO" ||
    l === "HECHO"
  ) {

    return "REALIZOU";

  }


  if (
    k === "EN PROCESO" ||
    l === "EN PROCESO"
  ) {

    return "EM_PROCESSO";

  }


  return "NAO_REALIZOU";

}


/* =========================================================
   CRIAR ESTRUTURA DE ÁREAS
========================================================= */

function criarEstruturaAreas() {

  return {

    Outbound: {

      hc:
        0,

      realizaram:
        0,

      processo:
        0,

      naoRealizaram:
        0,

      percentual:
        0

    },


    Inbound: {

      hc:
        0,

      realizaram:
        0,

      processo:
        0,

      naoRealizaram:
        0,

      percentual:
        0

    },


    OPEX: {

      hc:
        0,

      realizaram:
        0,

      processo:
        0,

      naoRealizaram:
        0,

      percentual:
        0

    },


    ICQA: {

      hc:
        0,

      realizaram:
        0,

      processo:
        0,

      naoRealizaram:
        0,

      percentual:
        0

    }

  };

}


/* =========================================================
   NORMALIZAR ÁREA
========================================================= */

function normalizarArea(
  valor
) {

  const texto =
    normalizarTexto(
      valor
    );


  if (
    texto ===
    "OUTBOUND"
  ) {

    return "Outbound";

  }


  if (
    texto ===
    "INBOUND"
  ) {

    return "Inbound";

  }


  if (
    texto ===
    "OPEX"
  ) {

    return "OPEX";

  }


  if (
    texto ===
    "ICQA"
  ) {

    return "ICQA";

  }


  return "";

}


/* =========================================================
   CALCULAR GERAL
========================================================= */

function calcularGeral(
  areas
) {

  let hc =
    0;


  let realizaram =
    0;


  let processo =
    0;


  let naoRealizaram =
    0;


  AREAS_VALIDAS.forEach(
    area => {

      const dados =
        areas[
          area
        ];


      hc +=
        dados.hc;


      realizaram +=
        dados.realizaram;


      processo +=
        dados.processo;


      naoRealizaram +=
        dados.naoRealizaram;

    }
  );


  return {

    hc:
      hc,

    realizaram:
      realizaram,

    processo:
      processo,

    naoRealizaram:
      naoRealizaram,

    percentual:

      hc > 0

        ? realizaram /
          hc

        : 0

  };

}


/* =========================================================
   EXCEÇÕES DE SETOR
   SOMENTE NAS ARTES
========================================================= */

function ajustarSetorNaArte(
  nome,
  setor
) {

  const nomeNormalizado =
    normalizarTexto(
      nome
    );


  if (
    nomeNormalizado ===
    "PATRICIA GOMES MELO"
  ) {

    return "GERENTE OUT";

  }


  if (
    nomeNormalizado ===
    "THIAGO COUTO BALDO"
  ) {

    return "GERENTE IN";

  }


  return limparTexto(
    setor
  )
    .toUpperCase();

}


/* =========================================================
   TEMPO → MINUTOS
========================================================= */

function converterTempoParaMinutos(
  valor
) {

  const texto =
    limparTexto(
      valor
    )
      .toLowerCase();


  if (
    !texto
  ) {

    return 0;

  }


  let horas =
    0;


  let minutos =
    0;


  const matchHoras =
    texto.match(
      /(\d+)\s*h/
    );


  const matchMinutos =
    texto.match(
      /(\d+)\s*m/
    );


  if (
    matchHoras
  ) {

    horas =
      Number(
        matchHoras[1]
      ) || 0;

  }


  if (
    matchMinutos
  ) {

    minutos =
      Number(
        matchMinutos[1]
      ) || 0;

  }


  return (
    horas * 60
  ) + minutos;

}


/* =========================================================
   MÊS PREDOMINANTE
========================================================= */

function obterMesPredominante(
  registros
) {

  const contagem =
    {};


  registros.forEach(
    registro => {

      const mes =
        limparTexto(
          registro.mes
        );


      if (
        !mes
      ) {

        return;

      }


      contagem[
        mes
      ] =
        (
          contagem[
            mes
          ] || 0
        ) +
        1;

    }
  );


  const entradas =
    Object.entries(
      contagem
    );


  if (
    entradas.length === 0
  ) {

    return "";

  }


  entradas.sort(
    (
      a,
      b
    ) =>
      b[1] -
      a[1]
  );


  return formatarMes(
    entradas[0][0]
  );

}


/* =========================================================
   FORMATAR MÊS
========================================================= */

function formatarMes(
  valor
) {

  const texto =
    normalizarTexto(
      valor
    );


  const nome =
    texto
      .split("-")[0]
      .trim();


  const meses = {

    JANEIRO:
      "Janeiro",

    ENERO:
      "Janeiro",

    FEVEREIRO:
      "Fevereiro",

    FEBRERO:
      "Fevereiro",

    MARCO:
      "Março",

    MARZO:
      "Março",

    ABRIL:
      "Abril",

    MAIO:
      "Maio",

    MAYO:
      "Maio",

    JUNHO:
      "Junho",

    JUNIO:
      "Junho",

    JULHO:
      "Julho",

    JULIO:
      "Julho",

    AGOSTO:
      "Agosto",

    SETEMBRO:
      "Setembro",

    SEPTIEMBRE:
      "Setembro",

    OUTUBRO:
      "Outubro",

    OCTUBRE:
      "Outubro",

    NOVEMBRO:
      "Novembro",

    NOVIEMBRE:
      "Novembro",

    DEZEMBRO:
      "Dezembro",

    DICIEMBRE:
      "Dezembro"

  };


  return (
    meses[
      nome
    ] ||
    limparTexto(
      valor
    )
  );

}


/* =========================================================
   PREENCHER SISTEMA
========================================================= */

function preencherSistema(
  dados
) {

  preencherResumo(
    dados
  );


  preencherMes(
    dados.mes
  );


  preencherArteGeral(
    dados
  );


  preencherArteProcesso(
    dados.processo
  );


  preencherArteNaoRealizaram(
    dados.naoRealizaram
  );

}


/* =========================================================
   RESUMO SUPERIOR
========================================================= */

function preencherResumo(
  dados
) {

  document
    .getElementById(
      "resumo-hc"
    )
    .textContent =
    dados.geral.hc;


  document
    .getElementById(
      "resumo-realizaram"
    )
    .textContent =
    dados.geral.realizaram;


  document
    .getElementById(
      "resumo-processo"
    )
    .textContent =
    dados.geral.processo;


  document
    .getElementById(
      "resumo-nao"
    )
    .textContent =
    dados.geral.naoRealizaram;

}


/* =========================================================
   MÊS
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
   ARTE GERAL
========================================================= */

function preencherArteGeral(
  dados
) {

  document
    .getElementById(
      "percentual-geral"
    )
    .textContent =
    formatarPorcentagem(
      dados
        .geral
        .percentual
    );


  const container =
    document.getElementById(
      "lista-areas"
    );


  container.innerHTML =
    "";


  const ordem = [
    "ICQA",
    "OPEX",
    "Outbound",
    "Inbound"
  ];


  ordem.forEach(
    area => {

      const info =
        dados.areas[
          area
        ];


      const percentual =
        info
          ? info.percentual
          : 0;


      const largura =
        Math.max(
          0,
          Math.min(
            100,
            percentual * 100
          )
        );


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "area-item";


      item.innerHTML = `

        <div class="area-nome">
          ${area}
        </div>

        <div class="barra">

          <div
            class="barra-preenchida"
            style="width: ${largura}%;"
          >
          </div>

        </div>

        <div class="area-percentual">

          ${formatarPorcentagem(
            percentual
          )}

        </div>

      `;


      container.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   ARTE EM PROCESSO
========================================================= */

function preencherArteProcesso(
  pessoas
) {

  document
    .getElementById(
      "total-processo"
    )
    .textContent =
    pessoas.length;


  montarListasProcesso(
    pessoas
  );

}


/* =========================================================
   ARTE NÃO REALIZARAM
========================================================= */

function preencherArteNaoRealizaram(
  pessoas
) {

  document
    .getElementById(
      "total-nao"
    )
    .textContent =
    pessoas.length;


  montarListasNaoRealizaram(
    pessoas
  );

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

  const tamanho =
    Math.ceil(
      lista.length /
      quantidade
    );


  const partes =
    [];


  for (
    let i =
      0;

    i <
      quantidade;

    i++
  ) {

    partes.push(

      lista.slice(

        i *
        tamanho,

        (
          i +
          1
        ) *
        tamanho

      )

    );

  }


  return partes;

}


/* =========================================================
   MONTAR LISTAS EM PROCESSO
========================================================= */

function montarListasProcesso(
  pessoas
) {

  const container =
    document.getElementById(
      "listas-processo"
    );


  const colunas =
    quantidadeColunas(
      pessoas.length
    );


  container.className =

    "listas-grid " +

    "colunas-" +

    colunas;


  container.innerHTML =
    "";


  const partes =
    dividirLista(
      pessoas,
      colunas
    );


  partes.forEach(
    grupo => {

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
                  pessoa.tempo
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
   MONTAR LISTAS NÃO REALIZARAM
========================================================= */

function montarListasNaoRealizaram(
  pessoas
) {

  const container =
    document.getElementById(
      "listas-nao"
    );


  const colunas =
    quantidadeColunas(
      pessoas.length
    );


  container.className =

    "listas-grid " +

    "colunas-" +

    colunas;


  container.innerHTML =
    "";


  const partes =
    dividirLista(
      pessoas,
      colunas
    );


  partes.forEach(
    grupo => {

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
   MOSTRAR / OCULTAR DASHBOARD
========================================================= */

function exibirDashboard() {

  resumoDados
    .classList
    .remove(
      "oculto"
    );


  menuArtes
    .classList
    .remove(
      "oculto"
    );


  areaArtes
    .classList
    .remove(
      "oculto"
    );

}


function ocultarDashboard() {

  resumoDados
    .classList
    .add(
      "oculto"
    );


  menuArtes
    .classList
    .add(
      "oculto"
    );


  areaArtes
    .classList
    .add(
      "oculto"
    );

}


/* =========================================================
   TROCAR ARTE
========================================================= */

function mostrarArte(
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

        arte
          .classList
          .remove(
            "ativa"
          );

      }
    );


  botoesArte.forEach(
    botao => {

      botao
        .classList
        .toggle(

          "ativo",

          botao.dataset.arte ===
          nome

        );

    }
  );


  const arte =
    document.getElementById(
      "arte-" +
      nome
    );


  if (
    arte
  ) {

    arte
      .classList
      .add(
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
      "arte-" +
      arteAtual
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
    botaoBaixar.textContent;


  try {

    botaoBaixar.disabled =
      true;


    botaoBaixar.textContent =
      "⏳ Gerando PNG...";


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
      arte
        .dataset
        .nomeArquivo ||
      "Be-a-Rep";


    const mes =
      dadosProcessados
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


    document.body
      .appendChild(
        link
      );


    link.click();


    link.remove();

  }

  catch (
    erro
  ) {

    console.error(
      erro
    );


    alert(

      "Não foi possível gerar o PNG.\n\n" +

      erro.message

    );

  }

  finally {

    botaoBaixar.disabled =
      false;


    botaoBaixar.textContent =
      textoOriginal;

  }

}


/* =========================================================
   AGUARDAR IMAGENS
========================================================= */

async function aguardarImagens(
  elemento
) {

  const imagens =
    Array.from(
      elemento.querySelectorAll(
        "img"
      )
    );


  const promessas =
    imagens.map(
      imagem => {

        if (
          imagem.complete
        ) {

          return Promise.resolve();

        }


        return new Promise(
          resolve => {

            imagem.addEventListener(
              "load",
              resolve,
              {
                once:
                  true
              }
            );


            imagem.addEventListener(
              "error",
              resolve,
              {
                once:
                  true
              }
            );

          }
        );

      }
    );


  await Promise.all(
    promessas
  );

}


/* =========================================================
   PORCENTAGEM
========================================================= */

function formatarPorcentagem(
  valor
) {

  return (

    (
      Number(
        valor
      ) || 0
    ) *
    100

  )
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
    ) +
    "%";

}


/* =========================================================
   STATUS
========================================================= */

function atualizarStatus(
  texto,
  classe
) {

  if (
    !statusArquivo
  ) {

    return;

  }


  statusArquivo.textContent =
    texto;


  statusArquivo.className =
    "status-arquivo";


  if (
    classe
  ) {

    statusArquivo
      .classList
      .add(
        classe
      );

  }

}


/* =========================================================
   BUSCAR VALOR EM OBJETO
========================================================= */

function obterValorObjeto(
  objeto,
  nomesPossiveis
) {

  for (
    const nome of
    nomesPossiveis
  ) {

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          objeto,
          nome
        )
    ) {

      return objeto[
        nome
      ];

    }

  }


  /*
   * Segunda tentativa:
   * compara os nomes ignorando
   * acentos e maiúsculas.
   */

  const chaves =
    Object.keys(
      objeto
    );


  for (
    const nomeBuscado of
    nomesPossiveis
  ) {

    const nomeNormalizado =
      normalizarTexto(
        nomeBuscado
      );


    const chaveEncontrada =
      chaves.find(
        chave =>
          normalizarTexto(
            chave
          ) ===
          nomeNormalizado
      );


    if (
      chaveEncontrada
    ) {

      return objeto[
        chaveEncontrada
      ];

    }

  }


  return "";

}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function obterExtensao(
  nomeArquivo
) {

  return String(
    nomeArquivo ||
    ""
  )
    .split(
      "."
    )
    .pop()
    .toLowerCase();

}


function limparTexto(
  valor
) {

  return String(
    valor ??
    ""
  )
    .trim();

}


function normalizarTexto(
  valor
) {

  return String(
    valor ??
    ""
  )
    .trim()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toUpperCase();

}


function escaparHTML(
  valor
) {

  return String(
    valor ??
    ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
