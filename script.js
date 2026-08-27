console.log("✅ CENTRAL BE A REP V2.2 — VERDI + CADASTRO DE ÁREAS");

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
        () => {

          mostrarArte(
            botao.dataset.arte
          );

        }
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

    if (botaoAtualizar) {

      botaoAtualizar.disabled =
        true;

      botaoAtualizar.textContent =
        "Atualizando...";

    }


    if (textoAtualizacao) {

      textoAtualizacao.textContent =
        "Buscando os dados mais recentes da base...";

    }


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


    if (!resposta.ok) {

      let mensagem =
        `Erro ${resposta.status} ao consultar a base.`;


      try {

        const erro =
          await resposta.json();


        if (erro?.erro) {

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
      !Array.isArray(registros) ||
      registros.length === 0
    ) {

      throw new Error(
        "A API não retornou uma lista válida de pessoas."
      );

    }


    dadosProcessados =
      processarDadosApi(
        registros
      );


    console.log(
      "📊 RESULTADO PROCESSADO",
      {
        geral:
          dadosProcessados.geral,

        areas:
          dadosProcessados.areas,

        semCadastro:
          dadosProcessados.semCadastro,

        realizaramDetalhe:
          dadosProcessados.realizaramDetalhe
      }
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


    if (textoAtualizacao) {

      textoAtualizacao.textContent =
        'Dados sincronizados diretamente pelo Verdi. Clique em "Atualizar dados" para buscar novamente.';

    }

  }

  catch (erro) {

    console.error(
      "❌ Erro ao carregar dados:",
      erro
    );


    atualizarStatus(
      `❌ Não foi possível atualizar automaticamente: ${erro.message}`,
      "erro"
    );


    if (textoAtualizacao) {

      textoAtualizacao.textContent =
        "A atualização automática falhou. Use o carregamento manual como backup.";

    }


    ocultarDashboard();

  }

  finally {

    if (botaoAtualizar) {

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

  if (!Array.isArray(dadosApi)) {

    throw new Error(
      "A base recebida da API não é válida."
    );

  }


  /* =======================================================
     MÊS ATUAL
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


  console.log(
    "📅 Referência atual:",
    referenciaAtual
  );


  /* =======================================================
     FILTRO

     SOMENTE:
     - MÊS ATUAL
     - OBRIGATORIO

     NÃO FILTRAMOS ÁREA AQUI.

     Quem não estiver no CADASTRO_AREAS precisa continuar
     chegando para aparecer no alerta.
  ======================================================= */

  const filtrados =
    dadosApi.filter(
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
    );


  console.log(
    "🔎 Registros após mês + obrigatório:",
    filtrados.length
  );


  /* =======================================================
     NORMALIZAR PESSOAS
  ======================================================= */
  const registros =
    filtrados
      .map(
        item => {

          /* ===============================================
             NOME

             NOME vem do CADASTRO_AREAS
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


          if (!nome) {

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
             LOCAL DO BE A REP

             QUERY:
             PROCESOS_LMS = coluna BC
          =============================================== */

          const local =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "PROCESOS_LMS",
                  "PROCESOS LMS",
                  "PROCESSOS_LMS",
                  "PROCESSOS LMS"
                ]
              )
            );


          /* ===============================================
             PEÇAS PROCESSADAS
          =============================================== */

          const unidadesValor =
            obterValorObjeto(
              item,
              [
                "UNIDADES",
                "Unidades"
              ]
            );


          const unidades =
            numeroSeguroBeARep(
              unidadesValor
            );


          /* ===============================================
             PRODUTIVIDADE
          =============================================== */

          const produtividadeValor =
            obterValorObjeto(
              item,
              [
                "PRODUCTIVIDAD",
                "PRODUTIVIDADE",
                "Productividad",
                "Produtividade"
              ]
            );


          const produtividade =
            numeroSeguroBeARep(
              produtividadeValor
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

             Campo vindo do CADASTRO_AREAS.
          =============================================== */

          const areaOriginal =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "ÁREA CONSOLIDADA",
                  "AREA CONSOLIDADA",
                  "AREA_CONSOLIDADA",
                  "Área Consolidada",
                  "AREA_CONSOLIDADA_1",
                  "ÁREA_CONSOLIDADA"
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

          const setorCadastro =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "SETOR",
                  "Setor"
                ]
              )
            );


          const setorFallback =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "POSITION_PEOPLE",
                  "POSICION_PEOPLE",
                  "ROL"
                ]
              )
            );


          const setor =
            (
              setorCadastro ||
              setorFallback
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


          /* ===============================================
             REGISTRO NORMALIZADO
          =============================================== */

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

            /* NOVOS CAMPOS */

            local:
              local,

            unidades:
              unidades,

            produtividade:
              produtividade,

            /* CAMPOS EXISTENTES */

            gemba:
              gemba,

            statusBar:
              statusBar,

            area:
              area,

            areaOriginal:
              areaOriginal,

            setor:
              setor,

            setorCadastro:
              setorCadastro,

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
      .filter(Boolean);


  /* =======================================================
     REMOVER DUPLICIDADE
  ======================================================= */

  const registrosUnicos =
    removerDuplicidades(
      registros
    );


  console.log(
    "👥 Pessoas únicas:",
    registrosUnicos.length
  );


  console.table(
    registrosUnicos.map(
      pessoa => ({

        nome:
          pessoa.nome,

        area:
          pessoa.area,

        setor:
          pessoa.setor,

        local:
          pessoa.local,

        tempo:
          pessoa.tempo,

        unidades:
          pessoa.unidades,

        produtividade:
          pessoa.produtividade,

        situacao:
          pessoa.situacao,

        cadastro:
          pessoa.temCadastroArea

      })
    )
  );


  return processarRegistros(
    registrosUnicos
  );

}


