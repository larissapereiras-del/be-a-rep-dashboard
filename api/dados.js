/* =========================================================
   CENTRAL BE A REP
   API SERVER-SIDE - VERDI
========================================================= */

const VERDI_URL =
  "https://api.mercadolibre.com/workspace/genai/verdi-flows/webhook/0a7356a6-9917-4435-acfe-60269391ca30/external";


/* =========================================================
   PEQUENA PAUSA
========================================================= */

function aguardar(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );

}


/* =========================================================
   CONSULTAR VERDI
========================================================= */

async function consultarVerdi(
  usuario,
  senha
) {

  const autenticacao =
    Buffer
      .from(
        `${usuario}:${senha}`
      )
      .toString(
        "base64"
      );


  const resposta =
    await fetch(
      `${VERDI_URL}?_=${Date.now()}`,
      {
        method:
          "GET",

        headers: {

          Authorization:
            `Basic ${autenticacao}`,

          Accept:
            "application/json"

        },

        cache:
          "no-store"

      }
    );


  const texto =
    await resposta.text();


  return {

    ok:
      resposta.ok,

    status:
      resposta.status,

    texto:
      texto

  };

}


/* =========================================================
   HANDLER PRINCIPAL
========================================================= */

module.exports = async function handler(
  req,
  res
) {

  /* =======================================================
     SOMENTE GET
  ======================================================= */

  if (
    req.method !==
    "GET"
  ) {

    return res
      .status(405)
      .json({

        erro:
          "Método não permitido."

      });

  }


  try {

    /* =====================================================
       CREDENCIAIS
    ===================================================== */

    const usuario =
      process.env.VERDI_USER;

    const senha =
      process.env.VERDI_PASSWORD;


    if (
      !usuario ||
      !senha
    ) {

      return res
        .status(500)
        .json({

          erro:
            "Credenciais do Verdi não configuradas."

        });

    }


    /* =====================================================
       PRIMEIRA TENTATIVA
    ===================================================== */

    let retorno =
      await consultarVerdi(
        usuario,
        senha
      );


    /* =====================================================
       SE VEIO VAZIO, TENTA NOVAMENTE
    ===================================================== */

    if (
      retorno.ok &&
      !String(
        retorno.texto || ""
      ).trim()
    ) {

      console.warn(
        "Verdi retornou resposta vazia. Tentando novamente..."
      );


      await aguardar(
        800
      );


      retorno =
        await consultarVerdi(
          usuario,
          senha
        );

    }


    /* =====================================================
       ERRO HTTP DO VERDI
    ===================================================== */

    if (
      !retorno.ok
    ) {

      console.error(
        "Erro retornado pelo Verdi:",
        retorno.status,
        retorno.texto
      );


      return res
        .status(
          retorno.status
        )
        .json({

          erro:
            "Erro ao consultar a base no Verdi.",

          status:
            retorno.status,

          detalhe:
            retorno.texto

        });

    }


    /* =====================================================
       RESPOSTA VAZIA
    ===================================================== */

    const textoLimpo =
      String(
        retorno.texto || ""
      ).trim();


    if (
      !textoLimpo
    ) {

      return res
        .status(502)
        .json({

          erro:
            "O Verdi respondeu sem dados. Tente atualizar novamente."

        });

    }


    /* =====================================================
       CONVERTER TEXTO PARA JSON
    ===================================================== */

    let dados;


    try {

      dados =
        JSON.parse(
          textoLimpo
        );

    }

    catch (
      erroJson
    ) {

      console.error(
        "Resposta inválida recebida do Verdi.",
        {
          tamanho:
            textoLimpo.length,

          inicio:
            textoLimpo.slice(
              0,
              300
            ),

          final:
            textoLimpo.slice(
              -300
            )
        }
      );


      return res
        .status(502)
        .json({

          erro:
            "O Verdi retornou uma resposta incompleta ou inválida.",

          tamanho:
            textoLimpo.length

        });

    }


    /* =====================================================
       VALIDAR LISTA
    ===================================================== */

    if (
      !Array.isArray(
        dados
      )
    ) {

      return res
        .status(502)
        .json({

          erro:
            "O Verdi não retornou uma lista de registros."

        });

    }


    /* =====================================================
       CACHE DESATIVADO
    ===================================================== */

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );


    /* =====================================================
       RETORNO
    ===================================================== */

    return res
      .status(200)
      .json(
        dados
      );

  }

  catch (
    erro
  ) {

    console.error(
      "Erro inesperado na API:",
      erro
    );


    return res
      .status(500)
      .json({

        erro:
          erro.message ||
          "Erro interno ao carregar os dados."

      });

  }

};
