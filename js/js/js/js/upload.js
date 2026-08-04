/* =========================================================
   CENTRAL BE A REP
   LEITURA DE EXCEL E CSV
========================================================= */

import {
  obterExtensao,
  limparTexto,
  normalizarTexto,
  converterTempoParaMinutos
} from "./utils.js";


/* =========================================================
   PROCESSAR ARQUIVO MANUAL
========================================================= */

export async function processarArquivoManual(
  arquivo
) {

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


  return processarLinhasBase(
    linhas
  );

}


/* =========================================================
   LER EXCEL
========================================================= */

async function lerExcel(
  arquivo
) {

  if (
    typeof XLSX ===
    "undefined"
  ) {

    throw new Error(
      "A biblioteca de leitura de Excel não foi carregada."
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
      workbook.SheetNames[0];

  }


  if (
    !nomeAbaBase
  ) {

    throw new Error(
      "Nenhuma aba foi encontrada no arquivo."
    );

  }


  const worksheet =
    workbook.Sheets[
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

  if (
    typeof XLSX ===
    "undefined"
  ) {

    throw new Error(
      "A biblioteca de leitura de CSV não foi carregada."
    );

  }


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


  if (
    !nomeAba
  ) {

    throw new Error(
      "Nenhuma aba foi encontrada no arquivo CSV."
    );

  }


  const worksheet =
    workbook.Sheets[
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
   PROCESSAR LINHAS DA BASE MANUAL
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


  if (
    registros.length === 0
  ) {

    throw new Error(
      "Nenhuma pessoa válida foi encontrada na base."
    );

  }


  return registros;

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


  if (
    gemba ===
    "HECHO" ||
    bar ===
    "HECHO"
  ) {

    return "REALIZOU";

  }


  if (
    gemba ===
    "EN PROCESO" ||
    bar ===
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
