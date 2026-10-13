
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
  "Retiros"

];


/* =========================================================
   LIDERANÇAS OFICIAIS — CENTRAL BE A REP
========================================================= */

const LIDERANCAS_OFICIAIS = {
  tbaldo: {
    nome: "THIAGO COUTO BALDO",
    supervisores: [
      "patkawashimo",
      "valferreira",
      "mmdeldotti"
    ]
  },

  melo: {
    nome: "PATRICIA GOMES MELO",
    supervisores: [
      "yaborges",
      "rmendonca",
      "proledo",
      "pedsales",
      "ebotti"
    ]
  },

  aparochi: {
    nome: "ANDRE PAROCHI",
    supervisores: [
      "marcmiguelez"
    ]
  },

  fecarvalho: {
    nome: "FELIPE CARVALHO ABREU DE OLIVEIRA",
    supervisores: [
      "taamaral"
    ]
  },

  iscarvalho: {
    nome: "ISAAC MARQUES DE CARVALHO",
    supervisores: [
      "thfagundes",
      "lleme"
    ]
  }
};

const NOMES_SUPERVISORES = {
  patkawashimo: "PATRICIA SANTOS MACHADO KAWASHIMO",
  valferreira: "VALDEMIR FERREIRA DA SILVA",
  mmdeldotti: "MARCELO DELDOTTI DA COSTA",
  yaborges: "YASMIN DE FREITAS BORGES MARCONDES",
  rmendonca: "RAUL GOTARDI MENDONCA",
  proledo: "PAULO DA ROCHA ROLEDO",
  pedsales: "PEDRO OTAVIO SANTOS SALES",
  ebotti: "EDUARDO SIQUEIRA BOTTI",
  marcmiguelez: "MARCELLO ALFONSO PINEIRO MIGUELEZ",
  taamaral: "TAIS CRISTINA AMARAL SILVA",
  thfagundes: "THIAGO JOSE FAGUNDES",
  lleme: "LEANDRO RAMON LEME"
};


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


