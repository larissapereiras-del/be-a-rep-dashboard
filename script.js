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
      `✅ Dados de ${formatarReferenciaFiltro(referenciaSelecionada)} atualizados às ${horario}.`,
      "sucesso"
    );


    if (
      textoAtualizacao
    ) {

      textoAtualizacao.textContent =
        `Dados de ${formatarReferenciaFiltro(referenciaSelecionada)} sincronizados diretamente pelo Verdi.`;

    }

  }

  catch (
    erro
  ) {

    console.error(
      "❌ Erro ao carregar dados:",
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
        textoOriginal;

    }

  }

}


/* =========================================================
   NORMALIZAR REFERÊNCIA DE MÊS
   Compatibilidade Português / Espanhol
========================================================= */

function normalizarReferenciaMes(
  valor
) {

  const texto =
    normalizarTexto(
      valor
    );


  if (
    !texto
  ) {

    return "";

  }


  const partes =
    texto.split(
      "-"
    );


  const mes =
    partes[0] ||
    "";


  const ano =
    partes[1] ||
    "";


  const meses = {

    JANEIRO:
      "JANEIRO",

    ENERO:
      "JANEIRO",

    FEVEREIRO:
      "FEVEREIRO",

    FEBRERO:
      "FEVEREIRO",

    MARCO:
      "MARCO",

    MARZO:
      "MARCO",

    ABRIL:
      "ABRIL",

    MAIO:
      "MAIO",

    MAYO:
      "MAIO",

    JUNHO:
      "JUNHO",

    JUNIO:
      "JUNHO",

    JULHO:
      "JULHO",

    JULIO:
      "JULHO",

    AGOSTO:
      "AGOSTO",

    SETEMBRO:
      "SETEMBRO",

    SEPTIEMBRE:
      "SETEMBRO",

    OUTUBRO:
      "OUTUBRO",

    OCTUBRE:
      "OUTUBRO",

    NOVEMBRO:
      "NOVEMBRO",

    NOVIEMBRE:
      "NOVEMBRO",

    DEZEMBRO:
      "DEZEMBRO",

    DICIEMBRE:
      "DEZEMBRO"

  };


  const mesNormalizado =
    meses[mes] ||
    mes;


  return ano
    ? `${mesNormalizado}-${ano}`
    : mesNormalizado;

}


/* =========================================================
   REFERÊNCIA DO MÊS ATUAL
========================================================= */

function obterReferenciaMesAtual() {

  const agora =
    new Date();


  const mes =
    agora.toLocaleString(
      "pt-BR",
      {

        month:
          "long"

      }
    );


  const ano =
    agora.getFullYear();


  return normalizarTexto(
         `${mes}-${ano}`
  );

}


/* =========================================================
   FORMATAR REFERÊNCIA PARA EXIBIÇÃO
========================================================= */

function formatarReferenciaFiltro(
  referencia
) {

  const texto =
    normalizarTexto(
      referencia
    );


  if (
    !texto
  ) {

    return "MÊS";

  }


  const partes =
    texto.split(
      "-"
    );


  const mes =
    partes[0] ||
    "";


  const ano =
    partes[1] ||
    "";


  const nomes = {

    JANEIRO:
      "Janeiro",

    FEVEREIRO:
      "Fevereiro",

    MARCO:
      "Março",

    ABRIL:
      "Abril",

    MAIO:
      "Maio",

    JUNHO:
      "Junho",

    JULHO:
      "Julho",

    AGOSTO:
      "Agosto",

    SETEMBRO:
      "Setembro",

    OUTUBRO:
      "Outubro",

    NOVEMBRO:
      "Novembro",

    DEZEMBRO:
      "Dezembro"

  };


  const nomeMes =
    nomes[
      mes
    ] ||
    mes;


  return ano
    ? `${nomeMes} / ${ano}`
    : nomeMes;

}


/* =========================================================
   OBTER ORDEM DA REFERÊNCIA
========================================================= */

