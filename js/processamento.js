/* =========================================================
   CENTRAL BE A REP
   PROCESSAMENTO DOS DADOS
========================================================= */

import {
  AREAS_VALIDAS,
  TEMPO_MINIMO_POR_AREA
} from "./config.js";

import {
  limparTexto,
  normalizarTexto,
  converterTempoParaMinutos,
  obterValorObjeto,
  formatarMes
} from "./utils.js";


/* =========================================================
   PROCESSAR DADOS DA API
========================================================= */

export function processarDadosApi(dadosApi) {

  /* =======================================================
     VALIDAR BASE
  ======================================================= */

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


  /* =======================================================
     FILTROS DA BASE

     1. SOMENTE MÊS ATUAL
     2. SOMENTE OBRIGATÓRIOS

     IMPORTANTE:
     NÃO FILTRAMOS POR ÁREA AQUI.

     Se a pessoa não estiver no CADASTRO_AREAS,
     ela precisa continuar na base para gerar o alerta.
  ======================================================= */

  const dadosMesAtual =
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


  /* =======================================================
     NORMALIZAR REGISTROS
  ======================================================= */

  const registros =
    dadosMesAtual
      .map(
        item => {

          /* =================================================
             NOME
          ================================================= */

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


          /* =================================================
             MÊS
          ================================================= */

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


          /* =================================================
             TEMPO / HORAS
          ================================================= */

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


          /* =================================================
             GEMBA
          ================================================= */

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


          /* =================================================
             STATUS BAR
          ================================================= */

          const statusBar =
            normalizarTexto(
              obterValorObjeto(
                item,
                [
                  "ESTADO_BAR",
                  "Status BAR",
                  "Status Bar",
                  "STATUS_BAR"
                ]
              )
            );


          /* =================================================
             ÁREA CONSOLIDADA

             VEM DO CADASTRO_AREAS APÓS O MERGE.

             Se não houver correspondência no cadastro:
             areaOriginal = ""
             area = ""
          ================================================= */

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


          /* =================================================
             SETOR

             SETOR também vem do CADASTRO_AREAS.

             POSITION_PEOPLE e ROL ficam apenas como fallback.
          ================================================= */

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


          /* =================================================
             STATUS CADASTRO
          ================================================= */

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


          /* =================================================
             USERNAME
          ================================================= */

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


          /* =================================================
             EMAIL
          ================================================= */

          const email =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "EMAIL"
                ]
              )
            );


          /* =================================================
             CAD
          ================================================= */

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


          /* =================================================
             OBRIGATORIEDADE
          ================================================= */

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


          /* =================================================
             POSSUI CADASTRO DE ÁREA?
          ================================================= */

          const temCadastroArea =
            AREAS_VALIDAS.includes(
              area
            );


          /* =================================================
             RETORNO DA PESSOA
          ================================================= */

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
              temCadastroArea,

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


  return montarResultado(
    registros
  );

}


/* =========================================================
   MONTAR RESULTADO FINAL
========================================================= */

