/* =========================================================
   CENTRAL BE A REP
   FUNÇÕES UTILITÁRIAS
========================================================= */


/* =========================================================
   LIMPAR TEXTO
========================================================= */

export function limparTexto(valor) {

  return String(
    valor ??
    ""
  )
    .trim();

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

export function normalizarTexto(valor) {

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
   ESCAPAR HTML
========================================================= */

export function escaparHTML(valor) {

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
   FORMATAR PORCENTAGEM
========================================================= */

export function formatarPorcentagem(valor) {

  return (

    (
      Number(
        valor
      ) || 0
    ) *
    100

  )
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
    ) +
    "%";

}


/* =========================================================
   OBTER EXTENSÃO
========================================================= */

export function obterExtensao(nomeArquivo) {

  return String(
    nomeArquivo ||
    ""
  )
    .split(
      "."
    )
    .pop()
    .toLowerCase();

}


/* =========================================================
   TEMPO PARA MINUTOS
========================================================= */

export function converterTempoParaMinutos(valor) {

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


  let horas =
    0;


  let minutos =
    0;


  const matchHoras =
    texto.match(
      /(\d+)\s*h/
    );


  const matchMinutos =
    texto.match(
      /(\d+)\s*m/
    );


  if (
    matchHoras
  ) {

    horas =
      Number(
        matchHoras[1]
      ) || 0;

  }


  if (
    matchMinutos
  ) {

    minutos =
      Number(
        matchMinutos[1]
      ) || 0;

  }


  return (
    horas * 60
  ) + minutos;

}


/* =========================================================
   BUSCAR VALOR EM OBJETO
========================================================= */

export function obterValorObjeto(
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
    const nomeBuscado of
    nomesPossiveis
  ) {

    const nomeNormalizado =
      normalizarTexto(
        nomeBuscado
      );


    const chaveEncontrada =
      chaves.find(
        chave =>
          normalizarTexto(
            chave
          ) ===
          nomeNormalizado
      );


    if (
      chaveEncontrada
    ) {

      return objeto[
        chaveEncontrada
      ];

    }

  }


  return "";

}


/* =========================================================
   FORMATAR MÊS
========================================================= */

export function formatarMes(valor) {

  const texto =
    normalizarTexto(
      valor
    );


  const nome =
    texto
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
   AGUARDAR IMAGENS
========================================================= */

export async function aguardarImagens(elemento) {

  const imagens =
    Array.from(
      elemento.querySelectorAll(
        "img"
      )
    );


  const promessas =
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
    );


  await Promise.all(
    promessas
  );

}
