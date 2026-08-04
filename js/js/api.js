/* =========================================================
   CENTRAL BE A REP
   COMUNICAÇÃO COM A API DO VERDI
========================================================= */

import {
  API_DADOS
} from "./config.js";


/* =========================================================
   BUSCAR DADOS AUTOMÁTICOS
========================================================= */

export async function buscarDadosAutomaticos() {

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


  if (
    !resposta.ok
  ) {

    let mensagem =
      `Erro ${resposta.status} ao consultar a base.`;


    try {

      const erroApi =
        await resposta.json();


      if (
        erroApi &&
        erroApi.erro
      ) {

        mensagem =
          erroApi.erro;

      }

    }

    catch (
      erroLeitura
    ) {

      console.warn(
        "Não foi possível ler o retorno de erro da API.",
        erroLeitura
      );

    }


    throw new Error(
      mensagem
    );

  }


  const registros =
    await resposta.json();


  if (
    !Array.isArray(
      registros
    )
  ) {

    throw new Error(
      "A API não retornou uma lista válida de pessoas."
    );

  }


  if (
    registros.length === 0
  ) {

    throw new Error(
      "A API retornou uma base vazia."
    );

  }


  return registros;

}
