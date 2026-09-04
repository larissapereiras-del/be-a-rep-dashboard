console.log("✅ CENTRAL BE A REP V2.4 — Gemba + Be a Rep + filtro de mês");


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const API_DADOS =
  "/api/dados";


const TARGET =
  0.90;


const STORAGE_EXCECOES =
  "be-a-rep-excecoes-v1";


const AREAS_VALIDAS = [

  "Outbound",
  "Inbound",
  "OPEX",
  "ICQA",
  "Line Haul"

];


/* =========================================================
   ESTADO DA APLICAÇÃO
========================================================= */

let dadosProcessados =
  null;


/*
 * Guarda a resposta completa da API.
 *
 * Isso é importante porque, ao trocar o mês,
 * não precisamos consultar o Verdi novamente.
 *
 * Apenas reprocessamos os dados que já foram
 * carregados.
 */

let dadosApiBrutos =
  [];


/*
 * Mês atualmente selecionado no filtro.
 *
 * Ao abrir a página, começa automaticamente
 * com o mês atual do computador.
 *
 * Exemplo:
 * SETEMBRO-2026
 */

let referenciaSelecionada =
  obterReferenciaMesAtual();


let arteAtual =
  "geral";


let excecoes =
  carregarExcecoes();


/* =========================================================
   ATALHO PARA ELEMENTOS
========================================================= */

const $ =
  id =>
    document.getElementById(
      id
    );


/*
 * Procura o primeiro ID disponível.
 * Mantém compatibilidade entre o HTML antigo
 * e o novo layout do dashboard.
 */

const obterElementoPorIds =
  (...ids) => {

    for (
      const id of ids
    ) {

      const elemento =
        document.getElementById(
          id
        );


      if (
        elemento
      ) {

        return elemento;

      }

    }


    return null;

  };


const inputArquivo =
  $("arquivo-base");


const statusArquivo =
  $("status-arquivo");


const resumoDados =
  $("resumo-dados");


const menuArtes =
  $("menu-artes");


const areaArtes =
  $("area-artes");


const botaoBaixar =
  $("baixar-png");


const botaoAtualizar =
  $("botao-atualizar");


const textoAtualizacao =
  $("texto-atualizacao");


/*
 * Seletor de mês criado no index.html.
 */

const filtroMes =
  $("filtro-mes");


const botoesArte =
  document.querySelectorAll(
    ".art-tab"
  );


/* =========================================================
   CONSULTA RÁPIDA — ELEMENTOS
========================================================= */

const consultaPessoa =
  $("consulta-pessoa");


const listaPessoasConsulta =
  $("lista-pessoas-consulta");


const botaoConsultarPessoa =
  $("botao-consultar-pessoa");


const consultaVazia =
  $("consulta-vazia");


const consultaResultado =
  $("consulta-resultado");


const consultaStatusGeral =
  $("consulta-status-geral");


const consultaNome =
  $("consulta-nome");


const consultaUsername =
  $("consulta-username");


const consultaArea =
  $("consulta-area");


const consultaSetor =
  $("consulta-setor");


const consultaGemba =
  $("consulta-gemba");


const consultaBeRep =
  $("consulta-berep");


const consultaTempo =
  $("consulta-tempo");


const consultaMetaTempo =
  $("consulta-meta-tempo");


const consultaLocal =
  $("consulta-local");


const consultaPecas =
  $("consulta-pecas");


const consultaProdutividade =
  $("consulta-produtividade");


const consultaTempoRestante =
  $("consulta-tempo-restante");


/* =========================================================
   JORNADA GEMBA → BE A REP — ELEMENTOS
========================================================= */

const jornadaBeRepConcluido =
  $("jornada-berep-concluido");


/* =========================================================
   DESEMPENHO POR ÁREA — ELEMENTOS
========================================================= */

const rankingAreas =
  $("ranking-areas");


