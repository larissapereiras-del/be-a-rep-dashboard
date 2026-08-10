console.log("✅ CENTRAL BE A REP V2.1 — GESTÃO DE EXCEÇÕES CARREGADA");

const API_DADOS = "/api/dados";
const TARGET = 0.90;
const STORAGE_EXCECOES = "be-a-rep-excecoes-v1";

const AREAS_VALIDAS = [
  "Outbound",
  "Inbound",
  "OPEX",
  "ICQA",
  "Line Haul"
];

let dadosProcessados = null;
let arteAtual = "geral";
let excecoes = carregarExcecoes();

const $ = id => document.getElementById(id);

const inputArquivo = $("arquivo-base");
const statusArquivo = $("status-arquivo");
const resumoDados = $("resumo-dados");
const menuArtes = $("menu-artes");
const areaArtes = $("area-artes");
const botaoBaixar = $("baixar-png");
const botaoAtualizar = $("botao-atualizar");
const textoAtualizacao = $("texto-atualizacao");

const botoesArte =
  document.querySelectorAll(".art-tab");


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    configurarEventos();

    renderizarExcecoes();

    await carregarDadosAutomaticos();

  }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {

  botaoAtualizar?.addEventListener(
    "click",
    carregarDadosAutomaticos
  );


  inputArquivo?.addEventListener(
    "change",
    async evento => {

      const arquivo =
        evento.target.files?.[0];

      if (arquivo) {

        await processarArquivo(
          arquivo
        );

      }

    }
  );


  botoesArte.forEach(
    botao => {

      botao.addEventListener(
        "click",
        () =>
          mostrarArte(
            botao.dataset.arte
          )
      );

    }
  );


  botaoBaixar?.addEventListener(
    "click",
    baixarArteAtual
  );


  $("botao-adicionar-excecao")
    ?.addEventListener(
      "click",
      adicionarExcecao
    );

}


/* =========================================================
   CARREGAR DADOS AUTOMATICAMENTE
========================================================= */

async function carregarDadosAutomaticos() {

  const textoOriginal =
    botaoAtualizar?.textContent ||
    "↻ Atualizar dados";


  try {

    if (
      botaoAtualizar
    ) {

      botaoAtualizar.disabled =
        true;

      botaoAtualizar.textContent =
        "Atualizando...";

    }


    textoAtualizacao.textContent =
      "Buscando os dados mais recentes da base...";


    atualizarStatus(
      "Conectando à base...",
      ""
    );


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

        const erro =
          await resposta.json();


        if (
          erro?.erro
        ) {

          mensagem =
            erro.erro;

        }

      }

      catch {}


      throw new Error(
        mensagem
      );

    }


    const registros =
      await resposta.json();


    if (
      !Array.isArray(
        registros
      ) ||
      registros.length ===
      0
    ) {

      throw new Error(
        "A API não retornou uma lista válida de pessoas."
      );

    }


    dadosProcessados =
      processarDadosApi(
        registros
      );


    atualizarTudo();


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


    textoAtualizacao.textContent =
      'Dados sincronizados diretamente do Verdi. Clique em "Atualizar dados" para buscar novamente.';

  }

  catch (
    erro
  ) {

    console.error(
      erro
    );


    atualizarStatus(
      `❌ Não foi possível atualizar automaticamente: ${erro.message}`,
      "erro"
    );


    textoAtualizacao.textContent =
      "A atualização automática falhou. Use o carregamento manual como backup.";


    ocultarDashboard();

  }

  finally {

    if (
      botaoAtualizar
    ) {

      botaoAtualizar.disabled =
        false;

      botaoAtualizar.textContent =
        textoOriginal;

    }

  }

}


/* =========================================================
   PROCESSAR DADOS DA API
========================================================= */

