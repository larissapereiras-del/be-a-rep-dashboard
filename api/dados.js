export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {

    const usuario = process.env.VERDI_USER;
    const senha = process.env.VERDI_PASSWORD;

    if (!usuario || !senha) {
      return res.status(500).json({
        erro: "Credenciais do Verdi não configuradas."
      });
    }

    const webhookUrl =
      "https://api.mercadolibre.com/workspace/genai/verdi-flows/webhook/0a7356a6-9917-4435-acfe-60269391ca30/external";

    const autenticacao = Buffer
      .from(`${usuario}:${senha}`)
      .toString("base64");

    const resposta = await fetch(
      webhookUrl,
      {
        method: "GET",

        headers: {
          Authorization: `Basic ${autenticacao}`,
          Accept: "application/json"
        }
      }
    );

    if (!resposta.ok) {

      const detalhe =
        await resposta.text();

      console.error(
        "Erro retornado pelo Verdi:",
        resposta.status,
        detalhe
      );

      return res.status(resposta.status).json({
        erro: "Erro ao consultar a base no Verdi.",
        status: resposta.status
      });

    }

    const dados =
      await resposta.json();

    return res.status(200).json(dados);

  }

  catch (erro) {

    console.error(
      "Erro na API:",
      erro
    );

    return res.status(500).json({
      erro: "Erro interno ao carregar os dados."
    });

  }

}
