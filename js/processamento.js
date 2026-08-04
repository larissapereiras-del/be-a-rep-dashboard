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


          if (
            !nome
          ) {

            return null;

          }


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


  const processo =
    [];


  const naoRealizaram =
    [];


  const guembaPendente =
    [];


  const guembaProcessando =
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


        processo.push(
          pessoa
        );

      }

      else {

        dadosArea.naoRealizaram++;


        naoRealizaram.push(
          pessoa
        );

      }


      const tempoConclusao =

        pessoa.area ===
        "OPEX"

          ? TEMPO_MINIMO_POR_AREA.OPEX

          : TEMPO_MINIMO_POR_AREA.PADRAO;


      if (
        pessoa.gemba ===
        "HECHO" &&
        pessoa.minutos ===
        0
      ) {

        guembaPendente.push(
          pessoa
        );

      }


      if (
        pessoa.gemba ===
        "HECHO" &&
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


  const geral =
    calcularGeral(
      areas
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
      guembaProcessando

  };

}


/* =========================================================
   CLASSIFICAR SITUAÇÃO
========================================================= */

function classificarSituacao(
  gemba,
  statusBar
) {

  if (
    gemba ===
    "HECHO" ||
    statusBar ===
    "HECHO"
  ) {

    return "REALIZOU";

  }


  if (
    gemba ===
    "EN PROCESO" ||
    statusBar ===
    "EN PROCESO"
  ) {

    return "EM_PROCESSO";

  }


  return "NAO_REALIZOU";

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

function calcularGeral(
  areas
) {

  const geral = {

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


  AREAS_VALIDAS.forEach(
    area => {

      const dadosArea =
        areas[
          area
        ];


      geral.hc +=
        dadosArea.hc;


      geral.realizaram +=
        dadosArea.realizaram;


      geral.processo +=
        dadosArea.processo;


      geral.naoRealizaram +=
        dadosArea.naoRealizaram;

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
