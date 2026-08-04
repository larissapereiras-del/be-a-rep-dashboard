/* =========================================================
   CENTRAL BE A REP
   DASHBOARD
========================================================= */

import {
  formatarPorcentagem,
  escaparHTML
} from "./utils.js";

import {
  CHAVE_EXCECOES
} from "./config.js";


let callbackAtualizacao = null;


/* =========================================================
   DASHBOARD
========================================================= */

export function preencherDashboard(dados) {

  preencherResumo(dados.geral);

  preencherAreas(dados.areas);

}


/* =========================================================
   RESUMO
========================================================= */

function preencherResumo(geral) {

  atualizarTexto("hc-total", geral.hc);

  atualizarTexto("realizaram", geral.realizaram);

  atualizarTexto("em-processo", geral.processo);

  atualizarTexto("nao-realizaram", geral.naoRealizaram);

  atualizarTexto(
    "percentual-geral",
    formatarPorcentagem(
      geral.percentual
    )
  );

}


/* =========================================================
   TABELA DE ÁREAS
========================================================= */

function preencherAreas(areas) {

  const tbody =
    document.getElementById(
      "resultado-areas"
    );

  if (!tbody) return;

  tbody.innerHTML = "";

  Object.entries(areas)
    .forEach(([nome, dados]) => {

      const tr =
        document.createElement("tr");

      tr.innerHTML = `
        <td>${escaparHTML(nome)}</td>
        <td>${dados.realizaram}</td>
        <td>${dados.processo}</td>
        <td>${dados.naoRealizaram}</td>
        <td>${dados.hc}</td>
        <td>${formatarPorcentagem(dados.percentual)}</td>
      `;

      tbody.appendChild(tr);

    });

}


/* =========================================================
   GESTÃO DE EXCEÇÕES
========================================================= */

export function configurarGestaoExcecoes(callback) {

  callbackAtualizacao =
    callback;

}


/* =========================================================
   EXCEÇÕES
========================================================= */

export function obterExcecoes() {

  try {

    return JSON.parse(

      localStorage.getItem(
        CHAVE_EXCECOES
      ) || "[]"

    );

  }

  catch {

    return [];

  }

}


export function salvarExcecoes(lista) {

  localStorage.setItem(

    CHAVE_EXCECOES,

    JSON.stringify(lista)

  );

  if (callbackAtualizacao) {

    callbackAtualizacao();

  }

}


/* =========================================================
   AUXILIAR
========================================================= */

function atualizarTexto(id, valor) {

  const elemento =
    document.getElementById(id);

  if (!elemento) return;

  elemento.textContent = valor;

}