function obterOrdemReferenciaMes(
  referencia
) {

  const texto =
    normalizarTexto(
      referencia
    );


  const [
    mes,
    ano
  ] =
    texto.split(
      "-"
    );


  const ordemMeses = {

    JANEIRO:
      1,

    FEVEREIRO:
      2,

    MARCO:
      3,

    ABRIL:
      4,

    MAIO:
      5,

    JUNHO:
      6,

    JULHO:
      7,

    AGOSTO:
      8,

    SETEMBRO:
      9,

    OUTUBRO:
      10,

    NOVEMBRO:
      11,

    DEZEMBRO:
      12

  };


  const numeroMes =
    ordemMeses[
      mes
    ] ||
    0;


  const numeroAno =
    Number(
      ano
    ) ||
    0;


  return (
    numeroAno *
      100 +
    numeroMes
  );

}


/* =========================================================
   MONTAR FILTRO DE MÊS
========================================================= */

function montarFiltroMes(
  registros
) {

  if (
    !filtroMes
  ) {

    return;

  }


  const referencias =
    new Set();


  /*
   * Busca os meses que realmente existem
   * na resposta da Query.
   */

  (
    registros ||
    []
  ).forEach(
    item => {

      const mes =
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


      if (
        mes
      ) {

        referencias.add(
          normalizarReferenciaMes(
            mes
          )
        );

      }

    }
  );


  /*
   * Também adicionamos o mês atual.
   *
   * Assim, por exemplo, Setembro aparece
   * mesmo se a Query ainda estiver apenas
   * com dados de Agosto.
   */

  referencias.add(
    normalizarReferenciaMes(
      obterReferenciaMesAtual()
    )
  );


  const lista =
    Array.from(
      referencias
    );


  /*
   * Ordena do mês mais recente
   * para o mais antigo.
   */

  lista.sort(
    (
      a,
      b
    ) =>
      obterOrdemReferenciaMes(
        b
      ) -
      obterOrdemReferenciaMes(
        a
      )
  );


  filtroMes.innerHTML =
    "";


  lista.forEach(
    referencia => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        referencia;


      option.textContent =
        formatarReferenciaFiltro(
          referencia
        );


      filtroMes.appendChild(
        option
      );

    }
  );


  /*
   * Seleção inicial:
   * mês atual.
   */

  referenciaSelecionada =
    normalizarReferenciaMes(
      obterReferenciaMesAtual()
    );


  filtroMes.value =
    referenciaSelecionada;


  console.log(
    "📅 Meses disponíveis:",
    lista
  );

}


/* =========================================================
   PROCESSAR DADOS DA API
========================================================= */

