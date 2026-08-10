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

  const registros =
    dadosApi
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
                  "Nombre",
                  "Nome"
                ]
              )
            );


          if (!nome) {

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
             SETOR / POSIÇÃO
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
             ÁREA INTERNA

             IMPORTANTE:
             Não usamos "AREA" da query oficial diretamente,
             pois nela aparecem valores como
             "Fulfillment Brazil", "Transportation" etc.

             Nossa área será posteriormente enriquecida com
             CADASTRO_AREAS.
          ================================================= */

          const area =
            normalizarArea(
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


          /* =================================================
             IDENTIFICADORES EXTRAS
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


          const email =
            limparTexto(
              obterValorObjeto(
                item,
                [
                  "EMAIL"
                ]
              )
            );


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
    registros.length === 0
  ) {

    throw new Error(
      "Nenhuma pessoa válida foi encontrada na base."
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
         PESSOA SEM ÁREA CADASTRADA
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
         CONTAGEM POR ÁREA

         Só entra aqui se houver uma área válida.
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
        pessoa.minutos === 0
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
        pessoa.minutos > 0 &&
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

        dadosArea.hc > 0

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
     Agora o GERAL considera TODAS as pessoas da base,
     inclusive quem ainda não tem área cadastrada.

     Dessa forma o Target continua correto.
  ======================================================= */

  const geral =
    calcularGeralPorRegistros(
      registros
    );


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

    semCadastro:
      semCadastro

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

    "CUMPLIÓ",

    "REALIZADO",

    "CONCLUIDO",

    "CONCLUÍDO"

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

     Exemplo da nova base:
     GEMBA = NO CUMPLIO
     ESTADO_BAR = NO INICIADO
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

    "CUMPLIÓ",

    "REALIZADO",

    "CONCLUIDO",

    "CONCLUÍDO"

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
   CALCULAR GERAL DIRETO PELOS REGISTROS
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
          ] || 0
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