const listaAreasDashboard =
  $("lista-areas-dashboard");


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    configurarEventos();


    renderizarExcecoes();


    /*
     * Antes mesmo da resposta do Verdi,
     * mostramos o mês atual no cabeçalho.
     */

    preencherMes(
      formatarReferenciaFiltro(
        referenciaSelecionada
      )
    );


    /*
     * Busca os dados normalmente.
     */

    await carregarDadosAutomaticos();

  }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {


  /* =======================================================
     ATUALIZAR DADOS
  ======================================================= */

  botaoAtualizar
    ?.addEventListener(
      "click",
      carregarDadosAutomaticos
    );


  /* =======================================================
     FILTRO DE MÊS
  ======================================================= */

  filtroMes
    ?.addEventListener(
      "change",
      () => {

        const novaReferencia =
          filtroMes.value;


        if (
          !novaReferencia
        ) {

          return;

        }


        referenciaSelecionada =
          novaReferencia;


        console.log(
          "📅 Novo mês selecionado:",
          referenciaSelecionada
        );


        /*
         * Se ainda não temos os dados da API,
         * não existe nada para reprocessar.
         */

        if (
          !Array.isArray(
            dadosApiBrutos
          ) ||
          dadosApiBrutos.length ===
            0
        ) {

          return;

        }


        try {

          /*
           * Reprocessa a mesma resposta do Verdi,
           * agora usando o mês escolhido.
           */

          dadosProcessados =
            processarDadosApi(
              dadosApiBrutos,
              referenciaSelecionada
            );


          atualizarTudo();


          atualizarStatus(
            `✅ Exibindo dados de ${formatarReferenciaFiltro(referenciaSelecionada)}.`,
            "sucesso"
          );


          if (
            textoAtualizacao
          ) {

            textoAtualizacao.textContent =
              `Dados de ${formatarReferenciaFiltro(referenciaSelecionada)} carregados. Você pode selecionar outro mês quando quiser.`;

          }

        }

        catch (
          erro
        ) {

          console.error(
            "❌ Erro ao trocar o mês:",
            erro
          );


          /*
           * O mês continua selecionado mesmo que
           * ainda não possua registros.
           */

          preencherMes(
            formatarReferenciaFiltro(
              referenciaSelecionada
            )
          );


          atualizarStatus(
            `⚠️ Não há dados obrigatórios disponíveis para ${formatarReferenciaFiltro(referenciaSelecionada)}.`,
            "erro"
          );


          if (
            textoAtualizacao
          ) {

            textoAtualizacao.textContent =
              `Não foram encontrados dados obrigatórios para ${formatarReferenciaFiltro(referenciaSelecionada)}. Selecione outro mês no filtro.`;

          }


          ocultarDashboard();

        }

      }
    );


  /* =======================================================
     CARREGAR ARQUIVO MANUAL
  ======================================================= */

  inputArquivo
    ?.addEventListener(
      "change",
      async evento => {

        const arquivo =
          evento.target.files?.[0];


        if (
          arquivo
        ) {

          await processarArquivo(
            arquivo
          );

        }

      }
    );


  /* =======================================================
     TROCAR ARTES
  ======================================================= */

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


  /* =======================================================
     BAIXAR ARTE
  ======================================================= */

  botaoBaixar
    ?.addEventListener(
      "click",
      baixarArteAtual
    );


  /* =======================================================
     EXCEÇÕES
  ======================================================= */

  obterElementoPorIds(
    "botao-adicionar-excecao",
    "adicionar-excecao"
  )
    ?.addEventListener(
      "click",
      adicionarExcecao
    );


  /* =======================================================
     CONSULTA RÁPIDA
  ======================================================= */

  botaoConsultarPessoa
    ?.addEventListener(
      "click",
      consultarPessoaSelecionada
    );


  consultaPessoa
    ?.addEventListener(
      "keydown",
      evento => {

        if (
          evento.key ===
          "Enter"
        ) {

          evento.preventDefault();

          consultarPessoaSelecionada();

        }

      }
    );


  consultaPessoa
    ?.addEventListener(
      "input",
      () => {

        if (
          !consultaPessoa.value.trim()
        ) {

          limparResultadoConsulta();

        }

      }
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


    /* =====================================================
       ESTADO DE CARREGAMENTO
    ===================================================== */

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
        "Buscando os dados mais recentes da base...";

    }


    atualizarStatus(
      "Conectando à base...",
      ""
    );


    /* =====================================================
       CONSULTAR API
    ===================================================== */

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


    /* =====================================================
       VALIDAR RESPOSTA
    ===================================================== */

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


    /* =====================================================
       RECEBER REGISTROS
    ===================================================== */

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


    console.log(
      "📥 Registros recebidos da API:",
      registros.length
    );


    /* =====================================================
       GUARDAR BASE COMPLETA
    ===================================================== */

    dadosApiBrutos =
      registros;


    /*
     * Montamos as opções do seletor
     * utilizando os meses existentes na Query.
     */

    montarFiltroMes(
      dadosApiBrutos
    );


    /* =====================================================
       MÊS INICIAL
    ===================================================== */

    /*
     * Sempre tentamos abrir primeiro no mês atual.
     */

    referenciaSelecionada =
      obterReferenciaMesAtual();


    if (
      filtroMes
    ) {

      filtroMes.value =
        referenciaSelecionada;

    }


    /* =====================================================
       PROCESSAR MÊS ATUAL
    ===================================================== */

    try {

      dadosProcessados =
        processarDadosApi(
          dadosApiBrutos,
          referenciaSelecionada
        );

    }

    catch (
      erroMesAtual
    ) {

      /*
       * Se virou o mês e a Query ainda não possui
       * registros do mês novo, mantemos o seletor
       * disponível para consultar meses anteriores.
       */

      console.warn(
        "⚠️ Mês atual ainda sem dados:",
        erroMesAtual
      );


      preencherMes(
        formatarReferenciaFiltro(
          referenciaSelecionada
        )
      );


      atualizarStatus(
        `⚠️ Ainda não há dados obrigatórios para ${formatarReferenciaFiltro(referenciaSelecionada)}. Selecione outro mês no filtro.`,
        "erro"
      );


      if (
        textoAtualizacao
      ) {

        textoAtualizacao.textContent =
          `A base foi carregada, mas ${formatarReferenciaFiltro(referenciaSelecionada)} ainda não possui registros obrigatórios. Você pode selecionar um mês anterior.`;

      }


      ocultarDashboard();


      return;

    }


    /* =====================================================
       LOG
    ===================================================== */

    console.log(
      "📊 RESULTADO PROCESSADO",
      {

        referencia:
          referenciaSelecionada,

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


    /* =====================================================
       ATUALIZAR DASHBOARD
    ===================================================== */

    atualizarTudo();


    /* =====================================================
       HORÁRIO
    ===================================================== */

   /* =========================================================
   CONVERTER VALOR NUMÉRICO DA QUERY
========================================================= */
/*
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


  if (
    !texto
  ) {

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

  if (
    !registros.length
  ) {

    throw new Error(
      `Nenhuma pessoa obrigatória foi encontrada para ${formatarReferenciaFiltro(referenciaSelecionada)}.`
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
         ÁREA OPERACIONAL

         Head Site não entra nas áreas,
         mas continua normalmente no HC Geral.
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
         CLASSIFICAÇÃO DAS ABAS

         BE A REP:
         - OPEX conclui com 10 minutos ou mais
         - Demais áreas concluem com 60 minutos ou mais

         GEMBA:
         - É tratado separadamente do Be a Rep
      =================================================== */

      const realizouBeARep =
        beRepConcluido(
          pessoa
        );


      const beARepEmProcesso =
        beRepEmProcesso(
          pessoa
        );


      const fezGemba =
        gembaConcluido(
          pessoa.gemba
        );


      const iniciouBeARep =
        beRepIniciado(
          pessoa
        );


      /* ===================================================
         REALIZARAM O BE A REP
      =================================================== */

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
         BE A REP EM PROCESSO
      =================================================== */

      if (
        beARepEmProcesso
      ) {

        processo.push(
          criarPessoaLista(
            pessoa,
            true
          )
        );

      }


      /* ===================================================
         NÃO REALIZARAM

         Não fez Gemba
         e não iniciou Be a Rep.
      =================================================== */

      if (
        !fezGemba &&
        !iniciouBeARep
      ) {

        naoRealizaram.push(
          criarPessoaLista(
            pessoa,
            false
          )
        );

      }


      /* ===================================================
         GEMBA FEITO
         Be a Rep ainda não iniciado.
      =================================================== */

      if (
        fezGemba &&
        !iniciouBeARep
      ) {

        guembaPendenteBeARep.push(
          criarPessoaLista(
            pessoa,
            false
          )
        );

      }


      /* ===================================================
         GEMBA + BE A REP EM PROCESSO
      =================================================== */

      if (
        fezGemba &&
        beARepEmProcesso
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
    "✅ Realizaram o Be a Rep:",
    realizaramDetalhe.length
  );


  console.log(
    "⏳ Be a Rep em processo:",
    processo.length
  );


  console.log(
    "📋 Gemba feito / Be a Rep não iniciado:",
    guembaPendenteBeARep.length
  );


  console.log(
    "🔄 Gemba + Be a Rep em processo:",
    guembaProcessandoBeARep.length
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


  preencherArteRealizaram(
    dadosProcessados
  );


  preencherListasComExcecoes();


  preencherDatalistExcecoes();


  /* =======================================================
     NOVO DASHBOARD
  ======================================================= */

  preencherDatalistConsulta();


  limparResultadoConsulta();


  preencherJornadaBeARep();


  preencherDesempenhoAreas();


  /* =======================================================
     EXCEÇÕES
  ======================================================= */

  renderizarExcecoes();


  /* =======================================================
     EXIBIÇÃO
  ======================================================= */

  exibirDashboard();


  mostrarArte(
    "geral"
  );

}


/* =========================================================
   JORNADA GEMBA → BE A REP
========================================================= */

function preencherJornadaBeARep() {

  if (
    !dadosProcessados
  ) {

    return;

  }


  const registros =
    Array.isArray(
      dadosProcessados.registros
    )
      ? dadosProcessados.registros
      : [];


  const gembaPendente =
    Array.isArray(
      dadosProcessados.guembaPendenteBeARep
    )
      ? dadosProcessados.guembaPendenteBeARep.length
      : 0;


  const gembaProcessando =
    Array.isArray(
      dadosProcessados.guembaProcessandoBeARep
    )
      ? dadosProcessados.guembaProcessandoBeARep.length
      : 0;


  /*
   * Importante:
   *
   * Aqui queremos exclusivamente
   * Be a Rep CONCLUÍDO.
   *
   * Não usamos geral.realizaram,
   * porque o Resumo Geral também considera Gemba.
   */

  const beRepConcluidoTotal =
    registros.filter(
      pessoa =>
        beRepConcluido(
          pessoa
        )
    ).length;


  const elementoGembaPendente =
    $("resumo-gemba-pendente");


  const elementoGembaProcessando =
    $("resumo-gemba-processo");


  if (
    elementoGembaPendente
  ) {

    elementoGembaPendente.textContent =
      gembaPendente;

  }


  if (
    elementoGembaProcessando
  ) {

    elementoGembaProcessando.textContent =
      gembaProcessando;

  }


  if (
    jornadaBeRepConcluido
  ) {

    jornadaBeRepConcluido.textContent =
      beRepConcluidoTotal;

  }

}


/* =========================================================
   DESEMPENHO POR ÁREA
========================================================= */

function preencherDesempenhoAreas() {

  if (
    !dadosProcessados?.areas
  ) {

    return;

  }


  preencherRankingAreas(
    dadosProcessados
  );


  preencherTabelaAreasDashboard(
    dadosProcessados
  );

}


/* =========================================================
   RANKING DE ÁREAS
========================================================= */

function preencherRankingAreas(
  dados
) {

  if (
    !rankingAreas
  ) {

    return;

  }


  rankingAreas.innerHTML =
    "";


  const areas =
    dados?.areas ||
    {};


  const ranking =
    AREAS_VALIDAS
      .map(
        nomeArea => {

          const dadosArea =
            areas[
              nomeArea
            ] || {

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


          return {

            nome:
              nomeArea,

            hc:
              Number(
                dadosArea.hc
              ) ||
              0,

            realizaram:
              Number(
                dadosArea.realizaram
              ) ||
              0,

            processo:
              Number(
                dadosArea.processo
              ) ||
              0,

            naoRealizaram:
              Number(
                dadosArea.naoRealizaram
              ) ||
              0,

            percentual:
              Number(
                dadosArea.percentual
              ) ||
              0

          };

        }
      )
      .sort(
        (
          a,
          b
        ) => {

          if (
            b.percentual !==
            a.percentual
          ) {

            return (
              b.percentual -
              a.percentual
            );

          }


          if (
            b.realizaram !==
            a.realizaram
          ) {

            return (
              b.realizaram -
              a.realizaram
            );

          }


          return a.nome.localeCompare(
            b.nome,
            "pt-BR"
          );

        }
      );


  ranking.forEach(
    (
      area,
      indice
    ) => {

      const percentualNumero =
        Math.max(
          0,
          Math.min(
            100,
            area.percentual *
              100
          )
        );


      const classeStatus =
        obterClasseRankingArea(
          area.percentual
        );


      const item =
        document.createElement(
          "div"
        );


      item.className =
        `area-rank-item ${classeStatus}`;


      item.innerHTML = `

        <div class="area-rank-position">

          ${indice + 1}

        </div>


        <div class="area-rank-content">

          <div class="area-rank-top">

            <div class="area-rank-name">

              <strong>
                ${escaparHTML(
                  area.nome
                )}
              </strong>

              <span class="area-rank-hc">
                HC ${area.hc}
              </span>

            </div>


            <strong class="area-rank-percent">

              ${formatarPorcentagem(
                area.percentual
              )}

            </strong>

          </div>


          <div class="area-progress">

            <div
              class="area-progress-fill"
              style="width:${percentualNumero}%;"
            >
            </div>

          </div>


          <div class="area-rank-bottom">

            <span>
              ✅ ${area.realizaram} realizaram
            </span>

            <span>
              ⏳ ${area.processo} em processo
            </span>

            <span>
              ⚠️ ${area.naoRealizaram} não realizaram
            </span>

          </div>

        </div>

      `;


      rankingAreas.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   CLASSIFICAÇÃO VISUAL DA ÁREA
========================================================= */

function obterClasseRankingArea(
  percentual
) {

  const valor =
    Number(
      percentual
    ) ||
    0;


  if (
    valor >=
    TARGET
  ) {

    return "rank-ok";

  }


  if (
    valor >
    0
  ) {

    return "rank-atencao";

  }


  return "rank-critico";

}


/* =========================================================
   TABELA DETALHADA DAS ÁREAS
========================================================= */

function preencherTabelaAreasDashboard(
  dados
) {

  if (
    !listaAreasDashboard
  ) {

    return;

  }


  listaAreasDashboard.innerHTML =
    "";


  const areas =
    dados?.areas ||
    {};


  AREAS_VALIDAS.forEach(
    nomeArea => {

      const area =
        areas[
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
        "dashboard-area-row";


      linha.innerHTML = `

        <span>

          ${escaparHTML(
            nomeArea
          )}

        </span>


        <span>

          ${Number(
            area.hc
          ) || 0}

        </span>


        <span class="area-realizados">

          ${Number(
            area.realizaram
          ) || 0}

        </span>


        <span class="area-processo">

          ${Number(
            area.processo
          ) || 0}

        </span>


        <span class="area-nao">

          ${Number(
            area.naoRealizaram
          ) || 0}

        </span>


        <span class="area-percentual">

          ${formatarPorcentagem(
            Number(
              area.percentual
            ) || 0
          )}

        </span>

      `;


      listaAreasDashboard
        .appendChild(
          linha
        );

    }
  );

}


/* =========================================================
   CONSULTA RÁPIDA
========================================================= */

function preencherDatalistConsulta() {

  if (
    !listaPessoasConsulta
  ) {

    return;

  }


  listaPessoasConsulta.innerHTML =
    "";


  const registros =
    Array.isArray(
      dadosProcessados?.registros
    )
      ? dadosProcessados.registros
      : [];


  const pessoasOrdenadas =
    [
      ...registros
    ].sort(
      (
        a,
        b
      ) =>
        String(
          a?.nome ||
          ""
        ).localeCompare(
          String(
            b?.nome ||
            ""
          ),
          "pt-BR"
        )
    );


  pessoasOrdenadas.forEach(
    pessoa => {

      const nome =
        String(
          pessoa?.nome ||
          ""
        ).trim();


      if (
        !nome
      ) {

        return;

      }


      const username =
        String(
          pessoa?.username ||
          ""
        ).trim();


      const option =
        document.createElement(
          "option"
        );


      option.value =
        nome;


      if (
        username
      ) {

        option.label =
          `${username} • ${pessoa?.area || "SEM ÁREA"}`;

      }


      listaPessoasConsulta.appendChild(
        option
      );

    }
  );

}


/* =========================================================
   NORMALIZAR TEXTO DA CONSULTA
========================================================= */

function normalizarTextoConsulta(
  valor
) {

  return String(
    valor ||
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();

}


/* =========================================================
   LOCALIZAR PESSOA
========================================================= */

function localizarPessoaConsulta(
  termo
) {

  const registros =
    Array.isArray(
      dadosProcessados?.registros
    )
      ? dadosProcessados.registros
      : [];


  const busca =
    normalizarTextoConsulta(
      termo
    );


  if (
    !busca
  ) {

    return null;

  }


  const resultadoExato =
    registros.find(
      pessoa => {

        const nome =
          normalizarTextoConsulta(
            pessoa?.nome
          );


        const username =
          normalizarTextoConsulta(
            pessoa?.username
          );


        return (
          nome ===
            busca ||
          username ===
            busca
        );

      }
    );


  if (
    resultadoExato
  ) {

    return resultadoExato;

  }


  return (
    registros.find(
      pessoa => {

        const nome =
          normalizarTextoConsulta(
            pessoa?.nome
          );


        const username =
          normalizarTextoConsulta(
            pessoa?.username
          );


        return (
          nome.includes(
            busca
          ) ||
          username.includes(
            busca
          )
        );

      }
    ) ||
    null
  );

}


/* =========================================================
   EXECUTAR CONSULTA
========================================================= */

function consultarPessoaSelecionada() {

  if (
    !consultaPessoa
  ) {

    return;

  }


  const termo =
    consultaPessoa.value.trim();


  if (
    !termo
  ) {

    limparResultadoConsulta();

    consultaPessoa.focus();

    return;

  }


  const pessoa =
    localizarPessoaConsulta(
      termo
    );


  if (
    !pessoa
  ) {

    mostrarPessoaNaoEncontrada(
      termo
    );

    return;

  }


  preencherResultadoConsulta(
    pessoa
  );

}
     /* =========================================================
   PREENCHER RESULTADO DA CONSULTA
========================================================= */

function preencherResultadoConsulta(
  pessoa
) {

  if (
    !consultaResultado
  ) {

    return;

  }


  const fezGemba =
    gembaConcluido(
      pessoa?.gemba
    );


  const iniciouBeARep =
    beRepIniciado(
      pessoa
    );


  const concluiuBeARep =
    beRepConcluido(
      pessoa
    );


  const emProcesso =
    beRepEmProcesso(
      pessoa
    );


  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  const metaMinutos =
    obterTempoMinimoBeARep(
      pessoa?.area ||
      ""
    );


  const minutosRestantes =
    Math.max(
      0,
      metaMinutos -
        minutos
    );


  /* =======================================================
     STATUS GERAL DA PESSOA
  ======================================================= */

  let textoStatus =
    "NÃO INICIADO";


  let classeStatus =
    "status-nao";


  if (
    concluiuBeARep
  ) {

    textoStatus =
      "BE A REP CONCLUÍDO";


    classeStatus =
      "status-concluido";

  }

  else if (
    fezGemba &&
    emProcesso
  ) {

    textoStatus =
      "GEMBA + BE A REP EM PROCESSO";


    classeStatus =
      "status-processo";

  }

  else if (
    fezGemba &&
    !iniciouBeARep
  ) {

    textoStatus =
      "SOMENTE GEMBA";


    classeStatus =
      "status-gemba";

  }

  else if (
    emProcesso
  ) {

    textoStatus =
      "BE A REP EM PROCESSO";


    classeStatus =
      "status-processo";

  }

  else if (
    fezGemba
  ) {

    textoStatus =
      "GEMBA CONCLUÍDO";


    classeStatus =
      "status-gemba";

  }


  /* =======================================================
     MOSTRAR RESULTADO
  ======================================================= */

  consultaVazia
    ?.classList.add(
      "oculto"
    );


  consultaResultado
    .classList.remove(
      "oculto"
    );


  /* =======================================================
     BADGE PRINCIPAL
  ======================================================= */

  if (
    consultaStatusGeral
  ) {

    consultaStatusGeral.textContent =
      textoStatus;


    consultaStatusGeral.classList.remove(
      "status-concluido",
      "status-processo",
      "status-gemba",
      "status-nao"
    );


    consultaStatusGeral.classList.add(
      classeStatus
    );

  }


  /* =======================================================
     IDENTIFICAÇÃO
  ======================================================= */

  if (
    consultaNome
  ) {

    consultaNome.textContent =
      pessoa?.nome ||
      "SEM NOME";

  }


  if (
    consultaUsername
  ) {

    consultaUsername.textContent =
      pessoa?.username
        ? `@${pessoa.username}`
        : "Sem username";

  }


  if (
    consultaArea
  ) {

    consultaArea.textContent =
      pessoa?.area ||
      "SEM ÁREA";

  }


  if (
    consultaSetor
  ) {

    consultaSetor.textContent =
      pessoa?.setor ||
      pessoa?.setorCadastro ||
      "SEM SETOR";

  }


  /* =======================================================
     GEMBA
  ======================================================= */

  if (
    consultaGemba
  ) {

    consultaGemba.textContent =
      fezGemba
        ? "Concluído"
        : "Não realizado";


    consultaGemba.className =
      fezGemba
        ? "text-success"
        : "text-danger";

  }


  /* =======================================================
     BE A REP
  ======================================================= */

  if (
    consultaBeRep
  ) {

    if (
      concluiuBeARep
    ) {

      consultaBeRep.textContent =
        "Concluído";


      consultaBeRep.className =
        "text-success";

    }

    else if (
      iniciouBeARep
    ) {

      consultaBeRep.textContent =
        "Em processo";


      consultaBeRep.className =
        "text-warning";

    }

    else {

      consultaBeRep.textContent =
        "Não iniciado";


      consultaBeRep.className =
        "text-danger";

    }

  }


  /* =======================================================
     TEMPO REALIZADO
  ======================================================= */

  if (
    consultaTempo
  ) {

    consultaTempo.textContent =
      pessoa?.tempo ||
      `${minutos} min`;

  }


  /* =======================================================
     META DE TEMPO
  ======================================================= */

  if (
    consultaMetaTempo
  ) {

    consultaMetaTempo.textContent =
      `${metaMinutos} min`;

  }


  /* =======================================================
     LOCAL / PROCESSO
  ======================================================= */

  if (
    consultaLocal
  ) {

    consultaLocal.textContent =
      pessoa?.local ||
      "—";

  }


  /* =======================================================
     PEÇAS
  ======================================================= */

  if (
    consultaPecas
  ) {

    const unidades =
      Number(
        pessoa?.unidades
      );


    consultaPecas.textContent =
      Number.isFinite(
        unidades
      )
        ? unidades.toLocaleString(
            "pt-BR",
            {
              maximumFractionDigits:
                0
            }
          )
        : "—";

  }


  /* =======================================================
     PRODUTIVIDADE
  ======================================================= */

  if (
    consultaProdutividade
  ) {

    const produtividade =
      Number(
        pessoa?.produtividade
      );


    consultaProdutividade.textContent =
      Number.isFinite(
        produtividade
      )
        ? produtividade.toLocaleString(
            "pt-BR",
            {
              minimumFractionDigits:
                1,

              maximumFractionDigits:
                1
            }
          )
        : "—";

  }


  /* =======================================================
     TEMPO RESTANTE
  ======================================================= */

  if (
    consultaTempoRestante
  ) {

    consultaTempoRestante.classList.remove(
      "text-success",
      "text-warning",
      "text-danger"
    );


    if (
      concluiuBeARep
    ) {

      consultaTempoRestante.textContent =
        "Meta atingida";


      consultaTempoRestante.classList.add(
        "text-success"
      );

    }

    else if (
      iniciouBeARep
    ) {

      consultaTempoRestante.textContent =
        `${minutosRestantes} min`;


      consultaTempoRestante.classList.add(
        "text-warning"
      );

    }

    else {

      consultaTempoRestante.textContent =
        `${metaMinutos} min`;


      consultaTempoRestante.classList.add(
        "text-danger"
      );

    }

  }

}


/* =========================================================
   LIMPAR RESULTADO DA CONSULTA
========================================================= */

function limparResultadoConsulta() {

  consultaResultado
    ?.classList.add(
      "oculto"
    );


  if (
    consultaVazia
  ) {

    consultaVazia.classList.remove(
      "oculto"
    );


    /*
     * Restauramos o conteúdo padrão.
     *
     * Isso também corrige o problema em que,
     * depois de uma busca sem resultado,
     * a mensagem "Pessoa não encontrada"
     * continuava aparecendo.
     */

    consultaVazia.innerHTML = `

      <div class="consulta-empty-icon">
        👤
      </div>

      <div>

        <strong>
          Consulte uma pessoa da base
        </strong>

        <span>
          O resultado mostrará Gemba, Be a Rep, tempo e informações operacionais.
        </span>

      </div>

    `;

  }

}


/* =========================================================
   PESSOA NÃO ENCONTRADA
========================================================= */

function mostrarPessoaNaoEncontrada(
  termo
) {

  consultaResultado
    ?.classList.add(
      "oculto"
    );


  if (
    !consultaVazia
  ) {

    return;

  }


  consultaVazia.classList.remove(
    "oculto"
  );


  consultaVazia.innerHTML = `

    <div class="consulta-empty-icon">
      🔎
    </div>

    <div>

      <strong>
        Pessoa não encontrada
      </strong>

      <span>
        Não encontramos “${escaparHTML(termo)}” na base do mês selecionado.
      </span>

    </div>

  `;

}


/* =========================================================
   PREENCHER RESUMO
========================================================= */

function preencherResumo(
  dados
) {

  const geral =
    dados?.geral ||
    {};


  definirTextoElemento(
    "resumo-hc",
    geral.hc ||
      0
  );


  definirTextoElemento(
    "resumo-realizaram",
    geral.realizaram ||
      0
  );


  definirTextoElemento(
    "resumo-processo",
    geral.processo ||
      0
  );


  definirTextoElemento(
    "resumo-nao",
    geral.naoRealizaram ||
      0
  );


  definirTextoElemento(
    "percentual-meta-dashboard",
    formatarPorcentagem(
      geral.percentual ||
      0
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
    dados?.geral ||
    {};


  const percentual =
    Number(
      geral.percentual
    ) ||
    0;


  const hc =
    Number(
      geral.hc
    ) ||
    0;


  const realizaram =
    Number(
      geral.realizaram
    ) ||
    0;


  /*
   * Quantidade necessária para chegar a 90%.
   */

  const metaQuantidade =
    Math.ceil(
      hc *
      TARGET
    );


  const faltam =
    Math.max(
      0,
      metaQuantidade -
        realizaram
    );


  const percentualVisual =
    Math.max(
      0,
      Math.min(
        100,
        percentual *
          100
      )
    );


  /* =======================================================
     BARRA
  ======================================================= */

  const barra =
    $("barra-meta-preenchida");


  if (
    barra
  ) {

    barra.style.width =
      `${percentualVisual}%`;

  }


  /* =======================================================
     TEXTO DA BARRA
  ======================================================= */

  const textoProgresso =
    $("texto-progresso-meta");


  if (
    textoProgresso
  ) {

    textoProgresso.textContent =
      `${formatarPorcentagem(percentual)} de realização`;

  }


  /* =======================================================
     SITUAÇÃO
  ======================================================= */

  const tituloSituacao =
    $("titulo-situacao");


  const descricaoSituacao =
    $("descricao-situacao");


  const situacaoAtual =
    $("situacao-atual");


  const situacaoFaltam =
    $("situacao-faltam");


  if (
    percentual >=
    TARGET
  ) {

    if (
      tituloSituacao
    ) {

      tituloSituacao.textContent =
        "Meta atingida";

    }


    if (
      descricaoSituacao
    ) {

      descricaoSituacao.textContent =
        "O site já atingiu a meta de 90% de realização.";

    }

  }

  else {

    if (
      tituloSituacao
    ) {

      tituloSituacao.textContent =
        "Em andamento";

    }


    if (
      descricaoSituacao
    ) {

      descricaoSituacao.textContent =
        `Faltam ${faltam} pessoa${faltam === 1 ? "" : "s"} para atingir 90%.`;

    }

  }


  if (
    situacaoAtual
  ) {

    situacaoAtual.textContent =
      formatarPorcentagem(
        percentual
      );

  }


  if (
    situacaoFaltam
  ) {

    situacaoFaltam.textContent =
      faltam;

  }


  /* =======================================================
     COMPATIBILIDADE COM O LAYOUT ANTIGO
  ======================================================= */

  const statusMeta =
    $("status-meta");


  const mensagemMeta =
    $("mensagem-meta");


  if (
    statusMeta
  ) {

    statusMeta.textContent =
      percentual >=
        TARGET
        ? "META ATINGIDA"
        : "EM ANDAMENTO";

  }


  if (
    mensagemMeta
  ) {

    mensagemMeta.textContent =
      percentual >=
        TARGET
        ? "Meta de 90% atingida."
        : `Faltam ${faltam} pessoa${faltam === 1 ? "" : "s"} para atingir a meta.`;

  }

}


/* =========================================================
   ALERTA DE PESSOAS SEM CADASTRO
========================================================= */

function preencherAlertaSemCadastro(
  dados
) {

  const quantidade =
    Number(
      dados?.quantidadeSemCadastro
    ) ||
    0;


  const alerta =
    obterElementoPorIds(
      "alerta-sem-cadastro",
      "card-sem-cadastro"
    );


  const quantidadeElemento =
    obterElementoPorIds(
      "quantidade-sem-cadastro",
      "total-sem-cadastro"
    );


  if (
    quantidadeElemento
  ) {

    quantidadeElemento.textContent =
      quantidade;

  }


  if (
    !alerta
  ) {

    return;

  }


  if (
    quantidade >
    0
  ) {

    alerta.classList.remove(
      "oculto"
    );

  }

  else {

    alerta.classList.add(
      "oculto"
    );

  }

}


/* =========================================================
   PREENCHER ARTE GERAL
========================================================= */

function preencherArteGeral(
  dados
) {

  const geral =
    dados?.geral ||
    {};


  /* =======================================================
     PERCENTUAL PRINCIPAL
  ======================================================= */

  definirTextoElemento(
    "percentual-geral",
    formatarPorcentagem(
      geral.percentual ||
      0
    )
  );


  /* =======================================================
     REALIZARAM
  ======================================================= */

  definirTextoElemento(
    "arte-geral-realizaram",
    geral.realizaram ||
      0
  );


  definirTextoElemento(
    "arte-percentual-realizaram",
    formatarPorcentagem(
      geral.hc > 0
        ? geral.realizaram /
          geral.hc
        : 0
    )
  );


  /* =======================================================
     EM PROCESSO
  ======================================================= */

  definirTextoElemento(
    "arte-geral-processo",
    geral.processo ||
      0
  );


  definirTextoElemento(
    "arte-percentual-processo",
    formatarPorcentagem(
      geral.hc > 0
        ? geral.processo /
          geral.hc
        : 0
    )
  );


  /* =======================================================
     NÃO REALIZARAM
  ======================================================= */

  definirTextoElemento(
    "arte-geral-nao",
    geral.naoRealizaram ||
      0
  );


  definirTextoElemento(
    "arte-percentual-nao",
    formatarPorcentagem(
      geral.hc > 0
        ? geral.naoRealizaram /
          geral.hc
        : 0
    )
  );


  /* =======================================================
     HC
  ======================================================= */

  definirTextoElemento(
    "arte-geral-hc",
    geral.hc ||
      0
  );


  /* =======================================================
     GEMBA
  ======================================================= */

  const totalGembaPendente =
    Array.isArray(
      dados?.guembaPendenteBeARep
    )
      ? dados.guembaPendenteBeARep.length
      : 0;


  const totalGembaProcessando =
    Array.isArray(
      dados?.guembaProcessandoBeARep
    )
      ? dados.guembaProcessandoBeARep.length
      : 0;


  definirTextoElemento(
    "arte-geral-gemba-pendente",
    totalGembaPendente
  );


  definirTextoElemento(
    "arte-geral-gemba-processo",
    totalGembaProcessando
  );


  /*
   * Esses mesmos IDs aparecem na Jornada
   * do dashboard novo.
   */

  definirTextoElemento(
    "resumo-gemba-pendente",
    totalGembaPendente
  );


  definirTextoElemento(
    "resumo-gemba-processo",
    totalGembaProcessando
  );


  /* =======================================================
     ÁREAS DA ARTE GERAL
  ======================================================= */

  const listaAreas =
    $("lista-areas");


  if (
    listaAreas
  ) {

    listaAreas.innerHTML =
      "";


    AREAS_VALIDAS.forEach(
      nomeArea => {

        const area =
          dados?.areas?.[
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

          <span class="area-name">
            ${escaparHTML(nomeArea)}
          </span>

          <span class="area-hc">
            ${area.hc || 0}
          </span>

          <span class="area-realizaram">
            ${area.realizaram || 0}
          </span>

          <span class="area-processo">
            ${area.processo || 0}
          </span>

          <span class="area-nao">
            ${area.naoRealizaram || 0}
          </span>

          <strong class="area-percent">
            ${formatarPorcentagem(area.percentual || 0)}
          </strong>

        `;


        listaAreas.appendChild(
          linha
        );

      }
    );

  }

}


/* =========================================================
   PREENCHER ARTE — REALIZARAM O BE A REP
========================================================= */

function preencherArteRealizaram(
  dados
) {

  const pessoas =
    Array.isArray(
      dados?.realizaramDetalhe
    )
      ? dados.realizaramDetalhe
      : [];


  definirTextoElemento(
    "total-realizaram-lista",
    pessoas.length
  );


  const lista =
    $("lista-realizaram-detalhe");


  if (
    !lista
  ) {

    return;

  }


  lista.innerHTML =
    "";


  if (
    pessoas.length ===
    0
  ) {

    lista.innerHTML = `

      <div class="empty-list">
        Nenhuma pessoa concluiu o Be a Rep neste mês.
      </div>

    `;


    return;

  }


  pessoas.forEach(
    pessoa => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "realizado-item";


      const unidades =
        Number(
          pessoa?.unidades
        );


      const produtividade =
        Number(
          pessoa?.produtividade
        );


      /* ===================================================
         NOVA ESTRUTURA:
         7 COLUNAS REAIS E INDEPENDENTES

         NOME
         ÁREA
         SETOR
         LOCAL
         TEMPO
         PEÇAS
         PRODUTIVIDADE
      =================================================== */

      item.innerHTML = `

        <div class="realizado-col realizado-col-nome">
          <strong>
            ${escaparHTML(pessoa.nome || "SEM NOME")}
          </strong>
        </div>

        <div class="realizado-col realizado-col-area">
          <span>
            ${escaparHTML(pessoa.area || "SEM ÁREA")}
          </span>
        </div>

        <div class="realizado-col realizado-col-setor">
          <span>
            ${escaparHTML(pessoa.setor || "SEM SETOR")}
          </span>
        </div>

        <div class="realizado-col realizado-col-local">
          <span>
            ${escaparHTML(pessoa.local || "—")}
          </span>
        </div>

        <div class="realizado-col realizado-col-tempo">
          <strong>
            ${escaparHTML(pessoa.tempo || "—")}
          </strong>
        </div>

        <div class="realizado-col realizado-col-pecas">
          <strong>
            ${
              Number.isFinite(
                unidades
              )
                ? unidades.toLocaleString(
                    "pt-BR",
                    {
                      maximumFractionDigits:
                        0
                    }
                  )
                : "—"
            }
          </strong>
        </div>

        <div class="realizado-col realizado-col-produtividade">
          <strong>
            ${
              Number.isFinite(
                produtividade
              )
                ? produtividade.toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits:
                        1,

                      maximumFractionDigits:
                        1
                    }
                  )
                : "—"
            }
          </strong>
        </div>

      `;


      lista.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   PREENCHER LISTAS DAS ARTES
========================================================= */

function preencherListasComExcecoes() {

  if (
    !dadosProcessados
  ) {

    return;

  }


  preencherListaSimples(
    "listas-processo",
    aplicarExcecoes(
      dadosProcessados.processo
    ),
    true
  );


  preencherListaSimples(
    "listas-nao",
    aplicarExcecoes(
      dadosProcessados.naoRealizaram
    ),
    false
  );


  preencherListaSimples(
    "listas-guemba-pendente",
    aplicarExcecoes(
      dadosProcessados.guembaPendenteBeARep
    ),
    false
  );


  preencherListaSimples(
    "listas-guemba-processando",
    aplicarExcecoes(
      dadosProcessados.guembaProcessandoBeARep
    ),
    true
  );


  definirTextoElemento(
    "total-processo",
    aplicarExcecoes(
      dadosProcessados.processo
    ).length
  );


  definirTextoElemento(
    "total-nao",
    aplicarExcecoes(
      dadosProcessados.naoRealizaram
    ).length
  );


  definirTextoElemento(
    "total-guemba-pendente",
    aplicarExcecoes(
      dadosProcessados.guembaPendenteBeARep
    ).length
  );


  definirTextoElemento(
    "total-guemba-processando",
    aplicarExcecoes(
      dadosProcessados.guembaProcessandoBeARep
    ).length
  );

}
     /* =========================================================
   PREENCHER LISTA SIMPLES
========================================================= */

function preencherListaSimples(
  id,
  pessoas,
  mostrarTempo =
    false
) {

  const elemento =
    $(
      id
    );


  if (
    !elemento
  ) {

    return;

  }


  elemento.innerHTML =
    "";


  const lista =
    Array.isArray(
      pessoas
    )
      ? pessoas
      : [];


  if (
    lista.length ===
    0
  ) {

    elemento.innerHTML = `

      <div class="empty-list">
        Nenhuma pessoa nesta situação.
      </div>

    `;


    return;

  }


  lista.forEach(
    pessoa => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "person-list-item";


      item.innerHTML = `

        <div class="person-list-main">

          <strong>
            ${escaparHTML(pessoa.nome || "SEM NOME")}
          </strong>

          <span>
            ${escaparHTML(pessoa.area || "SEM ÁREA")}
            •
            ${escaparHTML(pessoa.setor || "SEM SETOR")}
          </span>

        </div>

        ${
          mostrarTempo
            ? `

              <div class="person-list-time">
                ${escaparHTML(pessoa.tempo || "—")}
              </div>

            `
            : ""
        }

      `;


      elemento.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   APLICAR EXCEÇÕES NAS LISTAS
========================================================= */

function aplicarExcecoes(
  pessoas
) {

  const lista =
    Array.isArray(
      pessoas
    )
      ? pessoas
      : [];


  if (
    !Array.isArray(
      excecoes
    ) ||
    excecoes.length ===
      0
  ) {

    return [
      ...lista
    ];

  }


  return lista.filter(
    pessoa => {

      const nome =
        normalizarTexto(
          pessoa?.nome
        );


      return !excecoes.some(
        excecao =>
          normalizarTexto(
            excecao?.nome
          ) ===
          nome
      );

    }
  );

}


/* =========================================================
   FORMATAR MINUTOS
========================================================= */

function formatarMinutos(
  minutos
) {

  const total =
    Number(
      minutos
    );


  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {

    return "0 min";

  }


  if (
    total < 60
  ) {

    return `${Math.round(total)} min`;

  }


  const horas =
    Math.floor(
      total / 60
    );


  const resto =
    Math.round(
      total % 60
    );


  if (
    resto === 0
  ) {

    return `${horas}h`;

  }


  return `${horas}h ${resto}min`;

}


/* =========================================================
   ORDENAR POR NOME
========================================================= */

function ordenarNome(
  a,
  b
) {

  return String(
    a?.nome ||
    ""
  ).localeCompare(
    String(
      b?.nome ||
      ""
    ),
    "pt-BR"
  );

}


/* =========================================================
   ORDENAR POR TEMPO E NOME
========================================================= */

function ordenarTempoNome(
  a,
  b
) {

  const tempoA =
    Number(
      a?.minutos
    ) ||
    0;


  const tempoB =
    Number(
      b?.minutos
    ) ||
    0;


  if (
    tempoA !==
    tempoB
  ) {

    return (
      tempoB -
      tempoA
    );

  }


  return ordenarNome(
    a,
    b
  );

}


/* =========================================================
   CRIAR ESTRUTURA DAS ÁREAS
========================================================= */

function criarEstruturaAreas() {

  const estrutura =
    {};


  AREAS_VALIDAS.forEach(
    area => {

      estrutura[
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


  return estrutura;

}


/* =========================================================
   CALCULAR RESUMO GERAL

   IMPORTANTE:

   O Resumo Geral contempla GEMBA + BE A REP.

   REALIZARAM:
   - fez Gemba
     OU
   - concluiu Be a Rep

   EM PROCESSO:
   - não concluiu Gemba
   - iniciou Be a Rep
   - ainda não atingiu o tempo mínimo

   NÃO REALIZARAM:
   - não fez Gemba
   - não iniciou Be a Rep
========================================================= */

function calcularGeralPorRegistros(
  registros
) {

  const hc =
    registros.length;


  let realizaram =
    0;


  let processo =
    0;


  let naoRealizaram =
    0;


  registros.forEach(
    pessoa => {

      if (
        pessoa.situacao ===
        "REALIZOU"
      ) {

        realizaram++;

      }

      else if (
        pessoa.situacao ===
        "EM_PROCESSO"
      ) {

        processo++;

      }

      else {

        naoRealizaram++;

      }

    }
  );


  const percentual =
    hc > 0
      ? realizaram /
        hc
      : 0;


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
      percentual

  };

}


/* =========================================================
   CLASSIFICAÇÃO CENTRAL

   ESSA É A REGRA DO RESUMO GERAL.
========================================================= */

function classificarSituacao(
  valorGemba,
  valorBar,
  minutos,
  area
) {

  const fezGemba =
    gembaConcluido(
      valorGemba
    );


  const concluiuBeARep =
    beRepConcluido({

      statusBar:
        valorBar,

      minutos:
        minutos,

      area:
        area

    });


  const iniciouBeARep =
    beRepIniciado({

      statusBar:
        valorBar,

      minutos:
        minutos,

      area:
        area

    });


  /*
   * RESUMO GERAL
   *
   * REALIZOU
   * = GEMBA OU BE A REP CONCLUÍDO
   */

  if (
    fezGemba ||
    concluiuBeARep
  ) {

    return "REALIZOU";

  }


  /*
   * EM PROCESSO
   * = iniciou o Be a Rep,
   * mas ainda não atingiu a meta.
   */

  if (
    iniciouBeARep
  ) {

    return "EM_PROCESSO";

  }


  /*
   * NÃO REALIZOU
   * = não fez Gemba
   * e não iniciou Be a Rep.
   */

  return "NAO_REALIZOU";

}


/* =========================================================
   BE A REP — TEMPO MÍNIMO
========================================================= */

function obterTempoMinimoBeARep(
  area
) {

  /*
   * REGRA OFICIAL DO DASHBOARD:
   *
   * OPEX:
   * 10 minutos.
   *
   * DEMAIS ÁREAS:
   * 60 minutos.
   */

  return area ===
    "OPEX"
      ? 10
      : 60;

}


/* =========================================================
   BE A REP — INICIADO
========================================================= */

function beRepIniciado(
  pessoa
) {

  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  return minutos > 0;

}


/* =========================================================
   BE A REP — CONCLUÍDO
========================================================= */

function beRepConcluido(
  pessoa
) {

  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  const tempoMinimo =
    obterTempoMinimoBeARep(
      pessoa?.area ||
      ""
    );


  return (
    minutos >=
    tempoMinimo
  );

}


/* =========================================================
   BE A REP — EM PROCESSO
========================================================= */

function beRepEmProcesso(
  pessoa
) {

  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  const tempoMinimo =
    obterTempoMinimoBeARep(
      pessoa?.area ||
      ""
    );


  return (
    minutos > 0 &&
    minutos < tempoMinimo
  );

}


/* =========================================================
   GEMBA CONCLUÍDO
========================================================= */

function gembaConcluido(
  gemba
) {

  const status =
    normalizarTexto(
      gemba
    );


  const concluidos = [

    "HECHO",
    "CUMPLIO",
    "REALIZADO",
    "CONCLUIDO"

  ];


  return concluidos.includes(
    status
  );

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


  /* =======================================================
     OUTBOUND
  ======================================================= */

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


  /* =======================================================
     INBOUND
  ======================================================= */

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


  /* =======================================================
     OPEX
  ======================================================= */

  if (
    texto ===
      "OPEX" ||
    texto.includes(
      "OPEX"
    )
  ) {

    return "OPEX";

  }


  /* =======================================================
     ICQA
  ======================================================= */

  if (
    texto ===
      "ICQA" ||
    texto.includes(
      "ICQA"
    )
  ) {

    return "ICQA";

  }


  /* =======================================================
     LINE HAUL
  ======================================================= */

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


  /* =======================================================
     HEAD SITE

     Head Site é um cadastro válido.

     ELE ENTRA:
     - HC Geral
     - Realizaram
     - Em Processo
     - Não Realizaram
     - Gemba
     - Be a Rep

     ELE NÃO ENTRA:
     - Outbound
     - Inbound
     - OPEX
     - ICQA
     - Line Haul
  ======================================================= */

  if (
    texto ===
      "HEAD SITE" ||
    texto ===
      "HEADSITE" ||
    texto.includes(
      "HEAD SITE"
    )
  ) {

    return "Head Site";

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


  /*
   * Ajustes específicos que já existiam
   * no dashboard.
   */

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

  /*
   * A Query pode retornar formatos como:
   *
   * 01:05:00
   * 00:35:00
   * 1h 5m
   * 35m
   * 65
   */

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {

    return 0;

  }


  /* =======================================================
     VALOR NUMÉRICO
  ======================================================= */

  if (
    typeof valor ===
    "number"
  ) {

    if (
      !Number.isFinite(
        valor
      )
    ) {

      return 0;

    }


    /*
     * Fração de dia do Excel.
     */

    if (
      valor > 0 &&
      valor < 1
    ) {

      return Math.round(
        valor *
        24 *
        60
      );

    }


    return valor;

  }


  const textoOriginal =
    limparTexto(
      valor
    );


  if (
    !textoOriginal
  ) {

    return 0;

  }


  const texto =
    textoOriginal
      .toLowerCase();


  /* =======================================================
     FORMATO HH:MM:SS
  ======================================================= */

  if (
    /^\d{1,3}:\d{1,2}(:\d{1,2})?$/.test(
      texto
    )
  ) {

    const partes =
      texto
        .split(
          ":"
        )
        .map(
          Number
        );


    const horas =
      partes[0] ||
      0;


    const minutos =
      partes[1] ||
      0;


    const segundos =
      partes[2] ||
      0;


    return (
      horas *
      60
    ) +
    minutos +
    (
      segundos /
      60
    );

  }


  /* =======================================================
     FORMATO "1h 20m"
  ======================================================= */

  const horas =
    Number(
      texto.match(
        /(\d+(?:[.,]\d+)?)\s*h/
      )?.[1]
        ?.replace(
          ",",
          "."
        ) ||
      0
    );


  const minutos =
    Number(
      texto.match(
        /(\d+(?:[.,]\d+)?)\s*m/
      )?.[1]
        ?.replace(
          ",",
          "."
        ) ||
      0
    );


  if (
    horas > 0 ||
    minutos > 0
  ) {

    return (
      horas *
      60
    ) +
    minutos;

  }


  /* =======================================================
     SOMENTE NÚMERO
  ======================================================= */

  const numero =
    Number(
      texto
        .replace(
          ",",
          "."
        )
    );


  if (
    Number.isFinite(
      numero
    )
  ) {

    return numero;

  }


  return 0;

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
        normalizarReferenciaMes(
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
    ? formatarReferenciaFiltro(
        maior[0]
      )
    : formatarReferenciaFiltro(
        referenciaSelecionada
      );

}


/* =========================================================
   PREENCHER MÊS NO DASHBOARD E NAS ARTES
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
   DEFINIR TEXTO DE ELEMENTO
========================================================= */

function definirTextoElemento(
  id,
  valor
) {

  const elemento =
    $(
      id
    );


  if (
    elemento
  ) {

    elemento.textContent =
      valor;

  }

}


/* =========================================================
   STATUS DO DASHBOARD
========================================================= */

function atualizarStatus(
  mensagem,
  tipo = ""
) {

  if (
    !statusArquivo
  ) {

    return;

  }


  statusArquivo.textContent =
    mensagem;


  statusArquivo.classList.remove(
    "sucesso",
    "erro"
  );


  if (
    tipo
  ) {

    statusArquivo.classList.add(
      tipo
    );

  }

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
  nomeArte
) {

  arteAtual =
    nomeArte;


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


  const arteSelecionada =
    document
      .getElementById(
        `arte-${nomeArte}`
      );


  arteSelecionada
    ?.classList
    .add(
      "ativa"
    );


  botoesArte
    .forEach(
      botao => {

        botao
          .classList
          .toggle(
            "ativo",
            botao.dataset.arte ===
              nomeArte
          );

      }
    );

}


/* =========================================================
   CONFIGURAÇÃO DE PAGINAÇÃO DAS ARTES
========================================================= */

function obterConfiguracaoPaginacaoArte(
  nomeArte
) {

  const configuracoes = {

    realizaram: {
      listaId:
        "lista-realizaram-detalhe",
      limite:
        30,
      tipo:
        "tabela"
    },

    processo: {
      listaId:
        "listas-processo",
      limite:
        30,
      tipo:
        "cards"
    },

    nao: {
      listaId:
        "listas-nao",
      limite:
        30,
      tipo:
        "cards"
    },

    "guemba-pendente": {
      listaId:
        "listas-guemba-pendente",
      limite:
        30,
      tipo:
        "cards"
    },

    "guemba-processando": {
      listaId:
        "listas-guemba-processando",
      limite:
        30,
      tipo:
        "cards"
    }

  };


  return configuracoes[
    nomeArte
  ] || null;

}


/* =========================================================
   AGUARDAR RENDERIZAÇÃO
========================================================= */

function aguardarRenderizacaoArte() {

  return new Promise(
    resolve => {

      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            resolve
          );

        }
      );

    }
  );

}


/* =========================================================
   CAPTURAR ARTE
========================================================= */

async function capturarArte(
  arte
) {

  await aguardarRenderizacaoArte();


  return html2canvas(
    arte,
    {

      scale:
        2,

      backgroundColor:
        "#ffffff",

      useCORS:
        true,

      logging:
        false

    }
  );

}


/* =========================================================
   BAIXAR CANVAS COMO PNG
========================================================= */

function baixarCanvasComoPng(
  canvas,
  nomeArquivo
) {

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


/* =========================================================
   BAIXAR ARTE ATUAL
   COM PAGINAÇÃO AUTOMÁTICA
========================================================= */

async function baixarArteAtual() {

  const arte =
    document
      .getElementById(
        `arte-${arteAtual}`
      );


  if (
    !arte
  ) {

    atualizarStatus(
      "Não foi possível localizar a arte selecionada.",
      "erro"
    );

    return;

  }


  if (
    typeof html2canvas ===
    "undefined"
  ) {

    atualizarStatus(
      "Biblioteca de geração de imagem não carregada.",
      "erro"
    );

    return;

  }


  const nomeBase =
    arte.dataset
      .nomeArquivo ||
    `Be-a-Rep-${arteAtual}`;


  const referencia =
    referenciaSelecionada ||
    "mes";


  const configuracao =
    obterConfiguracaoPaginacaoArte(
      arteAtual
    );


  try {

    /*
     * Se a arte não possui lista paginável,
     * mantém o comportamento normal.
     */

    if (
      !configuracao
    ) {

      const canvas =
        await capturarArte(
          arte
        );


      baixarCanvasComoPng(
        canvas,
        `${nomeBase}-${referencia}.png`
      );


      atualizarStatus(
        "✅ Arte gerada com sucesso.",
        "sucesso"
      );

      return;

    }


    const lista =
      document.getElementById(
        configuracao.listaId
      );


    if (
      !lista
    ) {

      const canvas =
        await capturarArte(
          arte
        );


      baixarCanvasComoPng(
        canvas,
        `${nomeBase}-${referencia}.png`
      );


      return;

    }


    const itens =
      Array.from(
        lista.children
      ).filter(
        item =>
          !item.classList.contains(
            "empty-list"
          ) &&
          !item.classList.contains(
            "empty-state"
          )
      );


    const totalPessoas =
      itens.length;


    /*
     * Até 30 pessoas:
     * baixa uma única imagem.
     */

    if (
      totalPessoas <=
      configuracao.limite
    ) {

      const canvas =
        await capturarArte(
          arte
        );


      baixarCanvasComoPng(
        canvas,
        `${nomeBase}-${referencia}.png`
      );


      atualizarStatus(
        "✅ Arte gerada com sucesso.",
        "sucesso"
      );

      return;

    }


    /*
     * Acima de 30 pessoas:
     * divide automaticamente.
     */

    const totalPaginas =
      Math.ceil(
        totalPessoas /
        configuracao.limite
      );


    const estilosOriginais =
      itens.map(
        item =>
          item.style.display
      );


    const gridTemplateOriginal =
      lista.style
        .gridTemplateColumns;


    const gapOriginal =
      lista.style.gap;


    arte.classList.add(
      "arte-exportacao-paginada"
    );


    /*
     * Nas listas em cards,
     * durante a exportação usamos 2 colunas
     * para deixar o texto maior.
     */

    if (
      configuracao.tipo ===
      "cards"
    ) {

      lista.style.gridTemplateColumns =
        "repeat(2, minmax(0, 1fr))";


      lista.style.gap =
        "10px";

    }


    const indicador =
      document.createElement(
        "span"
      );


    indicador.className =
      "arte-pagina-indicador";


    const secaoLista =
      lista.closest(
        ".list-section"
      );


    const cabecalhoSecao =
      secaoLista
        ?.querySelector(
          ".section-heading"
        );


    if (
      cabecalhoSecao
    ) {

      cabecalhoSecao.appendChild(
        indicador
      );

    }

    else {

      lista.parentNode
        ?.insertBefore(
          indicador,
          lista
        );

    }


    try {

      for (
        let pagina = 0;
        pagina < totalPaginas;
        pagina++
      ) {

        const inicio =
          pagina *
          configuracao.limite;


        const fim =
          inicio +
          configuracao.limite;


        itens.forEach(
          (
            item,
            indice
          ) => {

            item.style.display =
              indice >= inicio &&
              indice < fim
                ? ""
                : "none";

          }
        );


        indicador.textContent =
          `PÁGINA ${pagina + 1} DE ${totalPaginas} • ${totalPessoas} PESSOAS`;


        const canvas =
          await capturarArte(
            arte
          );


        baixarCanvasComoPng(
          canvas,
          `${nomeBase}-${referencia}-pagina-${pagina + 1}-de-${totalPaginas}.png`
        );


        /*
         * Pequeno intervalo entre downloads.
         */

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              250
            )
        );

      }


      atualizarStatus(
        `✅ Arte dividida em ${totalPaginas} páginas e gerada com sucesso.`,
        "sucesso"
      );

    }

    finally {

      itens.forEach(
        (
          item,
          indice
        ) => {

          item.style.display =
            estilosOriginais[
              indice
            ] ||
            "";

        }
      );


      lista.style.gridTemplateColumns =
        gridTemplateOriginal;


      lista.style.gap =
        gapOriginal;


      indicador.remove();


      arte.classList.remove(
        "arte-exportacao-paginada"
      );

    }

  }

  catch (
    erro
  ) {

    console.error(
      "❌ Erro ao gerar PNG:",
      erro
    );


    atualizarStatus(
      "Erro ao gerar a imagem.",
      "erro"
    );

  }

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
   OBTER VALOR DO OBJETO
========================================================= */

function obterValorObjeto(
  objeto,
  chaves
) {

  if (
    !objeto ||
    typeof objeto !==
      "object"
  ) {

    return "";

  }


  /* =======================================================
     TENTATIVA DIRETA
  ======================================================= */

  for (
    const chave of chaves
  ) {

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          objeto,
          chave
        )
    ) {

      const valor =
        objeto[
          chave
        ];


      if (
        valor !== null &&
        valor !== undefined
      ) {

        return valor;

      }

    }

  }


  /* =======================================================
     COMPARAÇÃO NORMALIZADA
  ======================================================= */

  const mapa =
    new Map();


  Object.keys(
    objeto
  )
    .forEach(
      chave => {

        mapa.set(
          normalizarTexto(
            chave
          ),
          objeto[
            chave
          ]
        );

      }
    );


  for (
    const chave of chaves
  ) {

    const normalizada =
      normalizarTexto(
        chave
      );


    if (
      mapa.has(
        normalizada
      )
    ) {

      const valor =
        mapa.get(
          normalizada
        );


      if (
        valor !== null &&
        valor !== undefined
      ) {

        return valor;

      }

    }

  }


  return "";

}


/* =========================================================
   FORMATAR PORCENTAGEM
========================================================= */

function formatarPorcentagem(
  valor
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

    return "0,0%";

  }


  return (
    numero *
    100
  )
    .toLocaleString(
      "pt-BR",
      {

        minimumFractionDigits:
          1,

        maximumFractionDigits:
          1

      }
    ) +
    "%";

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
   CLASSIFICAÇÃO CENTRAL

   ESSA É A REGRA DO RESUMO GERAL.
========================================================= */

function classificarSituacao(
  valorGemba,
  valorBar,
  minutos,
  area
) {

  const fezGemba =
    gembaConcluido(
      valorGemba
    );


  const concluiuBeARep =
    beRepConcluido({

      statusBar:
        valorBar,

      minutos:
        minutos,

      area:
        area

    });


  const iniciouBeARep =
    beRepIniciado({

      statusBar:
        valorBar,

      minutos:
        minutos,

      area:
        area

    });


  /*
   * RESUMO GERAL
   *
   * REALIZOU
   * = GEMBA OU BE A REP CONCLUÍDO
   */

  if (
    fezGemba ||
    concluiuBeARep
  ) {

    return "REALIZOU";

  }


  /*
   * EM PROCESSO
   * = iniciou o Be a Rep,
   * mas ainda não atingiu a meta.
   */

  if (
    iniciouBeARep
  ) {

    return "EM_PROCESSO";

  }


  /*
   * NÃO REALIZOU
   * = não fez Gemba
   * e não iniciou Be a Rep.
   */

  return "NAO_REALIZOU";

}


/* =========================================================
   BE A REP - TEMPO MÍNIMO
========================================================= */

function obterTempoMinimoBeARep(
  area
) {

  /*
   * REGRA OFICIAL:
   *
   * OPEX:
   * 10 minutos
   *
   * DEMAIS ÁREAS:
   * 60 minutos
   */

  return area ===
    "OPEX"
      ? 10
      : 60;

}


/* =========================================================
   BE A REP - INICIADO
========================================================= */

function beRepIniciado(
  pessoa
) {

  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  return minutos > 0;

}


/* =========================================================
   BE A REP - CONCLUÍDO
========================================================= */

function beRepConcluido(
  pessoa
) {

  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  const tempoMinimo =
    obterTempoMinimoBeARep(
      pessoa?.area ||
      ""
    );


  return (
    minutos >=
    tempoMinimo
  );

}


/* =========================================================
   BE A REP - EM PROCESSO
========================================================= */

function beRepEmProcesso(
  pessoa
) {

  const minutos =
    Number(
      pessoa?.minutos
    ) ||
    0;


  const tempoMinimo =
    obterTempoMinimoBeARep(
      pessoa?.area ||
      ""
    );


  return (
    minutos > 0 &&
    minutos < tempoMinimo
  );

}


/* =========================================================
   GEMBA CONCLUÍDO
========================================================= */

function gembaConcluido(
  gemba
) {

  const status =
    normalizarTexto(
      gemba
    );


  const concluidos = [

    "HECHO",
    "CUMPLIO",
    "REALIZADO",
    "CONCLUIDO"

  ];


  return concluidos.includes(
    status
  );

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
    texto === "OUTBOUND" ||
    texto === "OUT" ||
    texto.includes(
      "OUTBOUND"
    )
  ) {

    return "Outbound";

  }


  if (
    texto === "INBOUND" ||
    texto === "IN" ||
    texto.includes(
      "INBOUND"
    )
  ) {

    return "Inbound";

  }


  if (
    texto === "OPEX" ||
    texto.includes(
      "OPEX"
    )
  ) {

    return "OPEX";

  }


  if (
    texto === "ICQA" ||
    texto.includes(
      "ICQA"
    )
  ) {

    return "ICQA";

  }


  if (
    texto === "LINE HAUL" ||
    texto === "LINEHAUL" ||
    texto.includes(
      "LINE HAUL"
    ) ||
    texto.includes(
      "LINEHAUL"
    )
  ) {

    return "Line Haul";

  }


  /*
   * HEAD SITE:
   *
   * Entra no HC Geral.
   * Não entra no desempenho das 5 áreas.
   */

  if (
    texto === "HEAD SITE" ||
    texto === "HEADSITE" ||
    texto.includes(
      "HEAD SITE"
    )
  ) {

    return "Head Site";

  }


  return "";

}
     