/* =========================================================
   CONVERTER VALOR NUMÉRICO DA QUERY

   Aceita:
   125
   "125"
   "125,5"
   "125.5"
========================================================= */

function numeroSeguroBeARep(
  valor
) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {

    return 0;

  }


  if (
    typeof valor ===
    "number"
  ) {

    return Number.isFinite(
      valor
    )
      ? valor
      : 0;

  }


  let texto =
    String(
      valor
    )
      .trim();


  if (!texto) {

    return 0;

  }


  /*
   * Se vier no padrão brasileiro:
   * 1.234,56
   */

  if (
    texto.includes(",")
  ) {

    texto =
      texto
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );

  }


  const numero =
    Number(
      texto
    );


  return Number.isFinite(
    numero
  )
    ? numero
    : 0;

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


      if (!chave) {

        return;

      }


      if (!mapa.has(chave)) {

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
       * Se um registro tem área e outro não,
       * mantém o registro que possui área.
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


      if (
        atual.temCadastroArea &&
        !pessoa.temCadastroArea
      ) {

        return;

      }


      /*
       * Em igualdade de cadastro,
       * mantém o registro com mais informação.
       */

      const pontuacaoAtual =
        (
          atual.temCadastroArea
            ? 10
            : 0
        ) +
        (
          atual.setorCadastro
            ? 2
            : 0
        ) +
        (
          atual.areaOriginal
            ? 2
            : 0
        ) +
        (
          atual.local
            ? 2
            : 0
        ) +
        (
          atual.unidades > 0
            ? 1
            : 0
        );


      const pontuacaoNova =
        (
          pessoa.temCadastroArea
            ? 10
            : 0
        ) +
        (
          pessoa.setorCadastro
            ? 2
            : 0
        ) +
        (
          pessoa.areaOriginal
            ? 2
            : 0
        ) +
        (
          pessoa.local
            ? 2
            : 0
        ) +
        (
          pessoa.unidades > 0
            ? 1
            : 0
        );


      if (
        pontuacaoNova >
        pontuacaoAtual
      ) {

        mapa.set(
          chave,
          pessoa
        );

        return;

      }


      /*
       * Último critério:
       * mantém o registro com maior tempo.
       */

      if (
        pontuacaoNova ===
          pontuacaoAtual &&
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
   PROCESSAR REGISTROS
========================================================= */

function processarRegistros(
  registros
) {

  if (!registros.length) {

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


  /* =======================================================
     LISTAS
  ======================================================= */

  const realizaramDetalhe =
    [];

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


  registros.forEach(
    pessoa => {

      /* ===================================================
         SEM CADASTRO

         Continua no HC geral.
         Não entra em nenhuma área.
      =================================================== */

      if (
        !pessoa.temCadastroArea
      ) {

        semCadastro.push(
          pessoa
        );

      }


      /* ===================================================
         ÁREA
      =================================================== */

      if (
        pessoa.temCadastroArea
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
   NOVA LISTA — REALIZARAM

   REGRA EXCLUSIVA DA NOVA ABA:
   considera somente o ESTADO_BAR do Be a Rep.

   NÃO ALTERA:
   - HC
   - percentual
   - resumo geral
   - em processo
   - não realizaram
   - lógica atual do dashboard
=================================================== */

const realizouBeARep =
  [
    "HECHO",
    "CUMPLIO",
    "REALIZADO",
    "CONCLUIDO"
  ].includes(
    normalizarTexto(
      pessoa.statusBar
    )
  );


if (
  realizouBeARep
) {

  realizaramDetalhe.push({

    nome:
      pessoa.nome,

    username:
      pessoa.username,

    area:
      pessoa.area ||
      "SEM ÁREA",

    setor:
      ajustarSetorNaArte(
        pessoa.nome,
        pessoa.setor
      ) ||
      "SEM SETOR",

    local:
      pessoa.local ||
      "-",

    tempo:
      pessoa.tempo ||
      "-",

    minutos:
      pessoa.minutos ||
      0,

    unidades:
      pessoa.unidades ||
      0,

    produtividade:
      pessoa.produtividade ||
      0

  });

}
      /* ===================================================
         EM PROCESSO / NÃO REALIZARAM
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
         GEMBA
      =================================================== */

      const tempoConclusao =
        pessoa.area === "OPEX"
          ? 10
          : 60;


      if (
        gembaConcluido(
          pessoa.gemba
        ) &&
        pessoa.minutos === 0
      ) {

        guembaPendenteBeARep.push(
          criarPessoaLista(
            pessoa,
            false
          )
        );

      }


      if (
        gembaConcluido(
          pessoa.gemba
        ) &&
        pessoa.minutos > 0 &&
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
        area.hc > 0
          ? area.realizaram /
            area.hc
          : 0;

    }
  );


  /* =======================================================
     ORDENAÇÃO DAS LISTAS
  ======================================================= */

  realizaramDetalhe.sort(
    (
      a,
      b
    ) => {

      const areaA =
        String(
          a.area ||
          ""
        );

      const areaB =
        String(
          b.area ||
          ""
        );


      const comparacaoArea =
        areaA.localeCompare(
          areaB,
          "pt-BR"
        );


      if (
        comparacaoArea !==
        0
      ) {

        return comparacaoArea;

      }


      return String(
        a.nome ||
        ""
      ).localeCompare(
        String(
          b.nome ||
          ""
        ),
        "pt-BR"
      );

    }
  );


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
     GERAL

     Todos os obrigatórios do mês entram aqui,
     inclusive quem está sem área.
  ======================================================= */

  const geral =
    calcularGeralPorRegistros(
      registros
    );


  areas.Geral =
    geral;


  console.log(
    "✅ HC Geral:",
    geral.hc
  );


  console.log(
    "✅ Realizaram detalhados:",
    realizaramDetalhe.length
  );


  console.log(
    "✅ Soma áreas:",
    AREAS_VALIDAS.reduce(
      (
        total,
        area
      ) =>
        total +
        areas[area].hc,
      0
    )
  );


  console.log(
    "⚠️ Sem cadastro:",
    semCadastro.length
  );


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

    /* NOVA LISTA */

    realizaramDetalhe:
      realizaramDetalhe,

    processo:
      processo,

    naoRealizaram:
      naoRealizaram,

    guembaPendenteBeARep:
      guembaPendenteBeARep,

    guembaProcessandoBeARep:
      guembaProcessandoBeARep,

    semCadastro:
      semCadastro,

    quantidadeSemCadastro:
      semCadastro.length

  };

}


/* =========================================================
   CRIAR PESSOA PARA LISTAS
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


  preencherAlertaSemCadastro(
    dadosProcessados
  );


  preencherArteGeral(
    dadosProcessados
  );


  /* =======================================================
     NOVA ABA — REALIZARAM
  ======================================================= */

  preencherArteRealizaram(
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
   NOVA ABA — REALIZARAM
========================================================= */

const lista =
  Array.isArray(
    dados?.registros
  )
    ? dados.registros
        .filter(
          pessoa =>
            pessoa.situacao ===
            "REALIZOU"
        )
        .map(
          pessoa => ({

            nome:
              pessoa.nome,

            username:
              pessoa.username,

            area:
              pessoa.area ||
              "SEM ÁREA",

            setor:
              ajustarSetorNaArte(
                pessoa.nome,
                pessoa.setor
              ) ||
              "SEM SETOR",

            local:
              pessoa.local ||
              "-",

            tempo:
              pessoa.tempo ||
              "-",

            minutos:
              pessoa.minutos ||
              0,

            unidades:
              pessoa.unidades ||
              0,

            produtividade:
              pessoa.produtividade ||
              0

          })
        )
    : [];
  /* =======================================================
     TOTAL
  ======================================================= */

  if (total) {

    total.textContent =
      lista.length;

  }


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  /* =======================================================
     SEM DADOS
  ======================================================= */

  if (
    lista.length ===
    0
  ) {

    container.innerHTML = `

      <div
        style="
          padding:30px 20px;
          text-align:center;
          color:#667085;
          font-size:14px;
        "
      >

        Nenhuma pessoa realizada encontrada para o mês atual.

      </div>

    `;


    return;

  }


  /* =======================================================
     CRIAR LINHAS
  ======================================================= */

  lista.forEach(
    (
      pessoa,
      indice
    ) => {

      const linha =
        document.createElement(
          "div"
        );


      const fundo =
        indice % 2 === 0
          ? "#ffffff"
          : "#f8f9fb";


      linha.style.cssText = `

        display:grid;

        grid-template-columns:
          2fr
          1fr
          1.35fr
          1.45fr
          .8fr
          .9fr
          1fr;

        gap:8px;

        padding:12px;

        align-items:center;

        border-bottom:1px solid #eceef2;

        background:${fundo};

        color:#1f2937;

        font-size:12px;

        box-sizing:border-box;

      `;


      /* =====================================================
         DADOS
      ===================================================== */

      const nome =
        pessoa.nome ||
        "-";


      const area =
        pessoa.area ||
        "SEM ÁREA";


      const setor =
        pessoa.setor ||
        "SEM SETOR";


      const local =
        pessoa.local ||
        "-";


      const tempo =
        pessoa.tempo ||
        "-";


      const unidades =
        formatarNumeroRealizaram(
          pessoa.unidades,
          0
        );


      const produtividade =
        formatarNumeroRealizaram(
          pessoa.produtividade,
          1
        );


      linha.innerHTML = `

        <span
          style="
            font-weight:800;
            color:#071b61;
            line-height:1.3;
          "
        >
          ${escaparHTML(
            nome
          )}
        </span>


        <span
          style="
            font-weight:700;
          "
        >
          ${escaparHTML(
            area
          )}
        </span>


        <span>
          ${escaparHTML(
            setor
          )}
        </span>


        <span
          style="
            font-weight:700;
            color:#344054;
          "
        >
          ${escaparHTML(
            local
          )}
        </span>


        <span
          style="
            text-align:center;
            font-weight:700;
          "
        >
          ${escaparHTML(
            tempo
          )}
        </span>


        <span
          style="
            text-align:center;
            font-weight:800;
            color:#071b61;
          "
        >
          ${unidades}
        </span>


        <span
          style="
            text-align:center;
            font-weight:800;
            color:#147a4b;
          "
        >
          ${produtividade}
        </span>

      `;


      container.appendChild(
        linha
      );

    }
  );

}


/* =========================================================
   FORMATAR NÚMEROS — REALIZARAM
========================================================= */

function formatarNumeroRealizaram(
  valor,
  casasDecimais = 0
) {

  const numero =
    Number(
      valor
    );


  if (
    !Number.isFinite(
      numero
    )
  ) {

    return "0";

  }


  return numero.toLocaleString(
    "pt-BR",
    {

      minimumFractionDigits:
        casasDecimais,

      maximumFractionDigits:
        casasDecimais

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


  const resumoHc =
    $("resumo-hc");

  const resumoRealizaram =
    $("resumo-realizaram");

  const resumoProcesso =
    $("resumo-processo");

  const resumoNao =
    $("resumo-nao");


  if (resumoHc) {

    resumoHc.textContent =
      geral.hc;

  }


  if (resumoRealizaram) {

    resumoRealizaram.textContent =
      geral.realizaram;

  }


  if (resumoProcesso) {

    resumoProcesso.textContent =
      geral.processo;

  }


  if (resumoNao) {

    resumoNao.textContent =
      geral.naoRealizaram;

  }


  /* =======================================================
     PERCENTUAIS DOS CARDS
  ======================================================= */

  const percentualRealizaram =
    $("percentual-resumo-realizaram");


  if (percentualRealizaram) {

    percentualRealizaram.textContent =
      formatarPorcentagem(
        geral.hc > 0
          ? geral.realizaram /
            geral.hc
          : 0
      );

  }


  const percentualProcesso =
    $("percentual-resumo-processo");


  if (percentualProcesso) {

    percentualProcesso.textContent =
      formatarPorcentagem(
        geral.hc > 0
          ? geral.processo /
            geral.hc
          : 0
      );

  }


  const percentualNao =
    $("percentual-resumo-nao");


  if (percentualNao) {

    percentualNao.textContent =
      formatarPorcentagem(
        geral.hc > 0
          ? geral.naoRealizaram /
            geral.hc
          : 0
      );

  }


  const situacaoAtual =
    $("situacao-atual");


  if (situacaoAtual) {

    situacaoAtual.textContent =
      formatarPorcentagem(
        geral.percentual
      );

  }

}


/* =========================================================
   META
========================================================= */

function preencherMeta(
  dados
) {

  const {
    hc,
    realizaram,
    percentual
  } = dados.geral;


  const minimo =
    Math.ceil(
      hc *
      TARGET
    );


  const faltam =
    Math.max(
      0,
      minimo -
      realizaram
    );


  const percentualMeta =
    $("percentual-meta-dashboard");


  if (percentualMeta) {

    percentualMeta.textContent =
      formatarPorcentagem(
        percentual
      );

  }


  const textoProgresso =
    $("texto-progresso-meta");


  if (textoProgresso) {

    textoProgresso.textContent =
      `${formatarPorcentagem(percentual)} de 90%`;

  }


  const barra =
    $("barra-meta-preenchida");


  if (barra) {

    barra.style.width =
      `${Math.min(
        100,
        percentual *
        100
      )}%`;

  }


  const situacaoFaltam =
    $("situacao-faltam");


  if (situacaoFaltam) {

    situacaoFaltam.textContent =
      faltam;

  }


  const statusMeta =
    $("status-meta");


  const mensagemMeta =
    $("mensagem-meta");


  const tituloSituacao =
    $("titulo-situacao");


  const descricaoSituacao =
    $("descricao-situacao");


  if (
    faltam ===
    0
  ) {

    if (statusMeta) {

      statusMeta.textContent =
        "🏆 META BATIDA";

    }


    if (mensagemMeta) {

      mensagemMeta.textContent =
        `Meta atingida com ${realizaram} pessoas realizando.`;

    }


    if (tituloSituacao) {

      tituloSituacao.textContent =
        "Meta do mês atingida";

    }


    if (descricaoSituacao) {

      descricaoSituacao.textContent =
        "O resultado já alcançou ou superou o target de 90%.";

    }

  }

  else {

    if (statusMeta) {

      statusMeta.textContent =
        "Target: 90%";

    }


    if (mensagemMeta) {

      mensagemMeta.textContent =
        `Faltam ${faltam} pessoa${faltam === 1 ? "" : "s"} para atingir o target.`;

    }


    if (tituloSituacao) {

      tituloSituacao.textContent =
        "Meta em andamento";

    }


    if (descricaoSituacao) {

      descricaoSituacao.textContent =
        `${realizaram} pessoas realizaram. Faltam ${faltam} para chegar aos 90%.`;

    }

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


  const percentualGeral =
    $("percentual-geral");


  if (percentualGeral) {

    percentualGeral.textContent =
      formatarPorcentagem(
        percentual
      );

  }


  const arteRealizaram =
    $("arte-geral-realizaram");


  if (arteRealizaram) {

    arteRealizaram.textContent =
      realizaram;

  }


  const arteProcesso =
    $("arte-geral-processo");


  if (arteProcesso) {

    arteProcesso.textContent =
      processo;

  }


  const arteNao =
    $("arte-geral-nao");


  if (arteNao) {

    arteNao.textContent =
      naoRealizaram;

  }


  const arteHc =
    $("arte-geral-hc");


  if (arteHc) {

    arteHc.textContent =
      hc;

  }


  const pctRealizaram =
    $("arte-percentual-realizaram");


  if (pctRealizaram) {

    pctRealizaram.textContent =
      formatarPorcentagem(
        hc
          ? realizaram /
            hc
          : 0
      );

  }


  const pctProcesso =
    $("arte-percentual-processo");


  if (pctProcesso) {

    pctProcesso.textContent =
      formatarPorcentagem(
        hc
          ? processo /
            hc
          : 0
      );

  }


  const pctNao =
    $("arte-percentual-nao");


  if (pctNao) {

    pctNao.textContent =
      formatarPorcentagem(
        hc
          ? naoRealizaram /
            hc
          : 0
      );

  }


  /* =======================================================
     RESULTADO POR ÁREA
  ======================================================= */

  preencherTabelaAreas(
    dados
  );

}


/* =========================================================
   TABELA RESULTADO POR ÁREA
========================================================= */

function preencherTabelaAreas(
  dados
) {

  const container =
    $("lista-areas");


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  /* =======================================================
     ORDEM FIXA
  ======================================================= */

  const ordem = [

    "Outbound",
    "Inbound",
    "OPEX",
    "ICQA",
    "Line Haul"

  ];


  ordem.forEach(
    areaNome => {

      const area =
        dados.areas[
          areaNome
        ];


      if (!area) {

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
      semCadastro.length > 0
        ? realizaram /
          semCadastro.length
        : 0;


    const linha =
      document.createElement(
        "div"
      );


    linha.className =
      "area-row";


    linha.innerHTML = `

      <span>
        ⚠️ SEM CADASTRO
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
     CRIAR CARD

     O card será inserido antes do resumo.
  ======================================================= */

  if (!card) {

    card =
      document.createElement(
        "section"
      );


    card.id =
      "alerta-sem-cadastro-area";


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


  if (!card) {

    return;

  }


  /* =======================================================
     ESTILO
  ======================================================= */

  card.style.cssText = `

    margin: 18px 0;

    padding: 18px 20px;

    border-radius: 16px;

    border: 1px solid #f1c84c;

    border-left: 6px solid #f4b400;

    background: #fff9e6;

    color: #332600;

    box-sizing: border-box;

    box-shadow: 0 8px 22px rgba(0, 0, 0, .05);

  `;


  /* =======================================================
     ZERO PENDÊNCIAS
  ======================================================= */

  if (
    pessoas.length ===
    0
  ) {

    card.style.border =
      "1px solid #bde8d0";


    card.style.borderLeft =
      "6px solid #22a86a";


    card.style.background =
      "#f2fff8";


    card.style.color =
      "#12633e";


    card.innerHTML = `

      <div
        style="
          display:flex;
          align-items:center;
          gap:10px;
          font-weight:800;
        "
      >

        <span
          style="
            font-size:20px;
          "
        >
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
     NOMES
  ======================================================= */

  const nomes =
    pessoas
      .slice()
      .sort(
        ordenarNome
      )
      .map(
        pessoa => {

          const complemento =
            pessoa.username
              ? ` <small style="color:#8a751f;">(${escaparHTML(pessoa.username)})</small>`
              : "";


          return `

            <li
              style="
                margin:6px 0;
                break-inside:avoid;
              "
            >

              <strong>
                ${escaparHTML(
                  pessoa.nome
                )}
              </strong>

              ${complemento}

            </li>

          `;

        }
      )
      .join(
        ""
      );


  card.innerHTML = `

    <div
      style="
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:20px;
        flex-wrap:wrap;
      "
    >

      <div
        style="
          flex:1;
          min-width:260px;
        "
      >

        <div
          style="
            color:#9a6b00;
            font-size:12px;
            font-weight:900;
            letter-spacing:.07em;
            margin-bottom:5px;
          "
        >
          ⚠️ CADASTRO DE ÁREAS PENDENTE
        </div>


        <div
          style="
            color:#071b61;
            font-size:19px;
            font-weight:900;
            margin-bottom:5px;
          "
        >

          ${pessoas.length}
          pessoa${pessoas.length === 1 ? "" : "s"}
          sem área cadastrada

        </div>


        <div
          style="
            color:#67551f;
            font-size:14px;
            line-height:1.45;
          "
        >

          ${pessoas.length === 1 ? "Essa pessoa está" : "Essas pessoas estão"}
          no HC Geral, porém ainda
          ${pessoas.length === 1 ? "não foi distribuída" : "não foram distribuídas"}
          entre Outbound, Inbound, OPEX, ICQA ou Line Haul.

        </div>

      </div>


      <button
        type="button"
        id="botao-toggle-sem-cadastro"
        style="
          border:0;
          border-radius:12px;
          background:#071b61;
          color:#ffffff;
          padding:11px 17px;
          font-weight:800;
          cursor:pointer;
          white-space:nowrap;
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
        margin-top:16px;
        padding-top:14px;
        border-top:1px solid #ecd88b;
      "
    >

      <div
        style="
          font-size:13px;
          color:#67551f;
          margin-bottom:10px;
        "
      >

        Cadastre
        ${pessoas.length === 1 ? "esta pessoa" : "estas pessoas"}
        na aba

        <strong>
          CADASTRO_AREAS
        </strong>.

      </div>


      <ul
        style="
          margin:0;
          padding-left:22px;
          columns:2;
          column-gap:40px;
        "
      >

        ${nomes}

      </ul>

    </div>

  `;


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

      if (!lista) {

        return;

      }


      const aberto =
        lista.style.display ===
        "block";


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
   LISTAS COM EXCEÇÕES
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


  const naoRealizaram =
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


  const totalProcesso =
    $("total-processo");


  if (totalProcesso) {

    totalProcesso.textContent =
      processo.length;

  }


  const totalNao =
    $("total-nao");


  if (totalNao) {

    totalNao.textContent =
      naoRealizaram.length;

  }


  const totalGuembaPendente =
    $("total-guemba-pendente");


  if (totalGuembaPendente) {

    totalGuembaPendente.textContent =
      guembaPendente.length;

  }


  const totalGuembaProcessando =
    $("total-guemba-processando");


  if (totalGuembaProcessando) {

    totalGuembaProcessando.textContent =
      guembaProcessando.length;

  }


  montarListaComTempo(
    processo,
    "listas-processo"
  );


  montarListaSemTempo(
    naoRealizaram,
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
    total <=
    14
  ) {

    return 1;

  }


  if (
    total <=
    28
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
    !Array.isArray(lista) ||
    lista.length ===
    0
  ) {

    return [];

  }


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
  )
    .filter(
      grupo =>
        grupo.length >
        0
    );

}
/* =========================================================
   MONTAR LISTA COM TEMPO
========================================================= */

function montarListaComTempo(
  pessoas,
  idContainer
) {

  const container =
    $(
      idContainer
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    !Array.isArray(pessoas) ||
    pessoas.length ===
    0
  ) {

    container.className =
      "listas-grid colunas-1";


    container.innerHTML = `

      <div class="tabela">

        <div
          class="linha-pessoa processo"
          style="
            grid-template-columns:1fr;
            text-align:center;
          "
        >

          <div>
            Nenhuma pessoa nesta lista.
          </div>

        </div>

      </div>

    `;


    return;

  }


  const colunas =
    quantidadeColunas(
      pessoas.length
    );


  container.className =
    `listas-grid colunas-${colunas}`;


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
                    pessoa.setor ||
                    "SEM SETOR"
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
   MONTAR LISTA SEM TEMPO
========================================================= */

function montarListaSemTempo(
  pessoas,
  idContainer
) {

  const container =
    $(
      idContainer
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    !Array.isArray(pessoas) ||
    pessoas.length ===
    0
  ) {

    container.className =
      "listas-grid colunas-1";


    container.innerHTML = `

      <div class="tabela">

        <div
          class="linha-pessoa nao-realizou"
          style="
            grid-template-columns:1fr;
            text-align:center;
          "
        >

          <div>
            Nenhuma pessoa nesta lista.
          </div>

        </div>

      </div>

    `;


    return;

  }


  const colunas =
    quantidadeColunas(
      pessoas.length
    );


  container.className =
    `listas-grid colunas-${colunas}`;


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
                    pessoa.setor ||
                    "SEM SETOR"
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

  if (!dadosProcessados) {

    return alert(
      "Carregue os dados antes de adicionar uma exceção."
    );

  }


  const campoNome =
    $("excecao-nome");


  const campoMotivo =
    $("excecao-motivo");


  if (
    !campoNome ||
    !campoMotivo
  ) {

    return;

  }


  const nomeDigitado =
    limparTexto(
      campoNome.value
    );


  const motivo =
    limparTexto(
      campoMotivo.value
    );


  if (!nomeDigitado) {

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


  if (!pessoa) {

    return alert(
      "Nome não encontrado na base atual."
    );

  }


  const jaExiste =
    excecoes.some(
      excecao =>
        normalizarTexto(
          excecao.nome
        ) ===
        normalizarTexto(
          pessoa.nome
        )
    );


  if (jaExiste) {

    return alert(
      "Essa pessoa já está ocultada das listas."
    );

  }


  excecoes.push(
    {
      nome:
        pessoa.nome,

      motivo:
        motivo ||
        "Outro"
    }
  );


  salvarExcecoes();


  campoNome.value =
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


  if (dadosProcessados) {

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
    !lista ||
    !dadosProcessados
  ) {

    return;

  }


  lista.innerHTML =
    "";


  dadosProcessados.registros
    .slice()
    .sort(
      ordenarNome
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
    excecoes.length ===
    0
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
        a,
        b
      ) =>
        a.nome.localeCompare(
          b.nome,
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
          ?.addEventListener(
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
   BAIXAR ARTE
========================================================= */

async function baixarArteAtual() {

  const arte =
    $(
      `arte-${arteAtual}`
    );


  if (!arte) {

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
    botaoBaixar?.textContent ||
    "Baixar PNG";


  try {

    if (botaoBaixar) {

      botaoBaixar.disabled =
        true;

      botaoBaixar.textContent =
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

  catch (erro) {

    console.error(
      erro
    );


    alert(
      `Não foi possível gerar o PNG.\n\n${erro.message}`
    );

  }

  finally {

    if (botaoBaixar) {

      botaoBaixar.disabled =
        false;

      botaoBaixar.textContent =
        textoOriginal;

    }

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

        if (imagem.complete) {

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
   CRIAR ESTRUTURA DE ÁREAS
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
   CALCULAR GERAL
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
    geral.hc > 0
      ? geral.realizaram /
        geral.hc
      : 0;


  return geral;

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
      "OUTBOUND" ||
    texto ===
      "OUT" ||
    texto.includes(
      "OUTBOUND"
    )
  ) {

    return "Outbound";

  }


  if (
    texto ===
      "INBOUND" ||
    texto ===
      "IN" ||
    texto.includes(
      "INBOUND"
    )
  ) {

    return "Inbound";

  }


  if (
    texto ===
      "OPEX" ||
    texto.includes(
      "OPEX"
    )
  ) {

    return "OPEX";

  }


  if (
    texto ===
      "ICQA" ||
    texto.includes(
      "ICQA"
    )
  ) {

    return "ICQA";

  }


  if (
    texto ===
      "LINE HAUL" ||
    texto ===
      "LINEHAUL" ||
    texto.includes(
      "LINE HAUL"
    ) ||
    texto.includes(
      "LINEHAUL"
    )
  ) {

    return "Line Haul";

  }


  return "";

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


  if (!texto) {

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
    horas *
    60
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


      if (!mes) {

        return;

      }


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
  );


  const maior =
    Object.entries(
      contagem
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
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

  if (!statusArquivo) {

    return;

  }


  statusArquivo.textContent =
    texto;


  statusArquivo.className =
    "status-arquivo";


  if (classe) {

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

  if (
    !objeto ||
    typeof objeto !==
      "object"
  ) {

    return "";

  }


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

    const nomeNormalizado =
      normalizarTexto(
        nome
      );


    const chave =
      chaves.find(
        chaveAtual =>
          normalizarTexto(
            chaveAtual
          ) ===
          nomeNormalizado
      );


    if (chave) {

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

  return limparTexto(
    pessoaA?.nome
  )
    .localeCompare(
      limparTexto(
        pessoaB?.nome
      ),
      "pt-BR"
    );

}


function ordenarTempoNome(
  pessoaA,
  pessoaB
) {

  const minutosA =
    Number(
      pessoaA?.minutos
    ) ||
    0;


  const minutosB =
    Number(
      pessoaB?.minutos
    ) ||
    0;


  if (
    minutosB !==
    minutosA
  ) {

    return (
      minutosB -
      minutosA
    );

  }


  return ordenarNome(
    pessoaA,
    pessoaB
  );

}
/* =========================================================
   EXTENSÃO
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


/* =========================================================
   FINAL
========================================================= */

console.log(
  "✅ script.js V2.2 carregado por completo"
);
