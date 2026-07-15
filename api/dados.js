/* =========================================================
   API SEGURA — BE A REP

   Vercel
      ↓
   Verdi Flow
      ↓
   Google Sheets
========================================================= */

const VERDI_URL =
  "https://api.mercadolibre.com/workspace/genai/verdi-flows/webhook/0a7356a6-9917-4435-acfe-60269391ca30/external";


export default async function handler(req, res) {

  /* =======================================================
     PERMITIR SOMENTE GET
  ======================================================= */

  if (req.method !== "GET") {

    return res
      .status(405)
      .json({

        sucesso: false,

        erro:
          "Método não permitido."

      });

  }


  try {

    /* =====================================================
       CREDENCIAIS DA VERCEL
    ===================================================== */

    const usuario =
      process.env.VERDI_USER;


    const senha =
      process.env.VERDI_PASSWORD;


    if (
      !usuario ||
      !senha
    ) {

      throw new Error(
        "As credenciais do Verdi não foram configuradas na Vercel."
      );

    }


    /* =====================================================
       BASIC AUTH
    ===================================================== */

    const credencial =
      Buffer
        .from(
          `${usuario}:${senha}`
        )
        .toString(
          "base64"
        );


    /* =====================================================
       BUSCAR DADOS
    ===================================================== */

    const resposta =
      await fetch(
        VERDI_URL,
        {

          method:
            "GET",

          headers: {

            Authorization:
              `Basic ${credencial}`,

            Accept:
              "application/json"

          }

        }
      );


    /* =====================================================
       VALIDAR RESPOSTA
    ===================================================== */

    if (
      !resposta.ok
    ) {

      const textoErro =
        await resposta.text();


      throw new Error(

        `Erro do Verdi (${resposta.status}): ` +

        textoErro

      );

    }


    const dados =
      await resposta.json();


    /* =====================================================
       RESPOSTA PARA O DASHBOARD
    ===================================================== */

    res.setHeader(
      "Cache-Control",
      "no-store, max-age=0"
    );


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
      "Erro ao buscar dados do Verdi:",
      erro
    );


    return res
      .status(500)
      .json({

        sucesso: false,

        erro:
          erro.message

      });

  }

}