function processarDadosApi(
  dadosApi,
  referenciaFiltro =
    referenciaSelecionada
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
     REFERÊNCIA SELECIONADA
  ======================================================= */

  const referenciaAtual =
    normalizarReferenciaMes(
      referenciaFiltro ||
      obterReferenciaMesAtual()
    );


  console.log(
    "📅 Referência selecionada:",
    referenciaAtual
  );


  /* =======================================================
     FILTRO

     SOMENTE:
     - MÊS SELECIONADO
     - OBRIGATÓRIO

     NÃO FILTRAMOS ÁREA AQUI.

     Isso é importante porque:
     - Head Site continua no HC Geral;
     - pessoas sem cadastro continuam aparecendo
       no alerta de cadastro.
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
          normalizarReferenciaMes(
            mesRegistro
          ) ===
            normalizarReferenciaMes(
              referenciaAtual
            ) &&
          obrigatoriedade ===
            "OBLIGATORIO"
        );

      }
    );


  console.log(
    "🔎 Registros após mês selecionado + obrigatório:",
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
             TEMPO DO BE A REP
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


          /*
           * Transformamos o tempo em minutos
           * uma única vez.
           *
           * Essa informação será usada depois
           * para aplicar as regras:
           *
           * OPEX = 10 minutos
           * demais áreas = 60 minutos
           */

          const minutos =
            converterTempoParaMinutos(
              tempo
            );


          /* ===============================================
             LOCAL DO BE A REP

             QUERY:
             PROCESOS_LMS
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

             IMPORTANTE:
             Gemba é independente do Be a Rep.
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
             STATUS DO BE A REP
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
             POSSUI CADASTRO DE ÁREA?
          =============================================== */

          const temCadastroArea =
            (
              AREAS_VALIDAS.includes(
                area
              ) ||
              area ===
                "Head Site"
            );


          /* ===============================================
             SITUAÇÃO PARA O RESUMO GERAL

             Aqui consideramos a visão consolidada
             de Gemba + Be a Rep.

             As abas específicas serão separadas
             depois, dentro de processarRegistros().
          =============================================== */

          const situacao =
            classificarSituacao(
              gemba,
              statusBar,
              minutos,
              area
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
              minutos,

            local:
              local,

            unidades:
              unidades,

            produtividade:
              produtividade,

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
              temCadastroArea,

            situacao:
              situacao

          };

        }
      )
      .filter(
        Boolean
      );


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

        gemba:
          pessoa.gemba,

        statusBar:
          pessoa.statusBar,

        local:
          pessoa.local,

        tempo:
          pessoa.tempo,

        minutos:
          pessoa.minutos,

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

         Somente quem realmente cumpriu
         o tempo mínimo do Be a Rep.
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

         Iniciou o Be a Rep,
         mas ainda não cumpriu o tempo mínimo.
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

         Aqui entram SOMENTE pessoas que:
         - não fizeram Gemba
         - não iniciaram Be a Rep
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

         Fez Gemba,
         mas ainda não iniciou Be a Rep.
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

         Fez Gemba
         +
         iniciou Be a Rep
         +
         ainda não concluiu o tempo mínimo.
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

     Todos os obrigatórios do mês entram aqui,
     inclusive:
     - Head Site
     - pessoas sem cadastro de área

     O Resumo Geral contempla o avanço completo
     de Gemba + Be a Rep.
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


  renderizarExcecoes();


  exibirDashboard();


  mostrarArte(
    "geral"
  );

}
/* =========================================================
   NOVA ABA — REALIZARAM
========================================================= */