let areaSelecionada = "";
let gerenteSelecionado = "";
let supervisorSelecionado = "";
let pessoasMesSemFiltro = [];
let nomesPorUsername = new Map();


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
          dadosApiBrutos.length === 0
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

          prepararLiderancasDoMes();

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

        } catch (erro) {

          console.error(
            "❌ Erro ao trocar o mês:",
            erro
          );

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
   FILTRO DE ÁREA
======================================================= */
$("filtro-area")
  ?.addEventListener("change", () => {

    areaSelecionada = $("filtro-area").value;

    atualizarFiltrosLideranca();
    aplicarFiltrosLideranca();

  });
   
  /* =======================================================
     FILTRO DE SUPERVISOR
  ======================================================= */

  $("filtro-supervisor")
    ?.addEventListener(
      "change",
      () => {

        supervisorSelecionado =
          $("filtro-supervisor").value;

        aplicarFiltrosLideranca();

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
          evento.key === "Enter"
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

      botaoAtualizar.disabled = true;
      botaoAtualizar.textContent = "Atualizando...";

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
          method: "GET",

          headers: {
            Accept: "application/json"
          },

          cache: "no-store"
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

          mensagem = erro.erro;

        }

      } catch {}

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
      !Array.isArray(registros) ||
      registros.length === 0
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
     * Monta o filtro com os meses disponíveis.
     */

    montarFiltroMes(
      dadosApiBrutos
    );


    /* =====================================================
       MÊS INICIAL
    ===================================================== */

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

    } catch (
      erroMesAtual
    ) {

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
       LOG DOS DADOS
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
       PREPARAR FILTROS DE LIDERANÇA
    ===================================================== */

    /*
     * MANAGER = Gerente
     * MANAGER_USERNAME = Supervisor
     *
     * A função será definida nas próximas partes.
     */

    prepararLiderancasDoMes();


    /* =====================================================
       ATUALIZAR STATUS
    ===================================================== */

    atualizarStatus(
      `✅ Dados de ${formatarReferenciaFiltro(referenciaSelecionada)} carregados com sucesso.`,
      "sucesso"
    );

    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
        `Dados de ${formatarReferenciaFiltro(referenciaSelecionada)} carregados. Você pode selecionar outro mês quando quiser.`;

    }

  } catch (
    erro
  ) {

    console.error(
      "❌ Erro ao carregar os dados:",
      erro
    );

    atualizarStatus(
      `❌ ${erro?.message || "Erro ao carregar os dados."}`,
      "erro"
    );

    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
        "Não foi possível carregar os dados da base. Tente atualizar novamente.";

    }

    ocultarDashboard();

  } finally {

    /*
     * Libera o botão Atualizar,
     * mesmo quando ocorrer algum erro.
     */

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
   CONVERTER VALOR NUMÉRICO DA QUERY
========================================================= */

/*
 * Aceita:
 *
 * 125
 * "125"
 * "125,5"
 * "125.5"
 */

function numeroSeguroBeARep(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  let texto = String(valor).trim();

  if (!texto) {
    return 0;
  }

  /*
   * Se vier no padrão brasileiro:
   * 1.234,56
   */

  if (texto.includes(",")) {
    texto = texto
      .replace(/\./g, "")
      .replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;

}


/* =========================================================
   REMOVER DUPLICIDADES
========================================================= */

function removerDuplicidades(registros) {

  const mapa = new Map();

  registros.forEach(pessoa => {

    const chave = normalizarTexto(
      pessoa.username ||
      pessoa.email ||
      pessoa.nome
    );

    if (!chave) {
      return;
    }

    if (!mapa.has(chave)) {
      mapa.set(chave, pessoa);
      return;
    }

    const atual = mapa.get(chave);

    /*
     * Se um registro tem área e outro não,
     * mantém o registro que possui área.
     */

    if (
      !atual.temCadastroArea &&
      pessoa.temCadastroArea
    ) {
      mapa.set(chave, pessoa);
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
      (atual.temCadastroArea ? 10 : 0) +
      (atual.setorCadastro ? 2 : 0) +
      (atual.areaOriginal ? 2 : 0) +
      (atual.local ? 2 : 0) +
      (atual.unidades > 0 ? 1 : 0);

    const pontuacaoNova =
      (pessoa.temCadastroArea ? 10 : 0) +
      (pessoa.setorCadastro ? 2 : 0) +
      (pessoa.areaOriginal ? 2 : 0) +
      (pessoa.local ? 2 : 0) +
      (pessoa.unidades > 0 ? 1 : 0);

    if (pontuacaoNova > pontuacaoAtual) {
      mapa.set(chave, pessoa);
      return;
    }

    /*
     * Último critério:
     * mantém o registro com maior tempo.
     */

    if (
      pontuacaoNova === pontuacaoAtual &&
      pessoa.minutos > atual.minutos
    ) {
      mapa.set(chave, pessoa);
    }

  });

  return Array.from(mapa.values());

}


/* =========================================================
   PROCESSAR REGISTROS
========================================================= */

function processarRegistros(registros) {

  if (!registros.length) {
    throw new Error(
      `Nenhuma pessoa obrigatória foi encontrada para ${formatarReferenciaFiltro(referenciaSelecionada)}.`
    );
  }

  const mes = obterMesPredominante(registros);
  const areas = criarEstruturaAreas();

  /* =======================================================
     LISTAS
  ======================================================= */

  const realizaramDetalhe = [];
  const processo = [];
  const naoRealizaram = [];
  const guembaPendenteBeARep = [];
  const guembaProcessandoBeARep = [];
  const semCadastro = [];

  registros.forEach(pessoa => {

    /* =====================================================
       PESSOAS SEM CADASTRO DE ÁREA
    ===================================================== */

    if (!pessoa.temCadastroArea) {
      semCadastro.push(pessoa);
    }

    /* =====================================================
       INDICADORES POR ÁREA
    ===================================================== */

    if (AREAS_VALIDAS.includes(pessoa.area)) {

      const dadosArea = areas[pessoa.area];

      dadosArea.hc++;

      if (pessoa.situacao === "REALIZOU") {
        dadosArea.realizaram++;
      } else if (pessoa.situacao === "EM_PROCESSO") {
        dadosArea.processo++;
      } else {
        dadosArea.naoRealizaram++;
      }

    }

    /* =====================================================
       CLASSIFICAÇÃO

       OPEX: 10 minutos
       Outbound, Inbound, ICQA e Retiros: 60 minutos

       As funções de tempo serão mantidas
       nas próximas partes.
    ===================================================== */

    const realizouBeARep = beRepConcluido(pessoa);
    const beARepEmProcesso = beRepEmProcesso(pessoa);
    const fezGemba = gembaConcluido(pessoa.gemba);
    const iniciouBeARep = beRepIniciado(pessoa);

    /* =====================================================
       BE A REP CONCLUÍDO
    ===================================================== */

    if (realizouBeARep) {

      realizaramDetalhe.push({

        nome: pessoa.nome,
        username: pessoa.username,
        area: pessoa.area || "SEM ÁREA",

        setor:
          ajustarSetorNaArte(
            pessoa.nome,
            pessoa.setor
          ) || "SEM SETOR",

        local: pessoa.local || "-",
        tempo: pessoa.tempo || "-",
        minutos: pessoa.minutos || 0,
        unidades: pessoa.unidades || 0,
        produtividade: pessoa.produtividade || 0

      });

    }

    /* =====================================================
       BE A REP EM PROCESSO
       SEM GEMBA CONCLUÍDO
    ===================================================== */

    if (beARepEmProcesso && !fezGemba) {

      processo.push(
        criarPessoaLista(pessoa, true)
      );

    }

    /* =====================================================
       NÃO REALIZARAM
    ===================================================== */

    if (!fezGemba && !iniciouBeARep) {

      naoRealizaram.push(
        criarPessoaLista(pessoa, false)
      );

    }

    /* =====================================================
       GEMBA REALIZADO
       BE A REP NÃO INICIADO
    ===================================================== */

    if (fezGemba && !iniciouBeARep) {

      guembaPendenteBeARep.push(
        criarPessoaLista(pessoa, false)
      );

    }

    /* =====================================================
       GEMBA + BE A REP EM PROCESSO
    ===================================================== */

    if (fezGemba && beARepEmProcesso) {

      guembaProcessandoBeARep.push(
        criarPessoaLista(pessoa, true)
      );

    }

  });

  /* =======================================================
     PERCENTUAL POR ÁREA
  ======================================================= */

  AREAS_VALIDAS.forEach(nomeArea => {

    const area = areas[nomeArea];

    area.percentual =
      area.hc > 0
        ? area.realizaram / area.hc
        : 0;

  });

  /* =======================================================
     ORDENAÇÃO DAS LISTAS
  ======================================================= */

  realizaramDetalhe.sort((a, b) => {

    const comparacaoArea =
      String(a.area || "").localeCompare(
        String(b.area || ""),
        "pt-BR"
      );

    if (comparacaoArea !== 0) {
      return comparacaoArea;
    }

    return String(a.nome || "").localeCompare(
      String(b.nome || ""),
      "pt-BR"
    );

  });

  processo.sort(ordenarTempoNome);
  naoRealizaram.sort(ordenarNome);
  guembaPendenteBeARep.sort(ordenarNome);
  guembaProcessandoBeARep.sort(ordenarTempoNome);
  semCadastro.sort(ordenarNome);

  /* =======================================================
     INDICADORES GERAIS
  ======================================================= */

  const geral =
    calcularGeralPorRegistros(registros);

  areas.Geral = geral;

  console.log("✅ HC Geral:", geral.hc);
  console.log("✅ Be a Rep concluído:", realizaramDetalhe.length);
  console.log("⏳ Em processo:", processo.length);
  console.log("⚠️ Sem cadastro:", semCadastro.length);

  /* =======================================================
     RETORNO
  ======================================================= */

  return {

    mes,
    areas,
    geral,
    registros,

    realizaramDetalhe,
    processo,
    naoRealizaram,

    guembaPendenteBeARep,
    guembaProcessandoBeARep,

    semCadastro,
    quantidadeSemCadastro: semCadastro.length

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

    username:
      pessoa.username,

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

  if (!dadosProcessados) {
    return;
  }

  /* =======================================================
     CABEÇALHO E INDICADORES
  ======================================================= */

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


  /* =======================================================
     ARTES DE ACOMPANHAMENTO
  ======================================================= */

  preencherArteGeral(
    dadosProcessados
  );

  preencherArteRealizaram(
    dadosProcessados
  );

  preencherListasComExcecoes();

  preencherDatalistExcecoes();


  /* =======================================================
     CONSULTA INDIVIDUAL
  ======================================================= */

  preencherDatalistConsulta();

  limparResultadoConsulta();


  /* =======================================================
     JORNADA GEMBA → BE A REP
  ======================================================= */

  preencherJornadaBeARep();


  /* =======================================================
     DESEMPENHO POR ÁREA
  ======================================================= */

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

  if (!dadosProcessados) {
    return;
  }

  /* =====================================================
     REGISTROS DO MÊS SELECIONADO
  ===================================================== */

  const registros =
    Array.isArray(
      dadosProcessados.registros
    )
      ? dadosProcessados.registros
      : [];


  /* =====================================================
     GEMBA REALIZADO
     BE A REP AINDA NÃO INICIADO
  ===================================================== */

  const gembaPendente =
    Array.isArray(
      dadosProcessados.guembaPendenteBeARep
    )
      ? dadosProcessados.guembaPendenteBeARep.length
      : 0;


  /* =====================================================
     GEMBA + BE A REP EM PROCESSO
  ===================================================== */

  const gembaProcessando =
    Array.isArray(
      dadosProcessados.guembaProcessandoBeARep
    )
      ? dadosProcessados.guembaProcessandoBeARep.length
      : 0;


  /* =====================================================
     BE A REP CONCLUÍDO

     Aqui contamos somente quem concluiu
     o Be a Rep.

     Não utilizamos geral.realizaram,
     porque esse indicador também
     considera o Gemba realizado.
  ===================================================== */

  const beRepConcluidoTotal =
    registros.filter(
      pessoa =>
        beRepConcluido(pessoa)
    ).length;


  /* =====================================================
     ELEMENTOS DO DASHBOARD
  ===================================================== */

  const elementoGembaPendente =
    $("resumo-gemba-pendente");

  const elementoGembaProcessando =
    $("resumo-gemba-processo");


  /* =====================================================
     ATUALIZAR GEMBA PENDENTE
  ===================================================== */

  if (elementoGembaPendente) {

    elementoGembaPendente.textContent =
      gembaPendente;

  }


  /* =====================================================
     ATUALIZAR GEMBA + PROCESSO
  ===================================================== */

  if (elementoGembaProcessando) {

    elementoGembaProcessando.textContent =
      gembaProcessando;

  }


  /* =====================================================
     ATUALIZAR BE A REP CONCLUÍDO
  ===================================================== */

  if (jornadaBeRepConcluido) {

    jornadaBeRepConcluido.textContent =
      beRepConcluidoTotal;

  }

}


/* =========================================================
   DESEMPENHO POR ÁREA
========================================================= */

function preencherDesempenhoAreas() {

  if (!dadosProcessados?.areas) {
    return;
  }

  preencherRankingAreas(dadosProcessados);

  preencherTabelaAreasDashboard(dadosProcessados);

}


/* =========================================================
   RANKING DE ÁREAS
========================================================= */

function preencherRankingAreas(dados) {

  if (!rankingAreas) {
    return;
  }

  rankingAreas.innerHTML = "";

  const areas = dados?.areas || {};

  const ranking = AREAS_VALIDAS
    .map(nomeArea => {

      const dadosArea = areas[nomeArea] || {
        hc: 0,
        realizaram: 0,
        processo: 0,
        naoRealizaram: 0,
        percentual: 0
      };

      return {
        nome: nomeArea,
        hc: Number(dadosArea.hc) || 0,
        realizaram: Number(dadosArea.realizaram) || 0,
        processo: Number(dadosArea.processo) || 0,
        naoRealizaram: Number(dadosArea.naoRealizaram) || 0,
        percentual: Number(dadosArea.percentual) || 0
      };

    })
    .sort((a, b) => {

      if (b.percentual !== a.percentual) {
        return b.percentual - a.percentual;
      }

      if (b.realizaram !== a.realizaram) {
        return b.realizaram - a.realizaram;
      }

      return a.nome.localeCompare(
        b.nome,
        "pt-BR"
      );

    });

  ranking.forEach((area, indice) => {

    const percentualNumero = Math.max(
      0,
      Math.min(100, area.percentual * 100)
    );

    const classeStatus =
      obterClasseRankingArea(area.percentual);

    const item =
      document.createElement("div");

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
              ${escaparHTML(area.nome)}
            </strong>

            <span class="area-rank-hc">
              HC ${area.hc}
            </span>

          </div>

          <strong class="area-rank-percent">
            ${formatarPorcentagem(area.percentual)}
          </strong>

        </div>

        <div class="area-progress">

          <div
            class="area-progress-fill"
            style="width:${percentualNumero}%;"
          ></div>

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

    rankingAreas.appendChild(item);

  });

}


/* =========================================================
   CLASSIFICAÇÃO VISUAL DA ÁREA
========================================================= */

function obterClasseRankingArea(percentual) {

  const valor =
    Number(percentual) || 0;

  if (valor >= TARGET) {
    return "rank-ok";
  }

  if (valor > 0) {
    return "rank-atencao";
  }

  return "rank-critico";

}


/* =========================================================
   TABELA DETALHADA DAS ÁREAS
========================================================= */

function preencherTabelaAreasDashboard(dados) {

  if (!listaAreasDashboard) {
    return;
  }

  listaAreasDashboard.innerHTML = "";

  const areas = dados?.areas || {};

  AREAS_VALIDAS.forEach(nomeArea => {

    const area = areas[nomeArea];

    if (!area) {
      return;
    }

    const linha =
      document.createElement("div");

    linha.className =
      "dashboard-area-row";

    linha.innerHTML = `

      <span>
        ${escaparHTML(nomeArea)}
      </span>

      <span>
        ${Number(area.hc) || 0}
      </span>

      <span class="area-realizados">
        ${Number(area.realizaram) || 0}
      </span>

      <span class="area-processo">
        ${Number(area.processo) || 0}
      </span>

      <span class="area-nao">
        ${Number(area.naoRealizaram) || 0}
      </span>

      <span class="area-percentual">
        ${formatarPorcentagem(
          Number(area.percentual) || 0
        )}
      </span>

    `;

    listaAreasDashboard.appendChild(linha);

  });

}


/* =========================================================
   CONSULTA RÁPIDA
========================================================= */

function preencherDatalistConsulta() {

  if (!listaPessoasConsulta) {
    return;
  }

  listaPessoasConsulta.innerHTML = "";

  const registros =
    Array.isArray(dadosProcessados?.registros)
      ? dadosProcessados.registros
      : [];

  const pessoasOrdenadas = [...registros].sort(
    (a, b) =>
      String(a?.nome || "").localeCompare(
        String(b?.nome || ""),
        "pt-BR"
      )
  );

  pessoasOrdenadas.forEach(pessoa => {

    const nome = String(pessoa?.nome || "").trim();

    if (!nome) {
      return;
    }

    const username =
      String(pessoa?.username || "").trim();

    const option =
      document.createElement("option");

    option.value = nome;

    if (username) {
      option.label =
        `${username} • ${pessoa?.area || "SEM ÁREA"}`;
    }

    listaPessoasConsulta.appendChild(option);

  });

}


/* =========================================================
   NORMALIZAR TEXTO DA CONSULTA
========================================================= */

function normalizarTextoConsulta(valor) {

  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

}


/* =========================================================
   LOCALIZAR PESSOA
========================================================= */

function localizarPessoaConsulta(termo) {

  const registros =
    Array.isArray(dadosProcessados?.registros)
      ? dadosProcessados.registros
      : [];

  const busca = normalizarTextoConsulta(termo);

  if (!busca) {
    return null;
  }

  const resultadoExato = registros.find(pessoa => {

    const nome =
      normalizarTextoConsulta(pessoa?.nome);

    const username =
      normalizarTextoConsulta(pessoa?.username);

    return nome === busca || username === busca;

  });

  if (resultadoExato) {
    return resultadoExato;
  }

  return registros.find(pessoa => {

    const nome =
      normalizarTextoConsulta(pessoa?.nome);

    const username =
      normalizarTextoConsulta(pessoa?.username);

    return (
      nome.includes(busca) ||
      username.includes(busca)
    );

  }) || null;

}


/* =========================================================
   EXECUTAR CONSULTA
========================================================= */

function consultarPessoaSelecionada() {

  if (!consultaPessoa) {
    return;
  }

  const termo = consultaPessoa.value.trim();

  if (!termo) {

    limparResultadoConsulta();
    consultaPessoa.focus();

    return;
  }

  const pessoa = localizarPessoaConsulta(termo);

  if (!pessoa) {

    mostrarPessoaNaoEncontrada(termo);
    return;
  }

  preencherResultadoConsulta(pessoa);

}


/* =========================================================
   PREENCHER RESULTADO DA CONSULTA
========================================================= */

function preencherResultadoConsulta(pessoa) {

  if (!consultaResultado) {
    return;
  }

  const fezGemba =
    gembaConcluido(pessoa?.gemba);

  const iniciouBeARep =
    beRepIniciado(pessoa);

  const concluiuBeARep =
    beRepConcluido(pessoa);

  const emProcesso =
    beRepEmProcesso(pessoa);

  const minutos =
    Number(pessoa?.minutos) || 0;

  const metaMinutos =
    obterTempoMinimoBeARep(pessoa?.area || "");

  const minutosRestantes =
    Math.max(0, metaMinutos - minutos);


  /* =====================================================
     STATUS GERAL
  ===================================================== */

  let textoStatus = "NÃO INICIADO";
  let classeStatus = "status-nao";

  if (concluiuBeARep) {

    textoStatus = "BE A REP CONCLUÍDO";
    classeStatus = "status-concluido";

  } else if (fezGemba && emProcesso) {

    textoStatus = "GEMBA + BE A REP EM PROCESSO";
    classeStatus = "status-processo";

  } else if (fezGemba && !iniciouBeARep) {

    textoStatus = "SOMENTE GEMBA";
    classeStatus = "status-gemba";

  } else if (emProcesso) {

    textoStatus = "BE A REP EM PROCESSO";
    classeStatus = "status-processo";

  } else if (fezGemba) {

    textoStatus = "GEMBA CONCLUÍDO";
    classeStatus = "status-gemba";

  }


  /* =====================================================
     MOSTRAR RESULTADO
  ===================================================== */

  consultaVazia?.classList.add("oculto");
  consultaResultado.classList.remove("oculto");


  /* =====================================================
     STATUS PRINCIPAL
  ===================================================== */

  if (consultaStatusGeral) {

    consultaStatusGeral.textContent = textoStatus;

    consultaStatusGeral.classList.remove(
      "status-concluido",
      "status-processo",
      "status-gemba",
      "status-nao"
    );

    consultaStatusGeral.classList.add(classeStatus);

  }


  /* =====================================================
     IDENTIFICAÇÃO
  ===================================================== */

  if (consultaNome) {
    consultaNome.textContent =
      pessoa?.nome || "SEM NOME";
  }

  if (consultaUsername) {
    consultaUsername.textContent =
      pessoa?.username
        ? `@${pessoa.username}`
        : "Sem username";
  }

  if (consultaArea) {
    consultaArea.textContent =
      pessoa?.area || "SEM ÁREA";
  }

  if (consultaSetor) {
    consultaSetor.textContent =
      pessoa?.setor ||
      pessoa?.setorCadastro ||
      "SEM SETOR";
  }


  /* =====================================================
     GEMBA
  ===================================================== */

  if (consultaGemba) {

    consultaGemba.textContent =
      fezGemba
        ? "Concluído"
        : "Não realizado";

    consultaGemba.className =
      fezGemba
        ? "text-success"
        : "text-danger";

  }


  /* =====================================================
     BE A REP
  ===================================================== */

  if (consultaBeRep) {

    if (concluiuBeARep) {

      consultaBeRep.textContent = "Concluído";
      consultaBeRep.className = "text-success";

    } else if (iniciouBeARep) {

      consultaBeRep.textContent = "Em processo";
      consultaBeRep.className = "text-warning";

    } else {

      consultaBeRep.textContent = "Não iniciado";
      consultaBeRep.className = "text-danger";

    }

  }


  /* =====================================================
     TEMPO REALIZADO
  ===================================================== */

  if (consultaTempo) {

    consultaTempo.textContent =
      pessoa?.tempo || `${minutos} min`;

  }


  /* =====================================================
     META DE TEMPO
  ===================================================== */

  if (consultaMetaTempo) {

    consultaMetaTempo.textContent =
      `${metaMinutos} min`;

  }


  /* =====================================================
     LOCAL / PROCESSO
  ===================================================== */

  if (consultaLocal) {

    consultaLocal.textContent =
      pessoa?.local || "—";

  }


  /* =====================================================
     PEÇAS
  ===================================================== */

  if (consultaPecas) {

    const unidades = Number(pessoa?.unidades);

    consultaPecas.textContent =
      Number.isFinite(unidades)
        ? unidades.toLocaleString("pt-BR", {
            maximumFractionDigits: 0
          })
        : "—";

  }


  /* =====================================================
     PRODUTIVIDADE
  ===================================================== */

  if (consultaProdutividade) {

    const produtividade =
      Number(pessoa?.produtividade);

    consultaProdutividade.textContent =
      Number.isFinite(produtividade)
        ? produtividade.toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          })
        : "—";

  }


  /* =====================================================
     TEMPO RESTANTE
  ===================================================== */

  if (consultaTempoRestante) {

    consultaTempoRestante.classList.remove(
      "text-success",
      "text-warning",
      "text-danger"
    );

    if (concluiuBeARep) {

      consultaTempoRestante.textContent =
        "Meta atingida";

      consultaTempoRestante.classList.add(
        "text-success"
      );

    } else if (iniciouBeARep) {

      consultaTempoRestante.textContent =
        `${minutosRestantes} min`;

      consultaTempoRestante.classList.add(
        "text-warning"
      );

    } else {

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

  consultaResultado?.classList.add("oculto");

  if (consultaVazia) {

    consultaVazia.classList.remove("oculto");

    consultaVazia.innerHTML = `

      <div class="consulta-empty-icon">
        👤
      </div>

      <div>
        <strong>
          Consulte uma pessoa da base
        </strong>

        <span>
          O resultado mostrará Gemba, Be a Rep,
          tempo e informações operacionais.
        </span>
      </div>

    `;

  }

}


/* =========================================================
   PESSOA NÃO ENCONTRADA
========================================================= */

function mostrarPessoaNaoEncontrada(termo) {

  consultaResultado?.classList.add("oculto");

  if (!consultaVazia) {
    return;
  }

  consultaVazia.classList.remove("oculto");

  consultaVazia.innerHTML = `

    <div class="consulta-empty-icon">
      🔎
    </div>

    <div>
      <strong>
        Pessoa não encontrada
      </strong>

      <span>
        Não encontramos
        “${escaparHTML(termo)}”
        na base do mês selecionado.
      </span>
    </div>

  `;

}


/* =========================================================
   PREENCHER RESUMO
========================================================= */


function preencherResumo(dados) {

  if (!dados) return;

  const geral = dados.geral || {};

  const hc = Number(geral.hc) || 0;
  const realizaram = Number(geral.realizaram) || 0;
  const processo = Number(geral.processo) || 0;
  const naoRealizaram = Number(geral.naoRealizaram) || 0;

  const atualizar = (id, valor) => {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = valor;
    }
  };

  const percentual = quantidade =>
    hc > 0 ? quantidade / hc : 0;

  atualizar("resumo-hc", hc);
  atualizar("resumo-realizaram", realizaram);
  atualizar("resumo-processo", processo);
  atualizar("resumo-nao", naoRealizaram);

  atualizar(
    "percentual-resumo-realizaram",
    formatarPorcentagem(percentual(realizaram))
  );

  atualizar(
    "percentual-resumo-processo",
    formatarPorcentagem(percentual(processo))
  );

  atualizar(
    "percentual-resumo-nao",
    formatarPorcentagem(percentual(naoRealizaram))
  );

  atualizar(
    "percentual-meta-dashboard",
    formatarPorcentagem(percentual(realizaram))
  );

  const barra = document.getElementById(
    "barra-meta-preenchida"
  );

  if (barra) {
    barra.style.width =
      `${Math.min(100, percentual(realizaram) * 100)}%`;
  }

  atualizar(
    "texto-progresso-meta",
    `Target ${formatarPorcentagem(TARGET)}`
  );

}

  /* =====================================================
     ATUALIZAR INDICADORES DO RESUMO
  ===================================================== */

  const indicadores = {

    "resumo-hc": hc,

    "resumo-realizaram": realizaram,

    "resumo-processo": processo,

    "resumo-nao-realizaram": naoRealizaram,

    "resumo-percentual":
      formatarPorcentagem(percentual)

  };

  Object.entries(indicadores).forEach(
    ([id, valor]) => {

      const elemento = $(id);

      if (elemento) {
        elemento.textContent = valor;
      }

    }
  );


  /* =====================================================
     TEXTO DO RESUMO
  ===================================================== */

  if (resumoDados) {

    resumoDados.textContent =
      `${hc} pessoas na base • ` +
      `${realizaram} realizaram • ` +
      `${processo} em processo • ` +
      `${naoRealizaram} não realizaram`;

  }

}


/* =========================================================
   META GERAL DO BE A REP
========================================================= */


function preencherMeta(dados) {

  if (!dados) return;

  const geral = dados.geral || {};

  const hc = Number(geral.hc) || 0;
  const realizaram = Number(geral.realizaram) || 0;

  const percentual =
    hc > 0 ? realizaram / hc : 0;

  const metaQuantidade = Math.ceil(hc * TARGET);

  const faltam = Math.max(
    0,
    metaQuantidade - realizaram
  );

  const atingiuMeta =
    hc > 0 && percentual >= TARGET;

  const atualizar = (id, valor) => {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = valor;
    }
  };

  atualizar(
    "situacao-atual",
    formatarPorcentagem(percentual)
  );

  atualizar("situacao-faltam", faltam);

  atualizar(
    "titulo-situacao",
    atingiuMeta
      ? "Target atingido!"
      : "Acompanhamento do target"
  );

  atualizar(
    "descricao-situacao",
    `${realizaram} de ${hc} pessoas realizaram o Be a Rep.`
  );

  atualizar(
    "status-meta",
    atingiuMeta
      ? "META ATINGIDA"
      : "ABAIXO DA META"
  );

  atualizar(
    "mensagem-meta",
    atingiuMeta
      ? "O resultado está dentro do target de 90%."
      : `Faltam ${faltam} pessoa(s) para atingir o target de 90%.`
  );

}


  /* =====================================================
     INDICADORES DA META
  ===================================================== */

  const elementoTarget =
    $("meta-target");

  const elementoFaltam =
    $("meta-faltam");

  const elementoStatus =
    $("meta-status");

  const elementoBarra =
    $("meta-progresso");

  const elementoTexto =
    $("meta-texto");


  if (elementoTarget) {

    elementoTarget.textContent =
      formatarPorcentagem(TARGET);

  }


  if (elementoFaltam) {

    elementoFaltam.textContent =
      faltam;

  }


  if (elementoStatus) {

    elementoStatus.textContent =
      atingiuMeta
        ? "META ATINGIDA"
        : "ABAIXO DA META";

    elementoStatus.classList.toggle(
      "meta-atingida",
      atingiuMeta
    );

    elementoStatus.classList.toggle(
      "meta-pendente",
      !atingiuMeta
    );

  }


  /* =====================================================
     BARRA DE PROGRESSO
  ===================================================== */

  if (elementoBarra) {

    const largura =
      Math.max(
        0,
        Math.min(
          100,
          percentual * 100
        )
      );

    elementoBarra.style.width =
      `${largura}%`;

  }


  /* =====================================================
     MENSAGEM DA META
  ===================================================== */

  if (elementoTexto) {

    if (hc === 0) {

      elementoTexto.textContent =
        "Não há pessoas na base selecionada.";

    } else if (atingiuMeta) {

      elementoTexto.textContent =
        `Meta de 90% atingida! ` +
        `${realizaram} de ${hc} pessoas realizaram.`;

    } else {

      elementoTexto.textContent =
        `Faltam ${faltam} pessoa(s) ` +
        `para atingir o target de 90%.`;

    }

  }

}