function montarResultado(
  registros
) {

  if (
    registros.length ===
    0
  ) {

    throw new Error(
      "Nenhuma pessoa obrigatória foi encontrada no mês atual."
    );

  }


  /* =======================================================
     ESTRUTURA DAS ÁREAS
  ======================================================= */

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


  /* =======================================================
     LISTAS
  ======================================================= */

  const processo =
    [];

  const naoRealizaram =
    [];

  const guembaPendente =
    [];

  const guembaProcessando =
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

         A pessoa continua fazendo parte do HC GERAL.

         Porém não entra em Outbound, Inbound, OPEX,
         ICQA ou Line Haul até receber área no cadastro.
      =================================================== */

      if (
        !pessoa.temCadastroArea
      ) {

        semCadastro.push(
          pessoa
        );

      }


      /* ===================================================
         CONTAGEM POR ÁREA

         SOMENTE PESSOAS COM ÁREA VÁLIDA.
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
         LISTA EM PROCESSO

         É uma lista geral.
         A pessoa permanece nela mesmo se estiver sem área.
      =================================================== */

      if (
        pessoa.situacao ===
        "EM_PROCESSO"
      ) {

        processo.push(
          pessoa
        );

      }


      /* ===================================================
         LISTA NÃO REALIZARAM
      =================================================== */

      if (
        pessoa.situacao ===
        "NAO_REALIZOU"
      ) {

        naoRealizaram.push(
          pessoa
        );

      }


      /* ===================================================
         TEMPO MÍNIMO
      =================================================== */

      const tempoConclusao =

        pessoa.area ===
        "OPEX"

          ? TEMPO_MINIMO_POR_AREA.OPEX

          : TEMPO_MINIMO_POR_AREA.PADRAO;


      /* ===================================================
         GEMBA PENDENTE
      =================================================== */

      if (
        gembaConcluido(
          pessoa.gemba
        ) &&
        pessoa.minutos ===
        0
      ) {

        guembaPendente.push(
          pessoa
        );

      }


      /* ===================================================
         GEMBA PROCESSANDO
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

        guembaProcessando.push(
          pessoa
        );

      }

    }
  );


  /* =======================================================
     PERCENTUAL POR ÁREA
  ======================================================= */

  AREAS_VALIDAS.forEach(
    area => {

      const dadosArea =
        areas[
          area
        ];


      dadosArea.percentual =

        dadosArea.hc >
        0

          ? dadosArea.realizaram /
            dadosArea.hc

          : 0;

    }
  );


  /* =======================================================
     ORDENAÇÕES
  ======================================================= */

  processo.sort(
    ordenarPorTempoENome
  );


  naoRealizaram.sort(
    ordenarPorNome
  );


  guembaPendente.sort(
    ordenarPorNome
  );


  guembaProcessando.sort(
    ordenarPorTempoENome
  );


  semCadastro.sort(
    ordenarPorNome
  );


  /* =======================================================
     GERAL

     IMPORTANTE:

     O HC GERAL CONTINUA SENDO TODOS OS OBRIGATÓRIOS
     DO MÊS.

     Inclusive quem ainda está sem área cadastrada.
  ======================================================= */

  const geral =
    calcularGeralPorRegistros(
      registros
    );


  /* =======================================================
     RETORNO FINAL
  ======================================================= */

  return {

    mes:
      descobrirMes(
        registros
      ),

    registros:
      registros,

    areas:
      areas,

    geral:
      geral,

    processo:
      processo,

    naoRealizaram:
      naoRealizaram,

    guembaPendente:
      guembaPendente,

    guembaProcessando:
      guembaProcessando,

    /* =====================================================
       ALERTA DE CADASTRO
    ===================================================== */

    semCadastro:
      semCadastro,

    quantidadeSemCadastro:
      semCadastro.length

  };

}


/* =========================================================
   CLASSIFICAR SITUAÇÃO
========================================================= */

function classificarSituacao(
  gemba,
  statusBar
) {

  /* =======================================================
     REALIZOU
  ======================================================= */

  const statusRealizado = [

    "HECHO",

    "CUMPLIO",

    "REALIZADO",

    "CONCLUIDO"

  ];


  if (
    statusRealizado.includes(
      gemba
    ) ||
    statusRealizado.includes(
      statusBar
    )
  ) {

    return "REALIZOU";

  }


  /* =======================================================
     EM PROCESSO
  ======================================================= */

  const statusProcessando = [

    "EN PROCESO",

    "EM PROCESSO",

    "EN CURSO",

    "INICIADO"

  ];


  if (
    statusProcessando.includes(
      gemba
    ) ||
    statusProcessando.includes(
      statusBar
    )
  ) {

    return "EM_PROCESSO";

  }


  /* =======================================================
     NÃO REALIZOU
  ======================================================= */

  return "NAO_REALIZOU";

}


/* =========================================================
   VERIFICAR GEMBA CONCLUÍDO
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
    gemba
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

    geral.hc >
    0

      ? geral.realizaram /
        geral.hc

      : 0;


  return geral;

}


/* =========================================================
   MÊS PREDOMINANTE
========================================================= */

function descobrirMes(
  registros
) {

  const contador =
    {};


  registros.forEach(
    registro => {

      if (
        !registro.mes
      ) {

        return;

      }


      contador[
        registro.mes
      ] =

        (
          contador[
            registro.mes
          ] ||
          0
        ) +
        1;

    }
  );


  const maior =

    Object.entries(
      contador
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
   ORDENAÇÕES
========================================================= */

function ordenarPorNome(
  pessoaA,
  pessoaB
) {

  return pessoaA.nome
    .localeCompare(
      pessoaB.nome,
      "pt-BR"
    );

}


function ordenarPorTempoENome(
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


  return ordenarPorNome(
    pessoaA,
    pessoaB
  );

}