function preencherArteRealizaram(
  dados
) {

  const total =
    $("total-realizaram-lista");


  const container =
    $("lista-realizaram-detalhe");


  const lista =
    Array.isArray(
      dados?.realizaramDetalhe
    )
      ? dados.realizaramDetalhe
      : [];


  /* =======================================================
     TOTAL
  ======================================================= */

  if (
    total
  ) {

    total.textContent =
      lista.length;

  }


  if (
    !container
  ) {

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

        Nenhuma pessoa realizou o Be a Rep em
        ${escaparHTML(
          formatarReferenciaFiltro(
            referenciaSelecionada
          )
        )}.

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


  if (
    resumoHc
  ) {

    resumoHc.textContent =
      geral.hc;

  }


  if (
    resumoRealizaram
  ) {

    resumoRealizaram.textContent =
      geral.realizaram;

  }


  if (
    resumoProcesso
  ) {

    resumoProcesso.textContent =
      geral.processo;

  }


  if (
    resumoNao
  ) {

    resumoNao.textContent =
      geral.naoRealizaram;

  }


  /* =======================================================
     PERCENTUAIS DOS CARDS
  ======================================================= */

  const percentualRealizaram =
    $("percentual-resumo-realizaram");


  if (
    percentualRealizaram
  ) {

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


  if (
    percentualProcesso
  ) {

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


  if (
    percentualNao
  ) {

    percentualNao.textContent =
      formatarPorcentagem(
        geral.hc > 0
          ? geral.naoRealizaram /
            geral.hc
          : 0
      );

  }


  /* =======================================================
     INDICADORES SECUNDÁRIOS DE GEMBA

     Estes dois números serão mostrados no Resumo Geral
     quando adicionarmos os elementos no index.html.

     1) Gemba feito / Be a Rep não iniciado
     2) Gemba + Be a Rep em processo
  ======================================================= */

  const resumoGembaPendente =
    $("resumo-gemba-pendente");


  const resumoGembaProcesso =
    $("resumo-gemba-processo");


  if (
    resumoGembaPendente
  ) {

    resumoGembaPendente.textContent =
      Array.isArray(
        dados.guembaPendenteBeARep
      )
        ? dados.guembaPendenteBeARep.length
        : 0;

  }


  if (
    resumoGembaProcesso
  ) {

    resumoGembaProcesso.textContent =
      Array.isArray(
        dados.guembaProcessandoBeARep
      )
        ? dados.guembaProcessandoBeARep.length
        : 0;

  }


  const situacaoAtual =
    $("situacao-atual");


  if (
    situacaoAtual
  ) {

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
  } =
    dados.geral;


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


  if (
    percentualMeta
  ) {

    percentualMeta.textContent =
      formatarPorcentagem(
        percentual
      );

  }


  const textoProgresso =
    $("texto-progresso-meta");


  if (
    textoProgresso
  ) {

    textoProgresso.textContent =
      `${formatarPorcentagem(percentual)} de 90%`;

  }


  const barra =
    $("barra-meta-preenchida");


  if (
    barra
  ) {

    barra.style.width =
      `${Math.min(
        100,
        percentual *
        100
      )}%`;

  }


  const situacaoFaltam =
    $("situacao-faltam");


  if (
    situacaoFaltam
  ) {

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

    if (
      statusMeta
    ) {

      statusMeta.textContent =
        "🏆 META BATIDA";

    }


    if (
      mensagemMeta
    ) {

      mensagemMeta.textContent =
        `Meta atingida com ${realizaram} pessoas realizando.`;

    }


    if (
      tituloSituacao
    ) {

      tituloSituacao.textContent =
        "Meta do mês atingida";

    }


    if (
      descricaoSituacao
    ) {

      descricaoSituacao.textContent =
        "O resultado já alcançou ou superou o target de 90%.";

    }

  }

  else {

    if (
      statusMeta
    ) {

      statusMeta.textContent =
        "Target: 90%";

    }


    if (
      mensagemMeta
    ) {

      mensagemMeta.textContent =
        `Faltam ${faltam} pessoa${faltam === 1 ? "" : "s"} para atingir o target.`;

    }


    if (
      tituloSituacao
    ) {

      tituloSituacao.textContent =
        "Meta em andamento";

    }


    if (
      descricaoSituacao
    ) {

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


  /* =======================================================
     INDICADORES PEQUENOS DE GEMBA

     Esses dois números serão exibidos na Arte Geral
     depois que ajustarmos o index.html.

     1) Gemba feito + Be a Rep não iniciado
     2) Gemba feito + Be a Rep em processo
  ======================================================= */

  const arteGembaPendente =
    $("arte-geral-gemba-pendente");


  const arteGembaProcesso =
    $("arte-geral-gemba-processo");


  if (
    arteGembaPendente
  ) {

    arteGembaPendente.textContent =
      Array.isArray(
        dados.guembaPendenteBeARep
      )
        ? dados.guembaPendenteBeARep.length
        : 0;

  }


  if (
    arteGembaProcesso
  ) {

    arteGembaProcesso.textContent =
      Array.isArray(
        dados.guembaProcessandoBeARep
      )
        ? dados.guembaProcessandoBeARep.length
        : 0;

  }


  /* =======================================================
     PERCENTUAL — REALIZARAM
  ======================================================= */

  const pctRealizaram =
    $("arte-percentual-realizaram");


  if (
    pctRealizaram
  ) {

    pctRealizaram.textContent =
      formatarPorcentagem(
        hc
          ? realizaram /
            hc
          : 0
      );

  }


  /* =======================================================
     PERCENTUAL — EM PROCESSO
  ======================================================= */

  const pctProcesso =
    $("arte-percentual-processo");


  if (
    pctProcesso
  ) {

    pctProcesso.textContent =
      formatarPorcentagem(
        hc
          ? processo /
            hc
          : 0
      );

  }


  /* =======================================================
     PERCENTUAL — NÃO REALIZARAM
  ======================================================= */

  const pctNao =
    $("arte-percentual-nao");


  if (
    pctNao
  ) {

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


  if (
    !container
  ) {

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

     Importante:
     Head Site NÃO entra aqui porque é considerado
     um cadastro válido.

     Ele só não entra nas cinco áreas operacionais.
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
  lista,
  containerId
) {

  const container =
    $(containerId);


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";


  if (
    !Array.isArray(lista) ||
    lista.length ===
    0
  ) {

    container.innerHTML = `

      <div
        style="
          padding:28px 18px;
          text-align:center;
          color:#667085;
          font-size:14px;
          font-weight:600;
        "
      >

        Nenhuma pessoa nesta situação.

      </div>

    `;


    return;

  }


  const quantidade =
    quantidadeColunas(
      lista.length
    );


  const grupos =
    dividirLista(
      lista,
      quantidade
    );


  container.style.display =
    "grid";


  container.style.gridTemplateColumns =
    `repeat(${grupos.length}, minmax(0, 1fr))`;


  container.style.gap =
    "14px";


  grupos.forEach(
    grupo => {

      const coluna =
        document.createElement(
          "div"
        );


      coluna.style.cssText = `

        display:flex;

        flex-direction:column;

        gap:8px;

      `;


      grupo.forEach(
        pessoa => {

          const item =
            document.createElement(
              "div"
            );


          item.style.cssText = `

            background:#ffffff;

            border:1px solid #e7e9ee;

            border-radius:12px;

            padding:11px 12px;

            box-sizing:border-box;

            box-shadow:0 4px 12px rgba(0,0,0,.035);

          `;


          const tempoExibicao =
            pessoa.tempo ||
            formatarMinutos(
              pessoa.minutos
            );


          item.innerHTML = `

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:12px;
                align-items:flex-start;
              "
            >

              <div
                style="
                  min-width:0;
                  flex:1;
                "
              >

                <div
                  style="
                    color:#071b61;
                    font-size:13px;
                    font-weight:900;
                    line-height:1.25;
                  "
                >

                  ${escaparHTML(
                    pessoa.nome ||
                    "-"
                  )}

                </div>


                <div
                  style="
                    color:#667085;
                    font-size:11px;
                    margin-top:4px;
                    line-height:1.3;
                  "
                >

                  ${escaparHTML(
                    pessoa.area ||
                    "SEM ÁREA"
                  )}

                  •

                  ${escaparHTML(
                    pessoa.setor ||
                    "SEM SETOR"
                  )}

                </div>

              </div>


              <div
                style="
                  flex:0 0 auto;
                  background:#eef4ff;
                  color:#1849a9;
                  border-radius:999px;
                  padding:5px 8px;
                  font-size:11px;
                  font-weight:900;
                  white-space:nowrap;
                "
              >

                ${escaparHTML(
                  tempoExibicao ||
                  "-"
                )}

              </div>

            </div>

          `;


          coluna.appendChild(
            item
          );

        }
      );


      container.appendChild(
        coluna
      );

    }
  );

}


/* =========================================================
   MONTAR LISTA SEM TEMPO
========================================================= */

function montarListaSemTempo(
  lista,
  containerId
) {

  const container =
    $(containerId);


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";


  if (
    !Array.isArray(lista) ||
    lista.length ===
    0
  ) {

    container.innerHTML = `

      <div
        style="
          padding:28px 18px;
          text-align:center;
          color:#667085;
          font-size:14px;
          font-weight:600;
        "
      >

        Nenhuma pessoa nesta situação.

      </div>

    `;


    return;

  }


  const quantidade =
    quantidadeColunas(
      lista.length
    );


  const grupos =
    dividirLista(
      lista,
      quantidade
    );


  container.style.display =
    "grid";


  container.style.gridTemplateColumns =
    `repeat(${grupos.length}, minmax(0, 1fr))`;


  container.style.gap =
    "14px";


  grupos.forEach(
    grupo => {

      const coluna =
        document.createElement(
          "div"
        );


      coluna.style.cssText = `

        display:flex;

        flex-direction:column;

        gap:8px;

      `;


      grupo.forEach(
        pessoa => {

          const item =
            document.createElement(
              "div"
            );


          item.style.cssText = `

            background:#ffffff;

            border:1px solid #e7e9ee;

            border-radius:12px;

            padding:11px 12px;

            box-sizing:border-box;

            box-shadow:0 4px 12px rgba(0,0,0,.035);

          `;


          item.innerHTML = `

            <div
              style="
                color:#071b61;
                font-size:13px;
                font-weight:900;
                line-height:1.25;
              "
            >

              ${escaparHTML(
                pessoa.nome ||
                "-"
              )}

            </div>


            <div
              style="
                color:#667085;
                font-size:11px;
                margin-top:4px;
                line-height:1.3;
              "
            >

              ${escaparHTML(
                pessoa.area ||
                "SEM ÁREA"
              )}

              •

              ${escaparHTML(
                pessoa.setor ||
                "SEM SETOR"
              )}

            </div>

          `;


          coluna.appendChild(
            item
          );

        }
      );


      container.appendChild(
        coluna
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
      total /
      60
    );


  const resto =
    Math.round(
      total %
      60
    );


  if (
    resto ===
    0
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

    return tempoB -
      tempoA;

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
   CALCULAR GERAL POR REGISTROS

   IMPORTANTE:
   O Resumo Geral contempla Gemba + Be a Rep.

   Isso significa:

   REALIZOU
   = concluiu o Be a Rep

   EM_PROCESSO
   = iniciou Be a Rep e ainda não concluiu
     OU realizou Gemba e está avançando no fluxo

   NAO_REALIZOU
   = ainda não concluiu nenhuma das etapas
     suficientes para entrar nos grupos acima
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

   Aqui está a regra principal do dashboard.

   BE A REP:
   - OPEX = 10 minutos
   - demais áreas = 60 minutos

   GEMBA:
   - não transforma alguém em "Realizou o Be a Rep"
   - serve para acompanhar o avanço do fluxo
========================================================= */

function classificarSituacao(
  valorGemba,
  valorBar,
  minutos,
  area
) {

  const pessoaTemBeARepConcluido =
    beRepConcluido({

      statusBar:
        valorBar,

      minutos:
        minutos,

      area:
        area

    });


  if (
    pessoaTemBeARepConcluido
  ) {

    return "REALIZOU";

  }


  const pessoaTemBeARepEmProcesso =
    beRepEmProcesso({

      statusBar:
        valorBar,

      minutos:
        minutos,

      area:
        area

    });


  if (
    pessoaTemBeARepEmProcesso
  ) {

    return "EM_PROCESSO";

  }


  if (
    gembaConcluido(
      valorGemba
    )
  ) {

    return "EM_PROCESSO";

  }


  return "NAO_REALIZOU";

}
/* =========================================================
   BE A REP — TEMPO MÍNIMO DE CONCLUSÃO
========================================================= */

function obterTempoMinimoBeARep(
  area
) {

  /*
   * REGRA:
   *
   * OPEX:
   * 10 minutos para concluir o Be a Rep.
   *
   * Demais áreas:
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


  return minutos >
    0;

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


  return minutos >=
    tempoMinimo;

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
    minutos >
      0 &&
    minutos <
      tempoMinimo
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

     Head Site é cadastro válido.

     Ele entra:
     - HC Geral
     - Realizaram
     - Em Processo
     - Não Realizaram
     - Gemba

     Mas NÃO entra na divisão das cinco áreas
     operacionais.
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
   * A Query pode retornar o tempo em
   * diferentes formatos.
   *
   * Exemplos:
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
     * Se o valor vier como fração de dia,
     * como ocorre em alguns arquivos Excel,
     * convertemos para minutos.
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
   STATUS / UTILITÁRIOS
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
   BAIXAR ARTE ATUAL
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


  try {

    const canvas =
      await html2canvas(
        arte,
        {
          scale: 2,
          backgroundColor:
            "#ffffff",
          useCORS: true
        }
      );


    const nomeArquivo =
      arte.dataset
        .nomeArquivo ||
      `Be-a-Rep-${arteAtual}`;


    const link =
      document
        .createElement(
          "a"
        );


    link.download =
      `${nomeArquivo}-${referenciaSelecionada || "mes"}.png`;


    link.href =
      canvas
        .toDataURL(
          "image/png"
        );


    link.click();

  } catch (
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
    const chave of
    chaves
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        objeto,
        chave
      )
    ) {

      const valor =
        objeto[chave];


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
          objeto[chave]
        );

      }
    );


  for (
    const chave of
    chaves
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

    return "0%";

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
   PROCESSAR ARQUIVO MANUAL
========================================================= */

async function processarArquivo(
  arquivo
) {

  try {

    atualizarStatus(
      `Lendo ${arquivo.name}...`,
      ""
    );


    if (
      typeof XLSX ===
      "undefined"
    ) {

      throw new Error(
        "A biblioteca XLSX não foi carregada."
      );

    }


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


    const primeiraAba =
      workbook.SheetNames[
        0
      ];


    if (
      !primeiraAba
    ) {

      throw new Error(
        "O arquivo não possui abas válidas."
      );

    }


    const worksheet =
      workbook.Sheets[
        primeiraAba
      ];


    const registros =
      XLSX.utils.sheet_to_json(
        worksheet,
        {

          defval:
            ""

        }
      );


    if (
      !Array.isArray(
        registros
      ) ||
      registros.length ===
        0
    ) {

      throw new Error(
        "Nenhum registro foi encontrado no arquivo."
      );

    }


    console.log(
      "📄 Arquivo manual carregado:",
      registros.length
    );


    dadosApiBrutos =
      registros;


    montarFiltroMes(
      dadosApiBrutos
    );


    referenciaSelecionada =
      obterReferenciaMesAtual();


    if (
      filtroMes
    ) {

      filtroMes.value =
        referenciaSelecionada;

    }


    try {

      dadosProcessados =
        processarDadosApi(
          dadosApiBrutos,
          referenciaSelecionada
        );


      atualizarTudo();


      atualizarStatus(
        `✅ ${arquivo.name} carregado com sucesso.`,
        "sucesso"
      );


      if (
        textoAtualizacao
      ) {

        textoAtualizacao.textContent =
          `Arquivo manual carregado. Exibindo ${formatarReferenciaFiltro(referenciaSelecionada)}.`;

      }

    }

    catch (
      erroMes
    ) {

      console.warn(
        "⚠️ Arquivo carregado, mas sem dados no mês atual:",
        erroMes
      );


      preencherMes(
        formatarReferenciaFiltro(
          referenciaSelecionada
        )
      );


      atualizarStatus(
        `⚠️ O arquivo foi carregado, mas não possui dados obrigatórios para ${formatarReferenciaFiltro(referenciaSelecionada)}. Selecione outro mês.`,
        "erro"
      );


      if (
        textoAtualizacao
      ) {

        textoAtualizacao.textContent =
          "Arquivo carregado. Escolha outro mês no filtro para consultar os dados disponíveis.";

      }


      ocultarDashboard();

    }

  }

  catch (
    erro
  ) {

    console.error(
      "❌ Erro ao processar arquivo:",
      erro
    );


    atualizarStatus(
      `❌ Erro ao processar o arquivo: ${erro.message}`,
      "erro"
    );


    ocultarDashboard();

  }

}
/* =========================================================
   EXCEÇÕES
========================================================= */


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


  if (
    jaExiste
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
        motivo ||
        "Outro"

    }
  );


  salvarExcecoes();


  campoNome.value =
    "";


  campoMotivo.value =
    "";


  renderizarExcecoes();


  preencherListasComExcecoes();


  preencherDatalistExcecoes();

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
   FIM DO SCRIPT
========================================================= */

console.log(
  "✅ Central Be a Rep V2.4 carregada com sucesso."
);