function processarDadosApi(
  dadosApi
) {

  if (
    !Array.isArray(
      dadosApi
    )
  ) {

    throw new Error(
      "A base recebida da API não é válida."
    );

  }


  /* =======================================================
     DESCOBRIR MÊS ATUAL
  ======================================================= */

  const agora =
    new Date();


  const mesAtual =
    agora.toLocaleString(
      "pt-BR",
      {

        month:
          "long"

      }
    );


  const anoAtual =
    agora.getFullYear();


  const referenciaAtual =
    normalizarTexto(
      `${mesAtual}-${anoAtual}`
    );


  /* =======================================================
     TRAVAS PRINCIPAIS

     SOMENTE:
     - MÊS ATUAL
     - OBRIGATÓRIO

     NÃO FILTRAMOS POR ÁREA AQUI.

     Isso é proposital:
     quem não estiver no CADASTRO_AREAS precisa continuar
     chegando para aparecer no alerta.
  ======================================================= */

  const registros =
    dadosApi

      .filter(
        item => {

          const mesRegistro =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "MES",
                  "Mes",
                  "Mês"
                ]
              )
            );


          const obrigatoriedade =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "FLAG_OBLIGATORIEDAD",
                  "FLAG OBLIGATORIEDAD",
                  "FLAG_OBRIGATORIEDADE",
                  "Obrigatoriedade"
                ]
              )
            );


          return (

            mesRegistro ===
              referenciaAtual &&

            obrigatoriedade ===
              "OBLIGATORIO"

          );

        }
      )


      .map(
        item => {

          /* ===============================================
             NOME
          =============================================== */

          const nome =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "FULL_NAME",
                  "Full Name",
                  "NOME",
                  "Nome",
                  "Nombre"
                ]
              )
            );


          if (
            !nome
          ) {

            return null;

          }


          /* ===============================================
             USERNAME
          =============================================== */

          const username =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "USERNAME",
                  "LDAP_USER"
                ]
              )
            );


          /* ===============================================
             EMAIL
          =============================================== */

          const email =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "EMAIL"
                ]
              )
            );


          /* ===============================================
             CAD
          =============================================== */

          const cad =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "CAD_PEOPLE",
                  "CAD_GROOT",
                  "CAD"
                ]
              )
            );


          /* ===============================================
             MÊS
          =============================================== */

          const mes =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "MES",
                  "Mes",
                  "Mês",
                  "MES_BE_A_REP"
                ]
              )
            );


          /* ===============================================
             OBRIGATORIEDADE
          =============================================== */

          const obrigatoriedade =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "FLAG_OBLIGATORIEDAD",
                  "FLAG OBLIGATORIEDAD",
                  "FLAG_OBRIGATORIEDADE",
                  "Obrigatoriedade"
                ]
              )
            );


          /* ===============================================
             TEMPO
          =============================================== */

          const tempo =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "SUMA_HORAS_MES",
                  "HORAS",
                  "Horas Mes",
                  "Horas Mês",
                  "Tempo"
                ]
              )
            );


          /* ===============================================
             GEMBA
          =============================================== */

          const gemba =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "GEMBA",
                  "Gemba"
                ]
              )
            );


          /* ===============================================
             STATUS BAR
          =============================================== */

          const statusBar =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "ESTADO_BAR",
                  "STATUS_BAR",
                  "Status BAR",
                  "Status Bar"
                ]
              )
            );


          /* ===============================================
             ÁREA CONSOLIDADA

             Vem do CADASTRO_AREAS pelo Merge.
          =============================================== */

          const areaOriginal =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "ÁREA CONSOLIDADA",
                  "AREA CONSOLIDADA",
                  "AREA_CONSOLIDADA",
                  "Área Consolidada"
                ]
              )
            );


          const area =
            normalizarArea(
              areaOriginal
            );


          /* ===============================================
             SETOR
          =============================================== */

          const setor =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "SETOR",
                  "Setor",
                  "POSITION_PEOPLE",
                  "ROL"
                ]
              )
            )
              .toUpperCase();


          /* ===============================================
             STATUS CADASTRO
          =============================================== */

          const statusCadastro =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "Status Cadastro",
                  "STATUS CADASTRO",
                  "STATUS_CADASTRO"
                ]
              )
            );


          return {

            nome:
              nome,

            username:
              username,

            email:
              email,

            cad:
              cad,

            mes:
              mes,

            obrigatoriedade:
              obrigatoriedade,

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

            areaOriginal:
              areaOriginal,

            statusCadastro:
              statusCadastro,

            temCadastroArea:
              AREAS_VALIDAS.includes(
                area
              ),

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
    removerDuplicidades(
      registros
    )
  );

}


/* =========================================================
   REMOVER DUPLICIDADES
========================================================= */