/* =========================================================
   ALERTA DE PESSOAS SEM CADASTRO
========================================================= */

function preencherAlertaSemCadastro(dados) {

  const semCadastro =
    Array.isArray(dados?.semCadastro)
      ? dados.semCadastro
      : [];

  const quantidade =
    semCadastro.length;

  const elementoAlerta =
    $("alerta-sem-cadastro");

  const elementoQuantidade =
    $("quantidade-sem-cadastro");

  const elementoLista =
    $("lista-sem-cadastro");


  /* =====================================================
     QUANTIDADE
  ===================================================== */

  if (elementoQuantidade) {

    elementoQuantidade.textContent =
      quantidade;

  }


  /* =====================================================
     MOSTRAR OU OCULTAR ALERTA
  ===================================================== */

  if (elementoAlerta) {

    elementoAlerta.classList.toggle(
      "oculto",
      quantidade === 0
    );

  }


  /* =====================================================
     LISTA DE PESSOAS
  ===================================================== */

  if (elementoLista) {

    elementoLista.innerHTML = "";

    semCadastro.forEach(pessoa => {

      const item =
        document.createElement("div");

      item.className =
        "sem-cadastro-item";

      const nome =
        pessoa.nome ||
        pessoa.username ||
        "SEM IDENTIFICAÇÃO";

      const username =
        pessoa.username
          ? `@${pessoa.username}`
          : "";

      item.textContent =
        `${nome} ${username}`.trim();

      elementoLista.appendChild(item);

    });

  }

}


/* =========================================================
   FUNÇÕES DE FORMATAÇÃO
========================================================= */

/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(valor) {

  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

}


/* =========================================================
   LIMPAR TEXTO
========================================================= */

function limparTexto(valor) {

  return String(valor ?? "").trim();

}


/* =========================================================
   FORMATAR PORCENTAGEM
========================================================= */

function formatarPorcentagem(valor) {

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0,0%";
  }

  return (
    (numero * 100).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    ) + "%"
  );

}


/* =========================================================
   FORMATAR MINUTOS
========================================================= */

