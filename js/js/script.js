/* =========================================================
   CENTRAL BE A REP
   INICIALIZAÇÃO PRINCIPAL
========================================================= */

import {
  buscarDadosAutomaticos
} from "./api.js";


import {
  processarDadosApi
} from "./processamento.js";


import {
  preencherDashboard,
  configurarGestaoExcecoes
} from "./dashboard.js";


import {
  configurarArtes,
  preencherArtes,
  atualizarListasDasArtes,
  mostrarArte
} from "./artes.js";


import {
  processarArquivoManual
} from "./upload.js";


/* =========================================================
   ESTADO
========================================================= */

let dadosAtuais =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

const botaoAtualizar =
  document.getElementById(
    "botao-atualizar"
  );


const inputArquivo =
  document.getElementById(
    "arquivo-base"
  );


const statusArquivo =
  document.getElementById(
    "status-arquivo"
  );


const textoAtualizacao =
  document.getElementById(
    "texto-atualizacao"
  );


const resumoDados =
  document.getElementById(
    "resumo-dados"
  );


const menuArtes =
  document.getElementById(
    "menu-artes"
  );


const areaArtes =
  document.getElementById(
    "area-artes"
  );


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    configurarEventos();


    configurarArtes();


    configurarGestaoExcecoes(
      () => {

        atualizarListasDasArtes();

      }
    );


    await carregarDados();

  }
);


/* =========================================================
   CONFIGURAR EVENTOS
========================================================= */

function configurarEventos() {

  if (
    botaoAtualizar
  ) {

    botaoAtualizar.addEventListener(
      "click",
      async () => {

        await carregarDados();

      }
    );

  }


  if (
    inputArquivo
  ) {

    inputArquivo.addEventListener(
      "change",
      async evento => {

        const arquivo =
          evento.target.files?.[0];


        if (
          !arquivo
        ) {

          return;

        }


        await carregarArquivoManual(
          arquivo
        );

      }
    );

  }

}


/* =========================================================
   CARREGAR DADOS AUTOMÁTICOS
========================================================= */

async function carregarDados() {

  const textoOriginalBotao =

    botaoAtualizar
      ? botaoAtualizar.textContent
      : "Atualizar dados";


  try {

    bloquearBotaoAtualizar(
      true,
      "Atualizando..."
    );


    definirTextoAtualizacao(
      "Buscando os dados mais recentes da base..."
    );


    atualizarStatus(
      "Conectando à base...",
      ""
    );


    const registrosApi =
      await buscarDadosAutomaticos();


    dadosAtuais =
      processarDadosApi(
        registrosApi
      );


    preencherTudo(
      dadosAtuais
    );


    exibirDashboard();


    const horario =

      new Date()
        .toLocaleTimeString(
          "pt-BR",
          {
            hour:
              "2-digit",

            minute:
              "2-digit"
          }
        );


    atualizarStatus(

      `✅ Dados atualizados automaticamente às ${horario}.`,

      "sucesso"

    );


    definirTextoAtualizacao(

      'Dados sincronizados diretamente pelo Verdi. Clique em "Atualizar dados" para buscar novamente.'

    );


    mostrarArte(
      "geral"
    );

  }

  catch (
    erro
  ) {

    console.error(
      "Erro ao carregar dados automáticos:",
      erro
    );


    atualizarStatus(

      `❌ Não foi possível atualizar automaticamente: ${erro.message}`,

      "erro"

    );


    definirTextoAtualizacao(

      "A atualização automática falhou. Use o carregamento manual como backup."

    );


    ocultarDashboard();

  }

  finally {

    bloquearBotaoAtualizar(

      false,

      textoOriginalBotao ||
      "Atualizar dados"

    );

  }

}


/* =========================================================
   CARREGAR ARQUIVO MANUAL
========================================================= */

async function carregarArquivoManual(
  arquivo
) {

  try {

    atualizarStatus(
      "Lendo arquivo manual...",
      ""
    );


    definirTextoAtualizacao(
      "Processando o arquivo selecionado..."
    );


    const registros =
      await processarArquivoManual(
        arquivo
      );


    dadosAtuais =
      processarDadosApi(
        registros
      );


    preencherTudo(
      dadosAtuais
    );


    exibirDashboard();


    atualizarStatus(

      `✅ Arquivo carregado manualmente com sucesso: ${arquivo.name}`,

      "sucesso"

    );


    definirTextoAtualizacao(
      "Dados carregados pelo arquivo manual."
    );


    mostrarArte(
      "geral"
    );

  }

  catch (
    erro
  ) {

    console.error(
      "Erro ao carregar arquivo manual:",
      erro
    );


    atualizarStatus(

      `❌ ${erro.message}`,

      "erro"

    );


    definirTextoAtualizacao(

      "Não foi possível carregar o arquivo selecionado."

    );


    ocultarDashboard();

  }

  finally {

    if (
      inputArquivo
    ) {

      inputArquivo.value =
        "";

    }

  }

}


/* =========================================================
   PREENCHER SISTEMA
========================================================= */

function preencherTudo(
  dados
) {

  preencherDashboard(
    dados
  );


  preencherArtes(
    dados
  );

}


/* =========================================================
   EXIBIR DASHBOARD
========================================================= */

function exibirDashboard() {

  if (
    resumoDados
  ) {

    resumoDados
      .classList
      .remove(
        "oculto"
      );

  }


  if (
    menuArtes
  ) {

    menuArtes
      .classList
      .remove(
        "oculto"
      );

  }


  if (
    areaArtes
  ) {

    areaArtes
      .classList
      .remove(
        "oculto"
      );

  }

}


/* =========================================================
   OCULTAR DASHBOARD
========================================================= */

function ocultarDashboard() {

  if (
    resumoDados
  ) {

    resumoDados
      .classList
      .add(
        "oculto"
      );

  }


  if (
    menuArtes
  ) {

    menuArtes
      .classList
      .add(
        "oculto"
      );

  }


  if (
    areaArtes
  ) {

    areaArtes
      .classList
      .add(
        "oculto"
      );

  }

}


/* =========================================================
   STATUS
========================================================= */

function atualizarStatus(
  texto,
  classe
) {

  if (
    !statusArquivo
  ) {

    return;

  }


  statusArquivo.textContent =
    texto;


  statusArquivo.className =
    "status-arquivo";


  if (
    classe
  ) {

    statusArquivo
      .classList
      .add(
        classe
      );

  }

}


/* =========================================================
   TEXTO DE ATUALIZAÇÃO
========================================================= */

function definirTextoAtualizacao(
  texto
) {

  if (
    textoAtualizacao
  ) {

    textoAtualizacao.textContent =
      texto;

  }

}


/* =========================================================
   BOTÃO DE ATUALIZAÇÃO
========================================================= */

function bloquearBotaoAtualizar(
  bloqueado,
  texto
) {

  if (
    !botaoAtualizar
  ) {

    return;

  }


  botaoAtualizar.disabled =
    bloqueado;


  botaoAtualizar.textContent =
    texto;

}