function removerDuplicidades(
  registros
) {

  const mapa =
    new Map();


  registros.forEach(
    pessoa => {

      const chave =
        normalizarTexto(

          pessoa.username ||

          pessoa.email ||

          pessoa.nome

        );


      if (
        !chave
      ) {

        return;

      }


      if (
        !mapa.has(
          chave
        )
      ) {

        mapa.set(
          chave,
          pessoa
        );

        return;

      }


      const atual =
        mapa.get(
          chave
        );


      /*
       * Se existir mais de um registro,
       * priorizamos aquele que recebeu
       * a ÁREA CONSOLIDADA no Merge.
       */

      if (
        !atual.temCadastroArea &&
        pessoa.temCadastroArea
      ) {

        mapa.set(
          chave,
          pessoa
        );

        return;

      }


      /*
       * Se os dois forem equivalentes,
       * mantém o registro com maior tempo.
       */

      if (
        pessoa.minutos >
        atual.minutos
      ) {

        mapa.set(
          chave,
          pessoa
        );

      }

    }
  );


  return Array.from(
    mapa.values()
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
      [
        "xlsx",
        "xls"
      ].includes(
        extensao
      )
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
      !linhas?.length
    ) {

      throw new Error(
        "O arquivo está vazio."
      );

    }


    dadosProcessados =
      processarLinhasBase(
        linhas
      );


    atualizarTudo();


    atualizarStatus(
      `✅ Arquivo carregado manualmente com sucesso: ${arquivo.name}`,
      "sucesso"
    );


    textoAtualizacao.textContent =
      "Dados carregados pelo arquivo manual.";

  }

  catch (
    erro
  ) {

    console.error(
      erro
    );


    atualizarStatus(
      `❌ ${erro.message}`,
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


  const nomeAba =
    workbook.SheetNames.find(
      nome =>
        normalizarTexto(
          nome
        ) ===
        "BASE"
    ) ||
    workbook.SheetNames[0];


  return XLSX.utils.sheet_to_json(
    workbook.Sheets[
      nomeAba
    ],
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
    workbook.SheetNames[0];


  return XLSX.utils.sheet_to_json(
    workbook.Sheets[
      nomeAba
    ],
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
   PROCESSAR ARQUIVO MANUAL
========================================================= */

function processarLinhasBase(
  linhas
) {

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


          if (
            !nome
          ) {

            return null;

          }


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

            temCadastroArea:
              AREAS_VALIDAS.includes(
                area
              ),

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
   PROCESSAR REGISTROS
========================================================= */

function processarRegistros(
  registros
) {

  if (
    !registros.length
  ) {

    throw new Error(
      "Nenhuma pessoa obrigatória foi encontrada no mês atual."
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

  const guembaPendenteBeARep =
    [];

  const guembaProcessandoBeARep =
    [];

  const semCadastro =
    [];


  /* =======================================================
     PROCESSAR CADA PESSOA
  ======================================================= */

  registros.forEach(
    pessoa => {

      /* ===================================================
         SEM CADASTRO DE ÁREA

         IMPORTANTE:
         A pessoa NÃO desaparece do dashboard.

         Ela continua fazendo parte do HC Geral,
         mas não entra em nenhuma área até ser cadastrada.
      =================================================== */

      if (
        !AREAS_VALIDAS.includes(
          pessoa.area
        )
      ) {

        semCadastro.push(
          pessoa
        );

      }


      /* ===================================================
         RESULTADO POR ÁREA

         SOMENTE quem possui ÁREA CONSOLIDADA válida.
      =================================================== */

      if (
        AREAS_VALIDAS.includes(
          pessoa.area
        )
      ) {

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

        }

        else {

          dadosArea.naoRealizaram++;

        }

      }


      /* ===================================================
         LISTA EM PROCESSO

         Essa lista é GERAL.

         Mesmo quem estiver sem cadastro de área continua
         aparecendo aqui.
      =================================================== */

      if (
        pessoa.situacao ===
        "EM_PROCESSO"
      ) {

        processo.push(
          criarPessoaLista(
            pessoa,
            true
          )
        );

      }


      /* ===================================================
         LISTA NÃO REALIZARAM
      =================================================== */

      else if (
        pessoa.situacao ===
        "NAO_REALIZOU"
      ) {

        naoRealizaram.push(
          criarPessoaLista(
            pessoa,
            false
          )
        );

      }


      /* ===================================================
         TEMPO MÍNIMO PARA CONCLUSÃO

         OPEX = 10 minutos
         Demais áreas = 60 minutos
      =================================================== */

      const tempoConclusao =

        pessoa.area ===
        "OPEX"

          ? 10

          : 60;


      /* ===================================================
         GUEMBA PENDENTE
      =================================================== */

      if (
        gembaConcluido(
          pessoa.gemba
        ) &&
        pessoa.minutos ===
        0
      ) {

        guembaPendenteBeARep.push(
          criarPessoaLista(
            pessoa,
            false
          )
        );

      }


      /* ===================================================
         GUEMBA PROCESSANDO
      =================================================== */

      if (
        gembaConcluido(
          pessoa.gemba
        ) &&
        pessoa.minutos >
        0 &&
        pessoa.minutos <
        tempoConclusao
      ) {

        guembaProcessandoBeARep.push(
          criarPessoaLista(
            pessoa,
            true
          )
        );

      }

    }
  );


  /* =======================================================
     PERCENTUAL POR ÁREA
  ======================================================= */

  AREAS_VALIDAS.forEach(
    nomeArea => {

      const area =
        areas[
          nomeArea
        ];


      area.percentual =

        area.hc >
        0

          ? area.realizaram /
            area.hc

          : 0;

    }
  );


  /* =======================================================
     ORDENAÇÕES
  ======================================================= */

  processo.sort(
    ordenarTempoNome
  );


  naoRealizaram.sort(
    ordenarNome
  );


  guembaPendenteBeARep.sort(
    ordenarNome
  );


  guembaProcessandoBeARep.sort(
    ordenarTempoNome
  );


  semCadastro.sort(
    ordenarNome
  );


  /* =======================================================
     RESULTADO GERAL

     ESSA É A PARTE IMPORTANTE:

     O GERAL NÃO É MAIS CALCULADO SOMANDO AS ÁREAS.

     Ele é calculado diretamente com TODOS os obrigatórios
     do mês.

     Portanto:

     áreas cadastradas + sem cadastro = HC GERAL
  ======================================================= */

  const geral =
    calcularGeralPorRegistros(
      registros
    );


  /*
   * Mantemos também areas.Geral
   * para não quebrar nenhuma função antiga do dashboard.
   */

  areas.Geral =
    geral;


  /* =======================================================
     RETORNO
  ======================================================= */

  return {

    mes:
      mes,

    areas:
      areas,

    geral:
      geral,

    registros:
      registros,

    processo:
      processo,

    naoRealizaram:
      naoRealizaram,

    guembaPendenteBeARep:
      guembaPendenteBeARep,

    guembaProcessandoBeARep:
      guembaProcessandoBeARep,

    /* =====================================================
       NOVO — PESSOAS SEM CADASTRO DE ÁREA
    ===================================================== */

    semCadastro:
      semCadastro,

    quantidadeSemCadastro:
      semCadastro.length

  };

}


/* =========================================================
   CRIAR PESSOA PARA AS LISTAS
========================================================= */

function criarPessoaLista(
  pessoa,
  comTempo
) {

  return {

    nome:
      pessoa.nome,

    setor:

      ajustarSetorNaArte(
        pessoa.nome,
        pessoa.setor
      ) ||

      "SEM SETOR",

    area:

      pessoa.area ||

      "SEM ÁREA",

    situacao:
      pessoa.situacao,

    ...(comTempo

      ? {

          tempo:
            pessoa.tempo,

          minutos:
            pessoa.minutos

        }

      : {})

  };

}


/* =========================================================
   ATUALIZAR TODO O DASHBOARD
========================================================= */

function atualizarTudo() {

  preencherMes(
    dadosProcessados.mes
  );


  preencherResumo(
    dadosProcessados
  );


  preencherMeta(
    dadosProcessados
  );


  /* =======================================================
     NOVO ALERTA
  ======================================================= */

  preencherAlertaSemCadastro(
    dadosProcessados
  );


  preencherArteGeral(
    dadosProcessados
  );


  preencherListasComExcecoes();


  preencherDatalistExcecoes();


  renderizarExcecoes();


  exibirDashboard();


  mostrarArte(
    "geral"
  );

}


/* =========================================================
   ALERTA — PESSOAS SEM CADASTRO DE ÁREA
========================================================= */

function preencherAlertaSemCadastro(
  dados
) {

  const pessoas =

    Array.isArray(
      dados?.semCadastro
    )

      ? dados.semCadastro

      : [];


  let card =
    document.getElementById(
      "alerta-sem-cadastro-area"
    );


  /* =======================================================
     CRIAR O CARD AUTOMATICAMENTE

     Não precisa alterar o index.html.
  ======================================================= */

  if (
    !card
  ) {

    card =
      document.createElement(
        "section"
      );


    card.id =
      "alerta-sem-cadastro-area";


    card.style.cssText = `

      margin: 18px 0;

      padding: 18px 20px;

      border: 1px solid #f3c44e;

      border-left: 6px solid #f4b400;

      border-radius: 16px;

      background: #fff9e6;

      color: #332600;

      box-shadow: 0 8px 24px rgba(0,0,0,.06);

    `;


    const referencia =
      document.getElementById(
        "resumo-dados"
      );


    if (
      referencia &&
      referencia.parentNode
    ) {

      referencia.parentNode.insertBefore(
        card,
        referencia
      );

    }

  }


  if (
    !card
  ) {

    return;

  }


  /* =======================================================
     NINGUÉM PENDENTE
  ======================================================= */

  if (
    pessoas.length ===
    0
  ) {

    card.innerHTML = `

      <div
        style="
          display:flex;
          align-items:center;
          gap:10px;
          font-weight:700;
        "
      >

        <span>
          ✅
        </span>

        <span>
          Todas as pessoas obrigatórias do mês possuem área cadastrada.
        </span>

      </div>

    `;


    return;

  }


  /* =======================================================
     LISTA DE NOMES
  ======================================================= */

  const nomes =

    pessoas

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

      .map(
        pessoa => `

          <li
            style="
              margin:4px 0;
              break-inside:avoid;
            "
          >

            ${escaparHTML(
              pessoa.nome
            )}

          </li>

        `
      )

      .join(
        ""
      );


  /* =======================================================
     CARD DE ALERTA
  ======================================================= */

  card.innerHTML = `

    <div
      style="
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:16px;
        flex-wrap:wrap;
      "
    >

      <div>

        <span
          style="
            display:block;
            font-size:12px;
            font-weight:800;
            letter-spacing:.06em;
            color:#9a6b00;
            margin-bottom:4px;
          "
        >

          ⚠️ CADASTRO DE ÁREAS PENDENTE

        </span>


        <strong
          style="
            display:block;
            font-size:18px;
            margin-bottom:4px;
          "
        >

          ${pessoas.length}
          pessoa${pessoas.length === 1 ? "" : "s"}
          sem área cadastrada

        </strong>


        <span
          style="
            font-size:14px;
            color:#67551f;
          "
        >

          ${pessoas.length === 1 ? "Ela está" : "Elas estão"}
          contabilizada${pessoas.length === 1 ? "" : "s"}
          no HC Geral, mas ainda não
          ${pessoas.length === 1 ? "foi distribuída" : "foram distribuídas"}
          entre Outbound, Inbound, OPEX, ICQA ou Line Haul.

        </span>

      </div>


      <button

        id="botao-toggle-sem-cadastro"

        type="button"

        style="
          border:0;
          border-radius:10px;
          padding:10px 14px;
          background:#071b61;
          color:white;
          font-weight:700;
          cursor:pointer;
        "

      >

        Ver
        ${pessoas.length === 1 ? "pessoa" : "pessoas"}

      </button>

    </div>


    <div

      id="lista-sem-cadastro-area"

      style="
        display:none;
        margin-top:14px;
        padding-top:12px;
        border-top:1px solid #ecd88b;
      "

    >

      <p
        style="
          margin:0 0 8px;
          font-size:13px;
          color:#67551f;
        "
      >

        Inclua
        ${pessoas.length === 1 ? "este nome" : "estes nomes"}
        na aba

        <strong>
          CADASTRO_AREAS
        </strong>.

      </p>


      <ul
        style="
          margin:0;
          padding-left:20px;
          columns:2;
          column-gap:32px;
        "
      >

        ${nomes}

      </ul>

    </div>

  `;


  /* =======================================================
     ABRIR / FECHAR LISTA
  ======================================================= */

  const botao =
    document.getElementById(
      "botao-toggle-sem-cadastro"
    );


  const lista =
    document.getElementById(
      "lista-sem-cadastro-area"
    );


  botao?.addEventListener(
    "click",
    () => {

      const aberto =

        lista.style.display !==
        "none";


      lista.style.display =

        aberto

          ? "none"

          : "block";


      botao.textContent =

        aberto

          ? `Ver ${pessoas.length === 1 ? "pessoa" : "pessoas"}`

          : "Ocultar lista";

    }
  );

}


/* =========================================================
   PREENCHER RESUMO
========================================================= */

function preencherResumo(
  dados
) {

  const geral =
    dados.geral;


  $("resumo-hc").textContent =
    geral.hc;


  $("resumo-realizaram").textContent =
    geral.realizaram;


  $("resumo-processo").textContent =
    geral.processo;


  $("resumo-nao").textContent =
    geral.naoRealizaram;


  $("percentual-resumo-realizaram").textContent =
    formatarPorcentagem(

      geral.hc > 0

        ? geral.realizaram /
          geral.hc

        : 0

    );


  $("percentual-resumo-processo").textContent =
    formatarPorcentagem(

      geral.hc > 0

        ? geral.processo /
          geral.hc

        : 0

    );


  $("percentual-resumo-nao").textContent =
    formatarPorcentagem(

      geral.hc > 0

        ? geral.naoRealizaram /
          geral.hc

        : 0

    );


  $("situacao-atual").textContent =
    formatarPorcentagem(
      geral.percentual
    );

}
  /* =======================================================
     RESULTADO POR ÁREA
  ======================================================= */

  const container =
    $("lista-areas");


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";


  const ordem = [

    "OPEX",

    "Inbound",

    "Outbound",

    "ICQA",

    "Line Haul"

  ];


  /* =======================================================
     ÁREAS NORMAIS
  ======================================================= */

  ordem.forEach(
    areaNome => {

      const area =
        dados.areas[
          areaNome
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
            areaNome
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


  /* =======================================================
     SEM CADASTRO DE ÁREA

     ESSA LINHA FAZ A CONFERÊNCIA:

     OPEX
     + INBOUND
     + OUTBOUND
     + ICQA
     + LINE HAUL
     + SEM CADASTRO
     = HC GERAL
  ======================================================= */

  const semCadastro =

    Array.isArray(
      dados.semCadastro
    )

      ? dados.semCadastro

      : [];


  if (
    semCadastro.length >
    0
  ) {

    const realizaram =

      semCadastro.filter(
        pessoa =>

          pessoa.situacao ===
          "REALIZOU"
      ).length;


    const processo =

      semCadastro.filter(
        pessoa =>

          pessoa.situacao ===
          "EM_PROCESSO"
      ).length;


    const naoRealizaram =

      semCadastro.filter(
        pessoa =>

          pessoa.situacao ===
          "NAO_REALIZOU"
      ).length;


    const percentual =

      semCadastro.length >
      0

        ? realizaram /
          semCadastro.length

        : 0;


    const linha =
      document.createElement(
        "div"
      );


    linha.className =
      "area-row";


    linha.style.cssText = `

      background:#fff9e6;

      color:#6b5200;

      border-left:4px solid #f4b400;

    `;


    linha.innerHTML = `

      <span>
        ⚠️ Sem cadastro de área
      </span>

      <span>
        ${realizaram}
      </span>

      <span>
        ${processo}
      </span>

      <span>
        ${naoRealizaram}
      </span>

      <span>
        ${semCadastro.length}
      </span>

      <strong>
        ${formatarPorcentagem(
          percentual
        )}
      </strong>

    `;


    container.appendChild(
      linha
    );

  }

}


/* =========================================================
   CALCULAR GERAL DIRETAMENTE PELOS REGISTROS
========================================================= */

function calcularGeralPorRegistros(
  registros
) {

  const geral = {

    hc:
      registros.length,

    realizaram:
      0,

    processo:
      0,

    naoRealizaram:
      0,

    percentual:
      0

  };


  registros.forEach(
    pessoa => {

      if (
        pessoa.situacao ===
        "REALIZOU"
      ) {

        geral.realizaram++;

      }

      else if (
        pessoa.situacao ===
        "EM_PROCESSO"
      ) {

        geral.processo++;

      }

      else {

        geral.naoRealizaram++;

      }

    }
  );


  geral.percentual =

    geral.hc >
    0

      ? geral.realizaram /
        geral.hc

      : 0;


  return geral;

}


/* =========================================================
   GEMBA CONCLUÍDO
========================================================= */

function gembaConcluido(
  gemba
) {

  return [

    "HECHO",

    "CUMPLIO",

    "REALIZADO",

    "CONCLUIDO"

  ].includes(
    normalizarTexto(
      gemba
    )
  );

}


/* =========================================================
   CLASSIFICAR SITUAÇÃO
========================================================= */

function classificarSituacao(
  valorGemba,
  valorBar
) {

  const gemba =
    normalizarTexto(
      valorGemba
    );


  const bar =
    normalizarTexto(
      valorBar
    );


  const realizado = [

    "HECHO",

    "CUMPLIO",

    "REALIZADO",

    "CONCLUIDO"

  ];


  const processando = [

    "EN PROCESO",

    "EM PROCESSO",

    "EN CURSO",

    "INICIADO"

  ];


  if (

    realizado.includes(
      gemba
    ) ||

    realizado.includes(
      bar
    )

  ) {

    return "REALIZOU";

  }


  if (

    processando.includes(
      gemba
    ) ||

    processando.includes(
      bar
    )

  ) {

    return "EM_PROCESSO";

  }


  return "NAO_REALIZOU";

}


/* =========================================================
   CRIAR ESTRUTURA DAS ÁREAS
========================================================= */

function criarEstruturaAreas() {

  const areas =
    {};


  AREAS_VALIDAS.forEach(
    area => {

      areas[
        area
      ] = {

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

      };

    }
  );


  return areas;

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


  if (

    texto ===
      "LINE HAUL" ||

    texto ===
      "LINEHAUL"

  ) {

    return "Line Haul";

  }


  return "";

}
/* =========================================================
   META
========================================================= */

function preencherMeta(dados) {

  const {
    hc,
    realizaram,
    percentual
  } = dados.geral;


  const minimo =
    Math.ceil(
      hc * TARGET
    );


  const faltam =
    Math.max(
      0,
      minimo - realizaram
    );


  $("percentual-meta-dashboard").textContent =
    formatarPorcentagem(
      percentual
    );


  $("texto-progresso-meta").textContent =
    `${formatarPorcentagem(percentual)} de 90%`;


  $("barra-meta-preenchida").style.width =
    `${Math.min(
      100,
      percentual * 100
    )}%`;


  $("situacao-faltam").textContent =
    faltam;


  if (
    faltam === 0
  ) {

    $("status-meta").textContent =
      "🏆 META BATIDA";


    $("mensagem-meta").textContent =
      `Meta atingida com ${realizaram} pessoas realizando.`;


    $("titulo-situacao").textContent =
      "Meta do mês atingida";


    $("descricao-situacao").textContent =
      "O resultado já alcançou ou superou o target de 90%.";

  }

  else {

    $("status-meta").textContent =
      "Target: 90%";


    $("mensagem-meta").textContent =
      `Faltam ${faltam} pessoa${faltam === 1 ? "" : "s"} para atingir o target.`;


    $("titulo-situacao").textContent =
      "Meta em andamento";


    $("descricao-situacao").textContent =
      `${realizaram} pessoas realizaram. Faltam ${faltam} para chegar aos 90%.`;

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
   PREENCHER ARTE GERAL
========================================================= */

function preencherArteGeral(
  dados
) {

  const {

    hc,
    realizaram,
    processo,
    naoRealizaram,
    percentual

  } = dados.geral;


  $("percentual-geral").textContent =
    formatarPorcentagem(
      percentual
    );


  $("arte-geral-realizaram").textContent =
    realizaram;


  $("arte-geral-processo").textContent =
    processo;


  $("arte-geral-nao").textContent =
    naoRealizaram;


  $("arte-geral-hc").textContent =
    hc;


  $("arte-percentual-realizaram").textContent =
    formatarPorcentagem(

      hc
        ? realizaram / hc
        : 0

    );


  $("arte-percentual-processo").textContent =
    formatarPorcentagem(

      hc
        ? processo / hc
        : 0

    );


  $("arte-percentual-nao").textContent =
    formatarPorcentagem(

      hc
        ? naoRealizaram / hc
        : 0

    );

}


/* =========================================================
   PREENCHER LISTAS CONSIDERANDO EXCEÇÕES
========================================================= */

function preencherListasComExcecoes() {

  const ocultados =
    new Set(

      excecoes.map(
        excecao =>
          normalizarTexto(
            excecao.nome
          )
      )

    );


  const filtrar =
    lista =>

      (
        lista ||
        []
      ).filter(
        pessoa =>

          !ocultados.has(
            normalizarTexto(
              pessoa.nome
            )
          )

      );


  const processo =
    filtrar(
      dadosProcessados.processo
    );


  const nao =
    filtrar(
      dadosProcessados.naoRealizaram
    );


  const guembaPendente =
    filtrar(
      dadosProcessados.guembaPendenteBeARep
    );


  const guembaProcessando =
    filtrar(
      dadosProcessados.guembaProcessandoBeARep
    );


  $("total-processo").textContent =
    processo.length;


  $("total-nao").textContent =
    nao.length;


  $("total-guemba-pendente").textContent =
    guembaPendente.length;


  $("total-guemba-processando").textContent =
    guembaProcessando.length;


  montarListaComTempo(
    processo,
    "listas-processo"
  );


  montarListaSemTempo(
    nao,
    "listas-nao"
  );


  montarListaSemTempo(
    guembaPendente,
    "listas-guemba-pendente"
  );


  montarListaComTempo(
    guembaProcessando,
    "listas-guemba-processando"
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


  return Array.from(
    {
      length:
        quantidade
    },
    (
      _,
      indice
    ) =>

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


/* =========================================================
   LISTA COM TEMPO
========================================================= */

function montarListaComTempo(
  pessoas,
  idContainer
) {

  const container =
    $(
      idContainer
    );


  if (
    !container
  ) {

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


  dividirLista(
    pessoas,
    colunas
  )
    .forEach(
      grupo => {

        const tabela =
          document.createElement(
            "div"
          );


        tabela.className =
          "tabela";


        let html = `

          <div
            class="linha-pessoa processo cabecalho-tabela"
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
                class="linha-pessoa processo"
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
    $(
      idContainer
    );


  if (
    !container
  ) {

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


  dividirLista(
    pessoas,
    colunas
  )
    .forEach(
      grupo => {

        const tabela =
          document.createElement(
            "div"
          );


        tabela.className =
          "tabela";


        let html = `

          <div
            class="linha-pessoa nao-realizou cabecalho-tabela"
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
                class="linha-pessoa nao-realizou"
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
   ADICIONAR EXCEÇÃO
========================================================= */

function adicionarExcecao() {

  if (
    !dadosProcessados
  ) {

    return alert(
      "Carregue os dados antes de adicionar uma exceção."
    );

  }


  const nomeDigitado =
    limparTexto(
      $("excecao-nome").value
    );


  const motivo =
    $("excecao-motivo").value;


  if (
    !nomeDigitado
  ) {

    return alert(
      "Selecione ou digite o nome da pessoa."
    );

  }


  const pessoa =
    dadosProcessados.registros.find(
      pessoa =>

        normalizarTexto(
          pessoa.nome
        ) ===

        normalizarTexto(
          nomeDigitado
        )
    );


  if (
    !pessoa
  ) {

    return alert(
      "Nome não encontrado na base atual."
    );

  }


  if (
    excecoes.some(
      excecao =>

        normalizarTexto(
          excecao.nome
        ) ===

        normalizarTexto(
          pessoa.nome
        )
    )
  ) {

    return alert(
      "Essa pessoa já está ocultada das listas."
    );

  }


  excecoes.push(
    {

      nome:
        pessoa.nome,

      motivo:
        motivo

    }
  );


  salvarExcecoes();


  $("excecao-nome").value =
    "";


  renderizarExcecoes();


  preencherListasComExcecoes();

}


/* =========================================================
   REMOVER EXCEÇÃO
========================================================= */

function removerExcecao(
  nome
) {

  excecoes =
    excecoes.filter(
      excecao =>

        normalizarTexto(
          excecao.nome
        ) !==

        normalizarTexto(
          nome
        )
    );


  salvarExcecoes();


  renderizarExcecoes();


  if (
    dadosProcessados
  ) {

    preencherListasComExcecoes();

  }

}


/* =========================================================
   DATALIST DE EXCEÇÕES
========================================================= */

function preencherDatalistExcecoes() {

  const lista =
    $("lista-pessoas-excecao");


  if (
    !lista
  ) {

    return;

  }


  lista.innerHTML =
    "";


  dadosProcessados.registros

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


        /*
         * Se a pessoa ainda não tiver área,
         * mostramos SEM ÁREA.
         */

        option.label =

          `${pessoa.area || "SEM ÁREA"} • ${pessoa.setor || "SEM SETOR"}`;


        lista.appendChild(
          option
        );

      }
    );

}


/* =========================================================
   RENDERIZAR EXCEÇÕES
========================================================= */

function renderizarExcecoes() {

  const container =
    $("lista-excecoes");


  const contador =
    $("total-excecoes");


  if (
    !container ||
    !contador
  ) {

    return;

  }


  contador.textContent =

    `${excecoes.length} ocultada${excecoes.length === 1 ? "" : "s"}`;


  if (
    !excecoes.length
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


  excecoes

    .slice()

    .sort(
      (
        excecaoA,
        excecaoB
      ) =>

        excecaoA.nome.localeCompare(
          excecaoB.nome,
          "pt-BR"
        )
    )

    .forEach(
      excecao => {

        const linha =
          document.createElement(
            "div"
          );


        linha.className =
          "exception-row";


        linha.innerHTML = `

          <strong>
            ${escaparHTML(
              excecao.nome
            )}
          </strong>

          <span>
            ${escaparHTML(
              excecao.motivo
            )}
          </span>

          <button type="button">
            Reativar nome
          </button>

        `;


        linha
          .querySelector(
            "button"
          )
          .addEventListener(
            "click",
            () =>

              removerExcecao(
                excecao.nome
              )
          );


        container.appendChild(
          linha
        );

      }
    );

}


/* =========================================================
   CARREGAR EXCEÇÕES
========================================================= */

function carregarExcecoes() {

  try {

    const valor =
      JSON.parse(

        localStorage.getItem(
          STORAGE_EXCECOES
        ) ||

        "[]"

      );


    return Array.isArray(
      valor
    )

      ? valor

      : [];

  }

  catch {

    return [];

  }

}


/* =========================================================
   SALVAR EXCEÇÕES
========================================================= */

function salvarExcecoes() {

  localStorage.setItem(

    STORAGE_EXCECOES,

    JSON.stringify(
      excecoes
    )

  );

}


/* =========================================================
   EXIBIR DASHBOARD
========================================================= */

function exibirDashboard() {

  resumoDados
    ?.classList
    .remove(
      "oculto"
    );


  menuArtes
    ?.classList
    .remove(
      "oculto"
    );


  areaArtes
    ?.classList
    .remove(
      "oculto"
    );

}


/* =========================================================
   OCULTAR DASHBOARD
========================================================= */

function ocultarDashboard() {

  resumoDados
    ?.classList
    .add(
      "oculto"
    );


  menuArtes
    ?.classList
    .add(
      "oculto"
    );


  areaArtes
    ?.classList
    .add(
      "oculto"
    );

}


/* =========================================================
   MOSTRAR ARTE
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
      arte =>

        arte.classList.remove(
          "ativa"
        )
    );


  botoesArte.forEach(
    botao => {

      botao.classList.toggle(

        "ativo",

        botao.dataset.arte ===
          nome

      );

    }
  );


  $(
    `arte-${nome}`
  )
    ?.classList
    .add(
      "ativa"
    );

}


/* =========================================================
   BAIXAR ARTE ATUAL
========================================================= */

async function baixarArteAtual() {

  const arte =
    $(
      `arte-${arteAtual}`
    );


  if (
    !arte
  ) {

    return alert(
      "Arte não encontrada."
    );

  }


  if (
    typeof html2canvas ===
    "undefined"
  ) {

    return alert(
      "Não foi possível carregar o gerador de PNG."
    );

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

      arte.dataset.nomeArquivo ||

      "Be-a-Rep";


    const mes =

      dadosProcessados?.mes ||

      "";


    const nomeArquivo =

      `${nomeBase}${mes ? "-" + mes.replace(/\s+/g, "-") : ""}.png`;


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
      erro
    );


    alert(
      `Não foi possível gerar o PNG.\n\n${erro.message}`
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


  await Promise.all(

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
    )

  );

}


/* =========================================================
   AJUSTAR SETOR NA ARTE
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
   CONVERTER TEMPO PARA MINUTOS
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


  const horas =

    Number(

      texto.match(
        /(\d+)\s*h/
      )?.[1] ||

      0

    );


  const minutos =

    Number(

      texto.match(
        /(\d+)\s*m/
      )?.[1] ||

      0

    );


  return (
    horas * 60
  ) +
  minutos;

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
        mes
      ) {

        contagem[
          mes
        ] =

          (
            contagem[
              mes
            ] ||
            0
          ) +

          1;

      }

    }
  );


  const maior =

    Object.entries(
      contagem
    )
      .sort(
        (
          itemA,
          itemB
        ) =>

          itemB[1] -
          itemA[1]
      )[0];


  return maior

    ? formatarMes(
        maior[0]
      )

    : "";

}


/* =========================================================
   FORMATAR MÊS
========================================================= */

function formatarMes(
  valor
) {

  const nome =
    normalizarTexto(
      valor
    )
      .split(
        "-"
      )[0]
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
   ATUALIZAR STATUS
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

    statusArquivo.classList.add(
      classe
    );

  }

}


/* =========================================================
   OBTER VALOR DO OBJETO
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


  const chaves =
    Object.keys(
      objeto
    );


  for (
    const nome of
    nomesPossiveis
  ) {

    const chave =
      chaves.find(
        chaveAtual =>

          normalizarTexto(
            chaveAtual
          ) ===

          normalizarTexto(
            nome
          )
      );


    if (
      chave
    ) {

      return objeto[
        chave
      ];

    }

  }


  return "";

}


/* =========================================================
   ORDENAÇÕES
========================================================= */

function ordenarNome(
  pessoaA,
  pessoaB
) {

  return pessoaA.nome.localeCompare(
    pessoaB.nome,
    "pt-BR"
  );

}


function ordenarTempoNome(
  pessoaA,
  pessoaB
) {

  if (
    pessoaB.minutos !==
    pessoaA.minutos
  ) {

    return (

      pessoaB.minutos -
      pessoaA.minutos

    );

  }


  return ordenarNome(
    pessoaA,
    pessoaB
  );

}


/* =========================================================
   EXTENSÃO DO ARQUIVO
========================================================= */

function obterExtensao(
  nome
) {

  return String(
    nome ||
    ""
  )
    .split(
      "."
    )
    .pop()
    .toLowerCase();

}


/* =========================================================
   LIMPAR TEXTO
========================================================= */

function limparTexto(
  valor
) {

  return String(
    valor ??
    ""
  )
    .trim();

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

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


/* =========================================================
   FORMATAR PORCENTAGEM
========================================================= */

function formatarPorcentagem(
  valor
) {

  return `${(

    (
      Number(
        valor
      ) ||
      0
    ) *

    100

  )
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
    )}%`;

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

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
