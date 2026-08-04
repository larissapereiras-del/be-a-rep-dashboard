/* =========================================================
   CENTRAL BE A REP
   UPLOAD DE ARQUIVOS
========================================================= */

import {
  obterExtensao
} from "./utils.js";


/* =========================================================
   PROCESSAR ARQUIVO
========================================================= */

export async function processarArquivoManual(
  arquivo
) {

  const extensao =
    obterExtensao(
      arquivo.name
    );


  switch (
    extensao
  ) {

    case "xlsx":

    case "xls":

      return await lerExcel(
        arquivo
      );


    case "csv":

      return await lerCSV(
        arquivo
      );


    default:

      throw new Error(

        "Formato de arquivo não suportado."

      );

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


  const primeiraAba =
    workbook.SheetNames[0];


  const worksheet =
    workbook.Sheets[
      primeiraAba
    ];


  return XLSX.utils.sheet_to_json(
    worksheet,
    {
      defval:
        ""
    }
  );

}


/* =========================================================
   LER CSV
========================================================= */

async function lerCSV(
  arquivo
) {

  return new Promise(

    (
      resolve,
      reject
    ) => {

      Papa.parse(
        arquivo,
        {

          header:
            true,

          skipEmptyLines:
            true,

          complete:
            resultado => {

              resolve(
                resultado.data
              );

            },

          error:
            erro => {

              reject(
                erro
              );

            }

        }
      );

    }

  );

}