function formatarMinutos(valor) {

  const minutos = Math.max(
    0,
    Math.floor(Number(valor) || 0)
  );

  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;

  if (horas === 0) {
    return `${restante} min`;
  }

  if (restante === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${String(restante).padStart(2, "0")}min`;

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(valor) {

  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   TEMPO MÍNIMO DO BE A REP
========================================================= */

function obterTempoMinimoBeARep(area) {

  const areaNormalizada = normalizarTexto(area);

  if (areaNormalizada === "OPEX") {
    return 10;
  }

  return 60;

}


/* =========================================================
   NORMALIZAR ÁREA
========================================================= */

function normalizarArea(valor) {

  const texto = normalizarTexto(valor);

  if (!texto) {
    return "";
  }

  if (
    texto.includes("RETIROS") ||
    texto.includes("RETIRO")
  ) {
    return "Retiros";
  }

  if (
    texto.includes("OUTBOUND") ||
    texto === "OUT"
  ) {
    return "Outbound";
  }

  if (
    texto.includes("INBOUND") ||
    texto === "IN"
  ) {
    return "Inbound";
  }

  if (texto.includes("OPEX")) {
    return "OPEX";
  }

  if (texto.includes("ICQA")) {
    return "ICQA";
  }

  return "";

}


/* =========================================================
   FORMATAR NÚMERO INTEIRO
========================================================= */

function formatarNumeroInteiro(valor) {

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return Math.round(numero).toLocaleString("pt-BR");

}


/* =========================================================
   FORMATAR PRODUTIVIDADE
========================================================= */

function formatarProdutividade(valor) {

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

}


/* =========================================================
   PROCESSAMENTO DA BASE DA API
========================================================= */

function processarDadosApi(registros, referencia) {

  if (!Array.isArray(registros)) {
    throw new Error(
      "Formato inválido retornado pela API."
    );
  }

  const referenciaNormalizada =
    normalizarReferenciaMes(referencia);

  /* =====================================================
     FILTRAR MÊS SELECIONADO
  ===================================================== */

  const registrosDoMes = registros.filter(registro => {

    const mesRegistro = normalizarReferenciaMes(
      obterValorObjeto(registro, [
        "MES",
        "mes",
        "MÊS",
        "MES_BE_A_REP"
      ])
    );

    return mesRegistro === referenciaNormalizada;

  });

  if (!registrosDoMes.length) {
    throw new Error(
      `Nenhum registro encontrado para ${
        formatarReferenciaFiltro(referenciaNormalizada)
      }.`
    );
  }

  /* =====================================================
     NORMALIZAR DADOS DOS COLABORADORES
  ===================================================== */

  const pessoas = registrosDoMes.map(registro => {

    const username = limparTexto(
      obterValorObjeto(registro, [
        "USERNAME",
        "username",
        "LOGIN",
        "login"
      ])
    ).toLowerCase();

    const nome = limparTexto(
      obterValorObjeto(registro, [
        "FULL_NAME",
        "NOME",
        "nome",
        "CAD",
        "cad",
        "USERNAME"
      ])
    );

    /* ===================================================
       GERENTE E SUPERVISOR

       MANAGER = GERENTE
       MANAGER_USERNAME = SUPERVISOR
    =================================================== */

    const gerenteUsername = limparTexto(
      obterValorObjeto(registro, [
        "MANAGER",
        "manager"
      ])
    ).toLowerCase();

    const supervisorUsername = limparTexto(
      obterValorObjeto(registro, [
        "MANAGER_USERNAME",
        "manager_username"
      ])
    ).toLowerCase();

    /* ===================================================
       ÁREA E SETOR
    =================================================== */

    const areaOriginal = limparTexto(
      obterValorObjeto(registro, [
        "ÁREA CONSOLIDADA",
        "AREA CONSOLIDADA",
        "área consolidada",
        "area consolidada",
        "AREA",
        "area",
        "ÁREA"
      ])
    );

    const area = normalizarArea(areaOriginal);

    const setor = limparTexto(
      obterValorObjeto(registro, [
        "SETOR",
        "setor",
        "SUBPROCESSO",
        "subprocesso",
        "PROCESO",
        "PROCESSO"
      ])
    );

    /* ===================================================
       TEMPO REALIZADO
    =================================================== */

    const horas = obterValorObjeto(registro, [
      "SUMA_HORAS_MES",
      "suma_horas_mes",
      "SOMA_HORAS_MES",
      "soma_horas_mes",
      "HORAS",
      "horas",
      "TEMPO",
      "tempo"
    ]);

    const minutos =
      converterTempoParaMinutos(horas);

    const tempo =
      formatarMinutos(minutos);

    /* ===================================================
       PEÇAS E PRODUTIVIDADE
    =================================================== */

    const unidades = numeroSeguroBeARep(
      obterValorObjeto(registro, [
        "UNIDADES",
        "unidades",
        "PECAS",
        "PEÇAS"
      ])
    );

    const produtividade = numeroSeguroBeARep(
      obterValorObjeto(registro, [
        "PRODUCTIVIDAD",
        "PRODUTIVIDADE",
        "produtividade"
      ])
    );

    /* ===================================================
       GEMBA E STATUS
    =================================================== */

    const gemba = limparTexto(
      obterValorObjeto(registro, [
        "GEMBA",
        "gemba"
      ])
    );

    const statusBar = limparTexto(
      obterValorObjeto(registro, [
        "ESTADO_BAR",
        "estado_bar",
        "STATUS_BAR"
      ])
    );

    const local = limparTexto(
      obterValorObjeto(registro, [
        "PROCESOS_LMS",
        "processos_lms",
        "LOCAL",
        "local",
        "PROCESSO",
        "processo"
      ])
    );

    const obrigatoriedade = normalizarTexto(
      obterValorObjeto(registro, [
        "FLAG_OBLIGATORIEDAD",
        "flag_obligatoriedad",
        "OBRIGATORIEDADE"
      ])
    );

    /* ===================================================
       CLASSIFICAÇÃO
    =================================================== */

    const temCadastroArea = Boolean(area);

    const situacao = classificarSituacao(
      gemba,
      statusBar,
      minutos,
      area
    );

    return {
      username,
      gerenteUsername,
      supervisorUsername,

      nome: nome || username || "SEM NOME",

      areaOriginal,
      area,
      setor,
      setorCadastro: setor,
      temCadastroArea,

      minutos,
      tempo,
      unidades,
      produtividade,

      gemba,
      statusBar,
      local,
      obrigatoriedade,

      mes: referenciaNormalizada,
      situacao,
      registroOriginal: registro
    };

  });

  /* =====================================================
     EXCLUIR COLABORADORES NÃO OBRIGATÓRIOS
  ===================================================== */

  const obrigatorios = pessoas.filter(pessoa => {

    const areaOriginal =
      normalizarTexto(pessoa.areaOriginal);

    const setor =
      normalizarTexto(pessoa.setor);

    /* LINE HAUL NÃO ENTRA NO TARGET */

    if (
      areaOriginal.includes("LINE HAUL") ||
      setor === "LINE HAUL"
    ) {
      return false;
    }

    const flag = pessoa.obrigatoriedade;

    if (!flag) {
      return true;
    }

    return ![
      "NO",
      "NAO",
      "NÃO",
      "FALSE",
      "0",
      "NO OBLIGATORIO",
      "NAO OBRIGATORIO",
      "NÃO OBRIGATÓRIO"
    ].includes(flag);

  });

  /* =====================================================
     REMOVER DUPLICIDADES
  ===================================================== */

  const pessoasUnicas =
    removerDuplicidades(obrigatorios);

  if (!pessoasUnicas.length) {
    throw new Error(
      `Nenhuma pessoa obrigatória encontrada para ${
        formatarReferenciaFiltro(referenciaNormalizada)
      }.`
    );
  }

  /* =====================================================
     GUARDAR BASE COMPLETA DO MÊS

     Esta base será usada pelos filtros
     de Gerente e Supervisor.
  ===================================================== */

  pessoasMesSemFiltro = [...pessoasUnicas];

  /* =====================================================
     PROCESSAR INDICADORES
  ===================================================== */

  return processarRegistros(pessoasUnicas);

}


/* =========================================================
   FILTROS DE GERENTE E SUPERVISOR
========================================================= */

/* =========================================================
   IDENTIFICAR LIDERANÇAS DO MÊS
========================================================= */

function prepararLiderancasDoMes() {

  const pessoas = Array.isArray(pessoasMesSemFiltro)
    ? pessoasMesSemFiltro
    : [];

  /* =====================================================
     MAPA DE NOMES POR USERNAME
  ===================================================== */

  nomesPorUsername = new Map();

  pessoas.forEach(pessoa => {

    const username =
      normalizarUsernameLideranca(pessoa.username);

    const nome = String(pessoa.nome || "").trim();

    if (username && nome) {
      nomesPorUsername.set(username, nome);
    }

  });

  /* =====================================================
     REVALIDAR FILTROS APÓS MUDANÇA DE MÊS
  ===================================================== */

  const gerentesDisponiveis = new Set(
    pessoas
      .map(pessoa =>
        normalizarUsernameLideranca(
          pessoa.gerenteUsername
        )
      )
      .filter(Boolean)
  );

  if (
    gerenteSelecionado &&
    !gerentesDisponiveis.has(gerenteSelecionado)
  ) {
    gerenteSelecionado = "";
    supervisorSelecionado = "";
  }

  const supervisoresDisponiveis = new Set(
    pessoas
      .filter(pessoa =>
        !gerenteSelecionado ||
        normalizarUsernameLideranca(
          pessoa.gerenteUsername
        ) === gerenteSelecionado
      )
      .map(pessoa =>
        normalizarUsernameLideranca(
          pessoa.supervisorUsername
        )
      )
      .filter(Boolean)
  );

  if (
    supervisorSelecionado &&
    !supervisoresDisponiveis.has(supervisorSelecionado)
  ) {
    supervisorSelecionado = "";
  }

  atualizarFiltrosLideranca();
  aplicarFiltrosLideranca();

}


/* =========================================================
   NORMALIZAR USERNAME
========================================================= */

function normalizarUsernameLideranca(valor) {

  return String(valor || "")
    .trim()
    .toLowerCase();

}


/* =========================================================
   NOME DE EXIBIÇÃO DA LIDERANÇA
========================================================= */


function obterNomeExibicaoLideranca(username) {

  const login = normalizarUsernameLideranca(username);

  if (!login) return "";

  if (LIDERANCAS_OFICIAIS[login]) {
    return LIDERANCAS_OFICIAIS[login].nome;
  }

  if (NOMES_SUPERVISORES[login]) {
    return NOMES_SUPERVISORES[login];
  }

  const nome = nomesPorUsername.get(login);

  return nome || login;
}

/* =========================================================
   ATUALIZAR OPÇÕES DOS FILTROS
========================================================= */


function atualizarFiltrosLideranca() {

  const filtroGerente = $("filtro-gerente");
  const filtroSupervisor = $("filtro-supervisor");

  const pessoas = Array.isArray(pessoasMesSemFiltro)
    ? pessoasMesSemFiltro
    : [];

  const normalizar = valor =>
    String(valor || "").trim().toLowerCase();

  const pessoasDaArea = pessoas.filter(pessoa =>
    !areaSelecionada ||
    normalizar(pessoa.area) === normalizar(areaSelecionada)
  );

  // Gerentes oficiais presentes na base e na área
  const gerentes = Object.keys(LIDERANCAS_OFICIAIS)
    .filter(username =>
      pessoasDaArea.some(pessoa =>
        normalizarUsernameLideranca(
          pessoa.gerenteUsername
        ) === username
      )
    );

  if (
    gerenteSelecionado &&
    !gerentes.includes(gerenteSelecionado)
  ) {
    gerenteSelecionado = "";
    supervisorSelecionado = "";
  }

  if (filtroGerente) {
    filtroGerente.innerHTML = "";
    filtroGerente.add(
      new Option("Todos os gerentes", "")
    );

    gerentes.forEach(username => {
      filtroGerente.add(
        new Option(
          LIDERANCAS_OFICIAIS[username].nome,
          username
        )
      );
    });

    filtroGerente.value = gerenteSelecionado;
  }

  // Supervisores vinculados aos gerentes oficiais
  const supervisoresPermitidos = gerenteSelecionado
    ? LIDERANCAS_OFICIAIS[gerenteSelecionado]
        ?.supervisores || []
    : Object.values(LIDERANCAS_OFICIAIS)
        .flatMap(gerente => gerente.supervisores);

  const supervisores = [
    ...new Set(supervisoresPermitidos)
  ].filter(username =>
    pessoasDaArea.some(pessoa => {

      const supervisor =
        normalizarUsernameLideranca(
          pessoa.supervisorUsername
        );

      const gerente =
        normalizarUsernameLideranca(
          pessoa.gerenteUsername
        );

      return (
        supervisor === username &&
        (
          !gerenteSelecionado ||
          gerente === gerenteSelecionado
        )
      );
    })
  );

  if (
    supervisorSelecionado &&
    !supervisores.includes(supervisorSelecionado)
  ) {
    supervisorSelecionado = "";
  }

  if (filtroSupervisor) {
    filtroSupervisor.innerHTML = "";
    filtroSupervisor.add(
      new Option("Todos os supervisores", "")
    );

    supervisores.forEach(username => {
      filtroSupervisor.add(
        new Option(
          NOMES_SUPERVISORES[username] || username,
          username
        )
      );
    });

    filtroSupervisor.value = supervisorSelecionado;
  }
}


  /* =====================================================
     GERENTES DISPONÍVEIS
  ===================================================== */

  const gerentes = [
    ...new Set(
      pessoas
        .map(pessoa =>
          normalizarUsernameLideranca(
            pessoa.gerenteUsername
          )
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    obterNomeExibicaoLideranca(a).localeCompare(
      obterNomeExibicaoLideranca(b),
      "pt-BR"
    )
  );

  if (filtroGerente) {

    filtroGerente.innerHTML = "";

    filtroGerente.add(
      new Option("Todos os gerentes", "")
    );

    gerentes.forEach(username => {

      filtroGerente.add(
        new Option(
          obterNomeExibicaoLideranca(username),
          username
        )
      );

    });

    filtroGerente.value =
      gerentes.includes(gerenteSelecionado)
        ? gerenteSelecionado
        : "";

  }

  /* =====================================================
     SUPERVISORES DO GERENTE SELECIONADO
  ===================================================== */

  const pessoasDoGerente = pessoas.filter(pessoa => {

    if (!gerenteSelecionado) {
      return true;
    }

    return (
      normalizarUsernameLideranca(
        pessoa.gerenteUsername
      ) === gerenteSelecionado
    );

  });

  const supervisores = [
    ...new Set(
      pessoasDoGerente
        .map(pessoa =>
          normalizarUsernameLideranca(
            pessoa.supervisorUsername
          )
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    obterNomeExibicaoLideranca(a).localeCompare(
      obterNomeExibicaoLideranca(b),
      "pt-BR"
    )
  );

  if (
    supervisorSelecionado &&
    !supervisores.includes(supervisorSelecionado)
  ) {
    supervisorSelecionado = "";
  }

  if (filtroSupervisor) {

    filtroSupervisor.innerHTML = "";

    filtroSupervisor.add(
      new Option("Todos os supervisores", "")
    );

    supervisores.forEach(username => {

      filtroSupervisor.add(
        new Option(
          obterNomeExibicaoLideranca(username),
          username
        )
      );

    });

    filtroSupervisor.value =
      supervisorSelecionado;

  }

}


/* =========================================================
   APLICAR FILTROS DE LIDERANÇA
========================================================= */

function aplicarFiltrosLideranca() {

  const pessoas = Array.isArray(pessoasMesSemFiltro)
    ? pessoasMesSemFiltro
    : [];

  if (!pessoas.length) {
    return;
  }

  const filtradas = pessoas.filter(pessoa => {

    const gerente =
      normalizarUsernameLideranca(
        pessoa.gerenteUsername
      );

    const supervisor =
      normalizarUsernameLideranca(
        pessoa.supervisorUsername
      );

     
const correspondeArea =
  !areaSelecionada ||
  pessoa.area === areaSelecionada;

    const correspondeGerente =
      !gerenteSelecionado ||
      gerente === gerenteSelecionado;

    const correspondeSupervisor =
      !supervisorSelecionado ||
      supervisor === supervisorSelecionado;

return (
  correspondeArea &&
  correspondeGerente &&
  correspondeSupervisor
);

    );

  });

  /* =====================================================
     EVITAR ERRO QUANDO NÃO HÁ PESSOAS
  ===================================================== */

  if (!filtradas.length) {

    console.warn(
      "Nenhuma pessoa encontrada para os filtros selecionados."
    );

    dadosProcessados = {
      mes: formatarReferenciaFiltro(
        referenciaSelecionada
      ),
      areas: criarEstruturaAreas(),
      geral: {
        hc: 0,
        realizaram: 0,
        processo: 0,
        naoRealizaram: 0,
        percentual: 0
      },
      registros: [],
      realizaramDetalhe: [],
      processo: [],
      naoRealizaram: [],
      guembaPendenteBeARep: [],
      guembaProcessandoBeARep: [],
      semCadastro: [],
      quantidadeSemCadastro: 0
    };

  } else {

    dadosProcessados =
      processarRegistros(filtradas);

  }

  /* =====================================================
     ATUALIZAR TODOS OS COMPONENTES
  ===================================================== */

  atualizarTudo();

  atualizarResumoFiltroLideranca(
    filtradas.length
  );

}


/* =========================================================
   RESUMO DOS FILTROS ATIVOS
========================================================= */

function atualizarResumoFiltroLideranca(quantidade) {

  const elemento =
    $("resumo-filtro-lideranca");

  if (!elemento) {
    return;
  }

  const gerente = gerenteSelecionado
    ? obterNomeExibicaoLideranca(
        gerenteSelecionado
      )
    : "Todos os gerentes";

  const supervisor = supervisorSelecionado
    ? obterNomeExibicaoLideranca(
        supervisorSelecionado
      )
    : "Todos os supervisores";

  elemento.textContent =
    `${gerente} • ${supervisor} • ` +
    `${quantidade} pessoa(s)`;

}


/* =========================================================
   FUNÇÕES AUXILIARES DA API
========================================================= */

/* =========================================================
   OBTER VALOR DE UMA COLUNA
========================================================= */

function obterValorObjeto(objeto, chaves) {

  if (!objeto || typeof objeto !== "object") {
    return "";
  }

  for (const chave of chaves) {

    if (
      Object.prototype.hasOwnProperty.call(
        objeto,
        chave
      )
    ) {

      const valor = objeto[chave];

      if (
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ""
      ) {
        return valor;
      }

    }

  }

  /* =====================================================
     BUSCA FLEXÍVEL POR NOME DA COLUNA
  ===================================================== */

  const normalizarChave = valor =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/[\s-]+/g, "_")
      .toUpperCase();

  const colunas = Object.keys(objeto);

  for (const chaveProcurada of chaves) {

    const colunaEncontrada = colunas.find(
      coluna =>
        normalizarChave(coluna) ===
        normalizarChave(chaveProcurada)
    );

    if (!colunaEncontrada) {
      continue;
    }

    const valor = objeto[colunaEncontrada];

    if (
      valor !== null &&
      valor !== undefined &&
      String(valor).trim() !== ""
    ) {
      return valor;
    }

  }

  return "";

}


/* =========================================================
   CONVERTER TEMPO PARA MINUTOS
========================================================= */

function converterTempoParaMinutos(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  /* =====================================================
     VALORES NUMÉRICOS

     Frações menores que 1 podem representar
     frações de um dia em planilhas.
  ===================================================== */

  if (typeof valor === "number") {

    if (!Number.isFinite(valor)) {
      return 0;
    }

    if (valor > 0 && valor < 1) {
      return Math.round(valor * 24 * 60);
    }

    return Math.max(0, Math.round(valor));

  }

  const texto = String(valor).trim();

  if (!texto) {
    return 0;
  }

  /* =====================================================
     FORMATO HH:MM:SS OU HH:MM
  ===================================================== */

  const horario = texto.match(
    /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/
  );

  if (horario) {

    const horas = Number(horario[1]);
    const minutos = Number(horario[2]);
    const segundos = Number(horario[3] || 0);

    return Math.round(
      horas * 60 +
      minutos +
      segundos / 60
    );

  }

  /* =====================================================
     FORMATO 1h 30m / 1h / 35min
  ===================================================== */

  const textoNormalizado =
    texto.toLowerCase().replace(",", ".");

  const horasEncontradas =
    textoNormalizado.match(
      /(\d+(?:\.\d+)?)\s*h(?:oras?)?/
    );

  const minutosEncontrados =
    textoNormalizado.match(
      /(\d+(?:\.\d+)?)\s*(?:minutos?|mins?|m)(?![a-z])/
    );

  if (horasEncontradas || minutosEncontrados) {

    const horas = horasEncontradas
      ? Number(horasEncontradas[1])
      : 0;

    const minutos = minutosEncontrados
      ? Number(minutosEncontrados[1])
      : 0;

    return Math.round(
      horas * 60 + minutos
    );

  }

  /* =====================================================
     VALOR NUMÉRICO EM TEXTO
  ===================================================== */

  const numero = Number(
    texto.replace(",", ".")
  );

  if (!Number.isFinite(numero)) {
    return 0;
  }

  if (numero > 0 && numero < 1) {
    return Math.round(numero * 24 * 60);
  }

  return Math.max(0, Math.round(numero));

}


/* =========================================================
   NORMALIZAR REFERÊNCIA DO MÊS

   Resultado padrão: MM-AAAA
========================================================= */


function normalizarReferenciaMes(valor) {

  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return "";

    return (
      String(valor.getMonth() + 1).padStart(2, "0") +
      "-" +
      valor.getFullYear()
    );
  }

  const texto = String(valor)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let resultado = texto.match(/^(\d{1,2})[-/](\d{4})$/);

  if (resultado) {
    const mes = Number(resultado[1]);

    return mes >= 1 && mes <= 12
      ? `${String(mes).padStart(2, "0")}-${resultado[2]}`
      : "";
  }

  resultado = texto.match(/^(\d{4})[-/](\d{1,2})$/);

  if (resultado) {
    const mes = Number(resultado[2]);

    return mes >= 1 && mes <= 12
      ? `${String(mes).padStart(2, "0")}-${resultado[1]}`
      : "";
  }

  resultado = texto.match(/^(\d{4})-(\d{1,2})-\d{1,2}/);

  if (resultado) {
    const mes = Number(resultado[2]);

    return mes >= 1 && mes <= 12
      ? `${String(mes).padStart(2, "0")}-${resultado[1]}`
      : "";
  }

  resultado = texto.match(/^\d{1,2}\/(\d{1,2})\/(\d{4})$/);

  if (resultado) {
    const mes = Number(resultado[1]);

    return mes >= 1 && mes <= 12
      ? `${String(mes).padStart(2, "0")}-${resultado[2]}`
      : "";
  }

  const meses = {
    JANEIRO: "01",
    ENERO: "01",
    FEVEREIRO: "02",
    FEBRERO: "02",
    MARCO: "03",
    MARZO: "03",
    ABRIL: "04",
    ABRIL_ES: "04",
    MAIO: "05",
    MAYO: "05",
    JUNHO: "06",
    JUNIO: "06",
    JULHO: "07",
    JULIO: "07",
    AGOSTO: "08",
    SETEMBRO: "09",
    SEPTIEMBRE: "09",
    SETIEMBRE: "09",
    OUTUBRO: "10",
    OCTUBRE: "10",
    NOVEMBRO: "11",
    NOVIEMBRE: "11",
    DEZEMBRO: "12",
    DICIEMBRE: "12"
  };

  const ano = texto.match(/\b(?:19|20)\d{2}\b/);

  if (!ano) return "";

  for (const [nome, mes] of Object.entries(meses)) {
    if (texto.includes(nome)) {
      return `${mes}-${ano[0]}`;
    }
  }

  return "";
}


  /* =====================================================
     MM-AAAA OU MM/AAAA
  ===================================================== */

  let correspondencia = texto.match(
    /^(\d{1,2})[-/](\d{4})$/
  );

  if (correspondencia) {

    const mes = Number(correspondencia[1]);

    if (mes >= 1 && mes <= 12) {

      return (
        String(mes).padStart(2, "0") +
        "-" +
        correspondencia[2]
      );

    }

  }

  /* =====================================================
     AAAA-MM OU AAAA/MM
  ===================================================== */

  correspondencia = texto.match(
    /^(\d{4})[-/](\d{1,2})$/
  );

  if (correspondencia) {

    const mes = Number(correspondencia[2]);

    if (mes >= 1 && mes <= 12) {

      return (
        String(mes).padStart(2, "0") +
        "-" +
        correspondencia[1]
      );

    }

  }

  /* =====================================================
     DATAS COMPLETAS
  ===================================================== */

  correspondencia = texto.match(
    /^(\d{4})-(\d{1,2})-\d{1,2}/
  );

  if (correspondencia) {

    return (
      String(Number(correspondencia[2]))
        .padStart(2, "0") +
      "-" +
      correspondencia[1]
    );

  }

  correspondencia = texto.match(
    /^\d{1,2}\/(\d{1,2})\/(\d{4})$/
  );

  if (correspondencia) {

    return (
      String(Number(correspondencia[1]))
        .padStart(2, "0") +
      "-" +
      correspondencia[2]
    );

  }

  /* =====================================================
     NOMES DOS MESES
  ===================================================== */

  const meses = {
    JANEIRO: "01",
    FEVEREIRO: "02",
    MARCO: "03",
    ABRIL: "04",
    MAIO: "05",
    JUNHO: "06",
    JULHO: "07",
    AGOSTO: "08",
    SETEMBRO: "09",
    OUTUBRO: "10",
    NOVEMBRO: "11",
    DEZEMBRO: "12"
  };

  const semAcento = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [nome, mes] of Object.entries(meses)) {

    if (semAcento.includes(nome)) {

      const ano = semAcento.match(/\b20\d{2}\b/);

      if (ano) {
        return `${mes}-${ano[0]}`;
      }

    }

  }

  return texto;

}


/* =========================================================
   OBTER MÊS ATUAL
========================================================= */

function obterReferenciaMesAtual() {

  const agora = new Date();

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");

  return `${mes}-${agora.getFullYear()}`;

}


/* =========================================================
   FORMATAR REFERÊNCIA PARA EXIBIÇÃO
========================================================= */

function formatarReferenciaFiltro(referencia) {

  return normalizarReferenciaMes(referencia);

}


/* =========================================================
   CLASSIFICAÇÃO E INDICADORES
========================================================= */

/* =========================================================
   CRIAR ESTRUTURA DAS ÁREAS
========================================================= */

function criarEstruturaAreas() {

  const estrutura = {};

  AREAS_VALIDAS.forEach(area => {

    estrutura[area] = {
      hc: 0,
      realizaram: 0,
      processo: 0,
      naoRealizaram: 0,
      percentual: 0
    };

  });

  return estrutura;

}


/* =========================================================
   CALCULAR INDICADORES GERAIS

   REALIZARAM:
   - Gemba concluído OU Be a Rep concluído

   EM PROCESSO:
   - Sem Gemba concluído
   - Be a Rep iniciado
   - Tempo mínimo ainda não atingido

   NÃO REALIZARAM:
   - Sem Gemba concluído
   - Be a Rep não iniciado
========================================================= */

function calcularGeralPorRegistros(registros) {

  const hc = registros.length;

  let realizaram = 0;
  let processo = 0;
  let naoRealizaram = 0;

  registros.forEach(pessoa => {

    if (pessoa.situacao === "REALIZOU") {

      realizaram++;

    } else if (
      pessoa.situacao === "EM_PROCESSO"
    ) {

      processo++;

    } else {

      naoRealizaram++;

    }

  });

  const percentual =
    hc > 0 ? realizaram / hc : 0;

  return {
    hc,
    realizaram,
    processo,
    naoRealizaram,
    percentual
  };

}


/* =========================================================
   CLASSIFICAR SITUAÇÃO GERAL
========================================================= */

function classificarSituacao(
  valorGemba,
  valorBar,
  minutos,
  area
) {

  const pessoa = {
    statusBar: valorBar,
    minutos: Number(minutos) || 0,
    area
  };

  const fezGemba =
    gembaConcluido(valorGemba);

  const concluiuBeARep =
    beRepConcluido(pessoa);

  const iniciouBeARep =
    beRepIniciado(pessoa);

  if (fezGemba || concluiuBeARep) {
    return "REALIZOU";
  }

  if (iniciouBeARep) {
    return "EM_PROCESSO";
  }

  return "NAO_REALIZOU";

}


/* =========================================================
   BE A REP INICIADO
========================================================= */

function beRepIniciado(pessoa) {

  const minutos =
    Number(pessoa?.minutos) || 0;

  return minutos > 0;

}


/* =========================================================
   BE A REP CONCLUÍDO
========================================================= */

function beRepConcluido(pessoa) {

  const minutos =
    Number(pessoa?.minutos) || 0;

  const minimo =
    obterTempoMinimoBeARep(
      pessoa?.area || ""
    );

  return minutos >= minimo;

}


/* =========================================================
   BE A REP EM PROCESSO
========================================================= */

function beRepEmProcesso(pessoa) {

  const minutos =
    Number(pessoa?.minutos) || 0;

  const minimo =
    obterTempoMinimoBeARep(
      pessoa?.area || ""
    );

  return minutos > 0 && minutos < minimo;

}


/* =========================================================
   GEMBA CONCLUÍDO
========================================================= */

function gembaConcluido(gemba) {

  const status =
    normalizarTexto(gemba);

  const concluidos = [
    "HECHO",
    "CUMPLIO",
    "REALIZADO",
    "CONCLUIDO"
  ];

  return concluidos.includes(status);

}


/* =========================================================
   ORDENAÇÃO DAS LISTAS
========================================================= */

function ordenarNome(a, b) {

  return String(a?.nome || "").localeCompare(
    String(b?.nome || ""),
    "pt-BR"
  );

}


function ordenarTempoNome(a, b) {

  const minutosA =
    Number(a?.minutos) || 0;

  const minutosB =
    Number(b?.minutos) || 0;

  if (minutosB !== minutosA) {
    return minutosB - minutosA;
  }

  return ordenarNome(a, b);

}


/* =========================================================
   IDENTIFICAR MÊS DOS REGISTROS
========================================================= */

function obterMesPredominante(registros) {

  if (!Array.isArray(registros) || !registros.length) {

    return formatarReferenciaFiltro(
      referenciaSelecionada
    );

  }

  const contagem = new Map();

  registros.forEach(pessoa => {

    const mes =
      normalizarReferenciaMes(pessoa.mes);

    if (!mes) {
      return;
    }

    contagem.set(
      mes,
      (contagem.get(mes) || 0) + 1
    );

  });

  if (!contagem.size) {

    return formatarReferenciaFiltro(
      referenciaSelecionada
    );

  }

  const ordenados = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1]);

  return formatarReferenciaFiltro(
    ordenados[0][0]
  );

}


/* =========================================================
   AJUSTAR SETOR PARA EXIBIÇÃO
========================================================= */

function ajustarSetorNaArte(nome, setor) {

  const setorLimpo =
    String(setor || "").trim();

  return setorLimpo || "SEM SETOR";

}


/* =========================================================
   PRÓXIMA ETAPA:
   RENDERIZAÇÃO DAS ARTES E LISTAS
========================================================= */

/* =========================================================
   ATUALIZAR TEXTO DE UM ELEMENTO
========================================================= */

function definirTextoElemento(id, valor) {

  const elemento = $(id);

  if (elemento) {
    elemento.textContent = valor;
  }

}


/* =========================================================
   PREENCHER ARTE GERAL
========================================================= */

function preencherArteGeral(dados) {

  const geral = dados?.geral || {};

  const hc = Number(geral.hc) || 0;
  const realizaram = Number(geral.realizaram) || 0;
  const processo = Number(geral.processo) || 0;
  const naoRealizaram = Number(geral.naoRealizaram) || 0;

  const percentual = hc > 0
    ? realizaram / hc
    : 0;

  definirTextoElemento(
    "percentual-geral",
    formatarPorcentagem(percentual)
  );

  definirTextoElemento(
    "arte-geral-hc",
    hc
  );

  definirTextoElemento(
    "arte-geral-realizaram",
    realizaram
  );

  definirTextoElemento(
    "arte-percentual-realizaram",
    formatarPorcentagem(
      hc > 0 ? realizaram / hc : 0
    )
  );

  definirTextoElemento(
    "arte-geral-processo",
    processo
  );

  definirTextoElemento(
    "arte-percentual-processo",
    formatarPorcentagem(
      hc > 0 ? processo / hc : 0
    )
  );

  definirTextoElemento(
    "arte-geral-nao",
    naoRealizaram
  );

  definirTextoElemento(
    "arte-percentual-nao",
    formatarPorcentagem(
      hc > 0 ? naoRealizaram / hc : 0
    )
  );


  /* =====================================================
     INDICADORES DE GEMBA
  ===================================================== */

  const gembaPendente =
    dados?.guembaPendenteBeARep?.length || 0;

  const gembaProcessando =
    dados?.guembaProcessandoBeARep?.length || 0;

  definirTextoElemento(
    "arte-geral-gemba-pendente",
    gembaPendente
  );

  definirTextoElemento(
    "arte-geral-gemba-processo",
    gembaProcessando
  );

  definirTextoElemento(
    "resumo-gemba-pendente",
    gembaPendente
  );

  definirTextoElemento(
    "resumo-gemba-processo",
    gembaProcessando
  );


  /* =====================================================
     DETALHAMENTO POR ÁREA
  ===================================================== */

  const listaAreas = $("lista-areas");

  if (!listaAreas) {
    return;
  }

  listaAreas.innerHTML = "";

  AREAS_VALIDAS.forEach(nomeArea => {

    const area = dados?.areas?.[nomeArea];

    if (!area) {
      return;
    }

    const linha = document.createElement("div");

    linha.className = "area-row";

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

    listaAreas.appendChild(linha);

  });

}


/* =========================================================
   PREENCHER ARTE — REALIZARAM O BE A REP
========================================================= */

function preencherArteRealizaram(dados) {

  const pessoas =
    Array.isArray(dados?.realizaramDetalhe)
      ? dados.realizaramDetalhe
      : [];

  definirTextoElemento(
    "total-realizaram-lista",
    pessoas.length
  );

  const lista = $("lista-realizaram-detalhe");

  if (!lista) {
    return;
  }

  lista.innerHTML = "";

  if (!pessoas.length) {

    lista.innerHTML = `
      <div class="empty-list">
        Nenhuma pessoa concluiu o Be a Rep neste mês.
      </div>
    `;

    return;

  }

  pessoas.forEach(pessoa => {

    const item = document.createElement("div");

    item.className = "realizado-item";

    const unidades = Number(pessoa?.unidades);
    const produtividade = Number(pessoa?.produtividade);

    item.innerHTML = `

      <div class="realizado-col realizado-col-nome">

        <strong>
          ${escaparHTML(pessoa.nome || "SEM NOME")}
        </strong>

        <span class="realizado-subinfo">
          ${escaparHTML(pessoa.area || "SEM ÁREA")}
          •
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
            Number.isFinite(unidades)
              ? unidades.toLocaleString("pt-BR", {
                  maximumFractionDigits: 0
                })
              : "—"
          }
        </strong>
      </div>

      <div class="realizado-col realizado-col-produtividade">
        <strong>
          ${
            Number.isFinite(produtividade)
              ? produtividade.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })
              : "—"
          }
        </strong>
      </div>

    `;

    lista.appendChild(item);

  });

}


/* =========================================================
   PRÓXIMA ETAPA:
   LISTAS DE PENDÊNCIAS E EXCEÇÕES
========================================================= */

/* =========================================================
   PREENCHER LISTAS COM EXCEÇÕES
========================================================= */

function preencherListasComExcecoes() {

  if (!dadosProcessados) {
    return;
  }

  const dados = dadosProcessados;

  preencherListaPendencias(
    "lista-nao-realizaram",
    dados.naoRealizaram || [],
    "Nenhuma pessoa pendente."
  );

  preencherListaPendencias(
    "lista-processo",
    dados.processo || [],
    "Nenhuma pessoa em processo.",
    true
  );

  preencherListaPendencias(
    "lista-gemba-pendente",
    dados.guembaPendenteBeARep || [],
    "Nenhuma pessoa com Gemba pendente de Be a Rep."
  );

  preencherListaPendencias(
    "lista-gemba-processo",
    dados.guembaProcessandoBeARep || [],
    "Nenhuma pessoa com Gemba e Be a Rep em processo.",
    true
  );

  /* =====================================================
     CONTADORES
  ===================================================== */

  definirTextoElemento(
    "total-nao-realizaram",
    dados.naoRealizaram?.length || 0
  );

  definirTextoElemento(
    "total-processo",
    dados.processo?.length || 0
  );

  definirTextoElemento(
    "total-gemba-pendente",
    dados.guembaPendenteBeARep?.length || 0
  );

  definirTextoElemento(
    "total-gemba-processo",
    dados.guembaProcessandoBeARep?.length || 0
  );

}


/* =========================================================
   IDENTIFICAR EXCEÇÃO DE UMA PESSOA
========================================================= */

function pessoaPossuiExcecao(pessoa) {

  const username =
    normalizarTexto(pessoa?.username);

  const nome =
    normalizarTexto(pessoa?.nome);

  if (!username && !nome) {
    return false;
  }

  const registrosExcecoes =
    Array.isArray(excecoes)
      ? excecoes
      : [];

  return registrosExcecoes.some(excecao => {

    const usuarioExcecao = normalizarTexto(
      excecao?.username ||
      excecao?.usuario ||
      excecao?.login
    );

    const nomeExcecao =
      normalizarTexto(excecao?.nome);

    return (
      (username &&
        usuarioExcecao &&
        username === usuarioExcecao) ||
      (nome &&
        nomeExcecao &&
        nome === nomeExcecao)
    );

  });

}


/* =========================================================
   RENDERIZAR LISTA DE PENDÊNCIAS
========================================================= */

function preencherListaPendencias(
  idElemento,
  pessoas,
  mensagemVazia,
  mostrarTempo = false
) {

  const elemento = $(idElemento);

  if (!elemento) {
    return;
  }

  elemento.innerHTML = "";

  const lista =
    Array.isArray(pessoas)
      ? pessoas
      : [];

  if (!lista.length) {

    const vazio =
      document.createElement("div");

    vazio.className = "empty-list";
    vazio.textContent = mensagemVazia;

    elemento.appendChild(vazio);

    return;

  }

  lista.forEach(pessoa => {

    const item =
      document.createElement("div");

    const possuiExcecao =
      pessoaPossuiExcecao(pessoa);

    item.className =
      "pendencia-item" +
      (possuiExcecao ? " pendencia-excecao" : "");

    const nome =
      escaparHTML(
        pessoa.nome || "SEM NOME"
      );

    const username =
      escaparHTML(
        pessoa.username || ""
      );

    const area =
      escaparHTML(
        pessoa.area || "SEM ÁREA"
      );

    const setor =
      escaparHTML(
        pessoa.setor || "SEM SETOR"
      );

    const minutos =
      Number(pessoa.minutos) || 0;

    const tempo =
      escaparHTML(
        pessoa.tempo || formatarMinutos(minutos)
      );

    item.innerHTML = `

      <div class="pendencia-info">

        <strong class="pendencia-nome">
          ${nome}
        </strong>

        <span class="pendencia-detalhe">
          ${username ? `@${username} • ` : ""}
          ${area} • ${setor}
        </span>

      </div>

      ${
        mostrarTempo
          ? `
            <div class="pendencia-tempo">
              ${tempo}
            </div>
          `
          : ""
      }

      ${
        possuiExcecao
          ? `
            <span class="pendencia-tag-excecao">
              Exceção
            </span>
          `
          : ""
      }

    `;

    elemento.appendChild(item);

  });

}


/* =========================================================
   ATUALIZAR LISTAS APÓS ALTERAÇÃO DE EXCEÇÃO
========================================================= */

function atualizarListasAposExcecao() {

  if (!dadosProcessados) {
    return;
  }

  preencherListasComExcecoes();

  renderizarExcecoes();

}


/* =========================================================
   PRÓXIMA ETAPA:
   CADASTRO E GERENCIAMENTO DE EXCEÇÕES
========================================================= */

/* =========================================================
   CARREGAR EXCEÇÕES SALVAS
========================================================= */

function carregarExcecoes() {

  try {

    const conteudo =
      localStorage.getItem(STORAGE_EXCECOES);

    if (!conteudo) {
      return [];
    }

    const lista = JSON.parse(conteudo);

    return Array.isArray(lista) ? lista : [];

  } catch (erro) {

    console.warn(
      "Não foi possível carregar as exceções:",
      erro
    );

    return [];

  }

}


/* =========================================================
   SALVAR EXCEÇÕES NO NAVEGADOR
========================================================= */

function salvarExcecoes() {

  try {

    localStorage.setItem(
      STORAGE_EXCECOES,
      JSON.stringify(excecoes)
    );

  } catch (erro) {

    console.warn(
      "Não foi possível salvar as exceções:",
      erro
    );

  }

}


/* =========================================================
   PREENCHER SUGESTÕES PARA EXCEÇÕES
========================================================= */

function preencherDatalistExcecoes() {

  const datalist = obterElementoPorIds(
    "lista-pessoas-excecao",
    "datalist-excecoes"
  );

  if (!datalist) {
    return;
  }

  datalist.innerHTML = "";

  const registros =
    Array.isArray(dadosProcessados?.registros)
      ? dadosProcessados.registros
      : [];

  [...registros]
    .sort(ordenarNome)
    .forEach(pessoa => {

      const nome =
        String(pessoa.nome || "").trim();

      if (!nome) {
        return;
      }

      const option =
        document.createElement("option");

      option.value = nome;

      datalist.appendChild(option);

    });

}


/* =========================================================
   ADICIONAR EXCEÇÃO
========================================================= */

function adicionarExcecao() {

  const input = obterElementoPorIds(
    "nome-excecao",
    "input-excecao",
    "pessoa-excecao"
  );

  if (!input) {
    return;
  }

  const nome = limparTexto(input.value);

  if (!nome) {
    return;
  }

  const nomeNormalizado =
    normalizarTexto(nome);

  const jaExiste = excecoes.some(excecao =>
    normalizarTexto(excecao?.nome) ===
    nomeNormalizado
  );

  if (jaExiste) {

    input.value = "";
    return;

  }

  /* =====================================================
     ASSOCIAR USERNAME QUANDO DISPONÍVEL
  ===================================================== */

  const registros =
    Array.isArray(dadosProcessados?.registros)
      ? dadosProcessados.registros
      : [];

  const pessoaEncontrada = registros.find(pessoa =>

    normalizarTexto(pessoa.nome) ===
      nomeNormalizado ||

    normalizarTexto(pessoa.username) ===
      nomeNormalizado

  );

  excecoes.push({

    nome: pessoaEncontrada?.nome || nome,

    username:
      pessoaEncontrada?.username || ""

  });

  salvarExcecoes();

  atualizarListasAposExcecao();

  input.value = "";

}


/* =========================================================
   REMOVER EXCEÇÃO
========================================================= */

function removerExcecao(nome) {

  const nomeNormalizado =
    normalizarTexto(nome);

  excecoes = excecoes.filter(excecao =>

    normalizarTexto(excecao?.nome) !==
    nomeNormalizado

  );

  salvarExcecoes();

  atualizarListasAposExcecao();

}


/* =========================================================
   RENDERIZAR EXCEÇÕES CADASTRADAS
========================================================= */

function renderizarExcecoes() {

  const lista = obterElementoPorIds(
    "lista-excecoes",
    "excecoes-lista"
  );

  if (!lista) {
    return;
  }

  lista.innerHTML = "";

  if (
    !Array.isArray(excecoes) ||
    excecoes.length === 0
  ) {

    const vazio =
      document.createElement("div");

    vazio.className = "empty-list";

    vazio.textContent =
      "Nenhuma exceção cadastrada.";

    lista.appendChild(vazio);

    return;

  }

  [...excecoes]
    .sort((a, b) =>

      String(a?.nome || "").localeCompare(
        String(b?.nome || ""),
        "pt-BR"
      )

    )
    .forEach(excecao => {

      const item =
        document.createElement("div");

      item.className = "excecao-item";

      const informacoes =
        document.createElement("div");

      informacoes.className =
        "excecao-info";

      const nome =
        document.createElement("span");

      nome.textContent =
        excecao.nome || "SEM NOME";

      informacoes.appendChild(nome);

      if (excecao.username) {

        const username =
          document.createElement("small");

        username.textContent =
          `@${excecao.username}`;

        informacoes.appendChild(username);

      }

      const botao =
        document.createElement("button");

      botao.type = "button";

      botao.className =
        "excecao-remover";

      botao.textContent = "×";

      botao.setAttribute(
        "aria-label",
        `Remover exceção de ${excecao.nome}`
      );

      botao.addEventListener("click", () => {

        removerExcecao(excecao.nome);

      });

      item.appendChild(informacoes);
      item.appendChild(botao);

      lista.appendChild(item);

    });

}


/* =========================================================
   HORÁRIO DA ÚLTIMA ATUALIZAÇÃO
========================================================= */

function obterHorarioAtualFormatado() {

  return new Date().toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function atualizarTextoUltimaAtualizacao() {

  if (!textoAtualizacao) {
    return;
  }

  textoAtualizacao.textContent =
    `Última atualização: ${obterHorarioAtualFormatado()}.`;

}


/* =========================================================
   PRÓXIMA ETAPA:
   NAVEGAÇÃO DAS ARTES E EXPORTAÇÃO PNG
========================================================= */

/* =========================================================
   EXIBIR E OCULTAR DASHBOARD
========================================================= */

function exibirDashboard() {

  resumoDados?.classList.remove("oculto");
  menuArtes?.classList.remove("oculto");
  areaArtes?.classList.remove("oculto");

}


function ocultarDashboard() {

  resumoDados?.classList.add("oculto");
  menuArtes?.classList.add("oculto");
  areaArtes?.classList.add("oculto");

}


/* =========================================================
   NAVEGAÇÃO ENTRE AS ARTES
========================================================= */

function mostrarArte(nomeArte) {

  const arteSelecionada =
    document.getElementById(
      `arte-${nomeArte}`
    );

  if (!arteSelecionada) {

    console.warn(
      `Arte não encontrada: ${nomeArte}`
    );

    return;

  }

  arteAtual = nomeArte;

  document.querySelectorAll(".arte").forEach(
    arte => {

      arte.classList.toggle(
        "ativa",
        arte === arteSelecionada
      );

    }
  );

  botoesArte.forEach(botao => {

    botao.classList.toggle(
      "ativo",
      botao.dataset.arte === nomeArte
    );

  });

}


/* =========================================================
   CONFIGURAÇÃO DA PAGINAÇÃO
========================================================= */

function obterConfiguracaoPaginacaoArte(nomeArte) {

  const configuracoes = {

    realizaram: {
      listaId: "lista-realizaram-detalhe",
      limite: 30,
      tipo: "tabela"
    },

    processo: {
      listaId: "listas-processo",
      limite: 30,
      tipo: "cards"
    },

    nao: {
      listaId: "listas-nao",
      limite: 30,
      tipo: "cards"
    },

    "guemba-pendente": {
      listaId: "listas-guemba-pendente",
      limite: 30,
      tipo: "cards"
    },

    "guemba-processando": {
      listaId: "listas-guemba-processando",
      limite: 30,
      tipo: "cards"
    }

  };

  return configuracoes[nomeArte] || null;

}


/* =========================================================
   AGUARDAR RENDERIZAÇÃO DA ARTE
========================================================= */

function aguardarRenderizacaoArte() {

  return new Promise(resolve => {

    requestAnimationFrame(() => {

      requestAnimationFrame(resolve);

    });

  });

}


/* =========================================================
   CAPTURAR ARTE EM ALTA QUALIDADE
========================================================= */

async function capturarArte(arte) {

  await aguardarRenderizacaoArte();

  return html2canvas(arte, {

    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false

  });

}


/* =========================================================
   SALVAR CANVAS COMO PNG
========================================================= */

function baixarCanvasComoPng(canvas, nomeArquivo) {

  const link = document.createElement("a");

  link.download = nomeArquivo;

  link.href = canvas.toDataURL("image/png");

  document.body.appendChild(link);

  link.click();

  link.remove();

}


/* =========================================================
   GERAR NOME DO ARQUIVO
========================================================= */

function obterNomeArquivoArte(
  nomeBase,
  referencia,
  pagina = null
) {

  const limparNome = valor =>
    String(valor || "")
      .replace(/[^a-zA-Z0-9_-]/g, "-");

  const partes = [
    limparNome(nomeBase),
    limparNome(referencia)
  ];

  if (gerenteSelecionado) {

    partes.push(
      `Gerente-${limparNome(gerenteSelecionado)}`
    );

  }

  if (supervisorSelecionado) {

    partes.push(
      `Supervisor-${limparNome(supervisorSelecionado)}`
    );

  }

  if (pagina !== null) {

    partes.push(
      `Pagina-${String(pagina).padStart(2, "0")}`
    );

  }

  return `${partes.join("-")}.png`;

}


/* =========================================================
   EXPORTAR ARTE ATUAL

   ATÉ 30 ITENS:
   - 1 ARQUIVO PNG

   ACIMA DE 30 ITENS:
   - PAGINAÇÃO AUTOMÁTICA
========================================================= */

async function baixarArteAtual() {

  const arte = document.getElementById(
    `arte-${arteAtual}`
  );

  if (!arte) {

    atualizarStatus(
      "Não foi possível localizar a arte selecionada.",
      "erro"
    );

    return;

  }

  if (typeof html2canvas === "undefined") {

    atualizarStatus(
      "A biblioteca de exportação PNG não foi carregada.",
      "erro"
    );

    return;

  }

  const nomeBase =
    arte.dataset.nomeArquivo ||
    `Be-a-Rep-${arteAtual}`;

  const referencia =
    referenciaSelecionada || "mes";

  const configuracao =
    obterConfiguracaoPaginacaoArte(arteAtual);

  const lista = configuracao
    ? document.getElementById(configuracao.listaId)
    : null;

  const itens = lista
    ? Array.from(lista.children).filter(item =>
        !item.classList.contains("empty-list") &&
        !item.classList.contains("empty-state")
      )
    : [];

  const limite = configuracao?.limite || 30;

  const totalPaginas =
    lista && itens.length > limite
      ? Math.ceil(itens.length / limite)
      : 1;

  const estilosOriginais = itens.map(item =>
    item.style.display
  );

  const gridOriginal =
    lista?.style.gridTemplateColumns || "";

  const gapOriginal =
    lista?.style.gap || "";

  const textoOriginalBotao =
    botaoBaixar?.textContent || "";

  try {

    if (botaoBaixar) {

      botaoBaixar.disabled = true;

      botaoBaixar.textContent =
        "Gerando PNG...";

    }

    atualizarStatus(
      "Preparando imagem para exportação...",
      "info"
    );

    if (totalPaginas > 1) {

      arte.classList.add(
        "arte-exportacao-paginada"
      );

      if (
        lista &&
        configuracao.tipo === "cards"
      ) {

        lista.style.gridTemplateColumns =
          "repeat(2, minmax(0, 1fr))";

        lista.style.gap = "12px";

      }

    }

    for (
      let pagina = 0;
      pagina < totalPaginas;
      pagina++
    ) {

      if (totalPaginas > 1) {

        const inicio = pagina * limite;
        const fim = inicio + limite;

        itens.forEach((item, indice) => {

          item.style.display =
            indice >= inicio && indice < fim
              ? estilosOriginais[indice]
              : "none";

        });

      }

      const canvas = await capturarArte(arte);

      const nomeArquivo =
        obterNomeArquivoArte(
          nomeBase,
          referencia,
          totalPaginas > 1
            ? pagina + 1
            : null
        );

      baixarCanvasComoPng(
        canvas,
        nomeArquivo
      );

    }

    atualizarStatus(
      totalPaginas > 1
        ? `Exportação concluída: ${totalPaginas} imagens PNG.`
        : "Arte PNG gerada com sucesso.",
      "sucesso"
    );

  } catch (erro) {

    console.error(
      "Erro ao exportar arte:",
      erro
    );

    atualizarStatus(
      "Não foi possível exportar a imagem.",
      "erro"
    );

  } finally {

    itens.forEach((item, indice) => {

      item.style.display =
        estilosOriginais[indice];

    });

    if (lista) {

      lista.style.gridTemplateColumns =
        gridOriginal;

      lista.style.gap =
        gapOriginal;

    }

    arte.classList.remove(
      "arte-exportacao-paginada"
    );

    if (botaoBaixar) {

      botaoBaixar.disabled = false;

      botaoBaixar.textContent =
        textoOriginalBotao;

    }

  }

}


/* =========================================================
   PRÓXIMA ETAPA:
   FINALIZAÇÃO E VALIDAÇÃO DO SCRIPT
========================================================= */

/* =========================================================
   PREENCHER MÊS NAS ARTES E NO DASHBOARD
========================================================= */

function preencherMes(mes) {

  const referencia =
    formatarReferenciaFiltro(
      mes || referenciaSelecionada
    );

  document
    .querySelectorAll("[data-mes]")
    .forEach(elemento => {

      elemento.textContent =
        referencia || "MÊS";

    });

}


/* =========================================================
   ATUALIZAR MENSAGEM DE STATUS
========================================================= */

function atualizarStatus(
  mensagem,
  tipo = ""
) {

  if (!statusArquivo) {
    return;
  }

  statusArquivo.textContent =
    mensagem || "";

  statusArquivo.classList.remove(
    "sucesso",
    "erro",
    "info"
  );

  if (
    tipo &&
    ["sucesso", "erro", "info"].includes(tipo)
  ) {

    statusArquivo.classList.add(tipo);

  }

}


/* =========================================================
   MONTAR FILTRO DE MÊS

   IDENTIFICA OS MESES DISPONÍVEIS NA API
========================================================= */

function montarFiltroMes(registros) {

  if (!filtroMes) {
    return;
  }

  const lista = Array.isArray(registros)
    ? registros
    : [];

  const referencias = new Set();

  lista.forEach(registro => {

    const mes = normalizarReferenciaMes(
      obterValorObjeto(registro, [
        "MES_BE_A_REP",
        "MES",
        "MÊS",
        "mes"
      ])
    );

    if (mes) {
      referencias.add(mes);
    }

  });

  const meses = [...referencias].sort(
    (a, b) => {

      const [mesA, anoA] = a.split("-");
      const [mesB, anoB] = b.split("-");

      const valorA =
        Number(anoA) * 100 + Number(mesA);

      const valorB =
        Number(anoB) * 100 + Number(mesB);

      return valorB - valorA;

    }
  );

  filtroMes.innerHTML = "";

  meses.forEach(mes => {

    const option =
      document.createElement("option");

    option.value = mes;
    option.textContent = mes;

    filtroMes.appendChild(option);

  });

  if (
    meses.includes(
      normalizarReferenciaMes(referenciaSelecionada)
    )
  ) {

    filtroMes.value =
      normalizarReferenciaMes(referenciaSelecionada);

  } else if (meses.length) {

    referenciaSelecionada = meses[0];

    filtroMes.value = meses[0];

  }

}


/* =========================================================
   ATUALIZAR MÊS DISPONÍVEL
========================================================= */

function selecionarMesDisponivel() {

  if (!filtroMes) {
    return;
  }

  const valores = Array.from(
    filtroMes.options
  ).map(option => option.value);

  const referencia =
    normalizarReferenciaMes(
      referenciaSelecionada
    );

  if (valores.includes(referencia)) {

    filtroMes.value = referencia;
    return;

  }

  if (valores.length) {

    referenciaSelecionada = valores[0];

    filtroMes.value = valores[0];

  }

}


/* =========================================================
   RESUMO DA BASE CARREGADA
========================================================= */

function obterResumoBaseCarregada() {

  const dados = dadosProcessados;

  if (!dados) {
    return null;
  }

  const geral = dados.geral || {};

  return {

    mes:
      dados.mes ||
      referenciaSelecionada,

    hc:
      Number(geral.hc) || 0,

    realizaram:
      Number(geral.realizaram) || 0,

    processo:
      Number(geral.processo) || 0,

    naoRealizaram:
      Number(geral.naoRealizaram) || 0,

    percentual:
      Number(geral.percentual) || 0,

    gerente:
      gerenteSelecionado || "",

    supervisor:
      supervisorSelecionado || ""

  };

}


/* =========================================================
   VERIFICAÇÃO DAS CONFIGURAÇÕES
========================================================= */

function verificarConfiguracoesDashboard() {

  const avisos = [];

  if (!$("filtro-gerente")) {

    avisos.push(
      "Filtro de Gerente não encontrado no HTML."
    );

  }

  if (!$("filtro-supervisor")) {

    avisos.push(
      "Filtro de Supervisor não encontrado no HTML."
    );

  }

  if (!filtroMes) {

    avisos.push(
      "Filtro de mês não encontrado no HTML."
    );

  }

  if (typeof html2canvas === "undefined") {

    avisos.push(
      "Biblioteca html2canvas não disponível."
    );

  }

  if (avisos.length) {

    console.warn(
      "⚠️ Verificações do dashboard:",
      avisos
    );

  } else {

    console.log(
      "✅ Configurações principais encontradas."
    );

  }

  return avisos;

}


/* =========================================================
   FIM DAS FUNÇÕES AUXILIARES
========================================================= */
