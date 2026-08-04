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
            .map(processarPessoa)
            .filter(Boolean);

    return montarResultado(registros);

}


/* =========================================================
   PROCESSAR UMA PESSOA
========================================================= */

function processarPessoa(item) {

    const nome =
        limparTexto(
            obterValorObjeto(
                item,
                ["Nombre", "Nome"]
            )
        );

    if (!nome) {

        return null;

    }

    const mes =
        limparTexto(
            obterValorObjeto(
                item,
                ["Mes", "Mês"]
            )
        );

    const tempo =
        limparTexto(
            obterValorObjeto(
                item,
                ["Horas Mes", "Horas Mês"]
            )
        );

    const gemba =
        normalizarTexto(
            obterValorObjeto(
                item,
                ["Gemba"]
            )
        );

    const statusBar =
        normalizarTexto(
            obterValorObjeto(
                item,
                ["Status BAR"]
            )
        );

    const setor =
        limparTexto(
            obterValorObjeto(
                item,
                ["SETOR", "Setor"]
            )
        ).toUpperCase();

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

        nome,

        mes,

        tempo,

        minutos:
            converterTempoParaMinutos(
                tempo
            ),

        gemba,

        statusBar,

        setor,

        area,

        situacao:
            classificarSituacao(
                gemba,
                statusBar
            )

    };

}


/* =========================================================
   MONTAR RESULTADO FINAL
========================================================= */

function montarResultado(registros) {

    const areas = {};

    AREAS_VALIDAS.forEach(area => {

        areas[area] = {

            hc: 0,

            realizaram: 0,

            processo: 0,

            naoRealizaram: 0,

            percentual: 0

        };

    });

    const processo = [];

    const naoRealizaram = [];

    const guembaPendente = [];

    const guembaProcessando = [];

    registros.forEach(pessoa => {

        if (!AREAS_VALIDAS.includes(pessoa.area)) {

            return;

        }

        const area = areas[pessoa.area];

        area.hc++;

        if (pessoa.situacao === "REALIZOU") {

            area.realizaram++;

        }

        else if (

            pessoa.situacao === "EM_PROCESSO"

        ) {

            area.processo++;

            processo.push(pessoa);

        }

        else {

            area.naoRealizaram++;

            naoRealizaram.push(pessoa);

        }

        const tempoConclusao =

            pessoa.area === "OPEX"

                ? TEMPO_MINIMO_POR_AREA.OPEX

                : TEMPO_MINIMO_POR_AREA.PADRAO;

        if (

            pessoa.gemba === "HECHO"

            &&

            pessoa.minutos === 0

        ) {

            guembaPendente.push(pessoa);

        }

        if (

            pessoa.gemba === "HECHO"

            &&

            pessoa.minutos > 0

            &&

            pessoa.minutos < tempoConclusao

        ) {

            guembaProcessando.push(pessoa);

        }

    });

    let geral = {

        hc: 0,

        realizaram: 0,

        processo: 0,

        naoRealizaram: 0,

        percentual: 0

    };

    AREAS_VALIDAS.forEach(area => {

        areas[area].percentual =

            areas[area].hc

                ? areas[area].realizaram / areas[area].hc

                : 0;

        geral.hc += areas[area].hc;

        geral.realizaram += areas[area].realizaram;

        geral.processo += areas[area].processo;

        geral.naoRealizaram += areas[area].naoRealizaram;

    });

    geral.percentual =

        geral.hc

            ? geral.realizaram / geral.hc

            : 0;

    return {

        mes:

            descobrirMes(registros),

        registros,

        areas,

        geral,

        processo,

        naoRealizaram,

        guembaPendente,

        guembaProcessando

    };

}


/* =========================================================
   SITUAÇÃO
========================================================= */

function classificarSituacao(gemba, bar) {

    if (

        gemba === "HECHO"

        ||

        bar === "HECHO"

    ) {

        return "REALIZOU";

    }

    if (

        gemba === "EN PROCESO"

        ||

        bar === "EN PROCESO"

    ) {

        return "EM_PROCESSO";

    }

    return "NAO_REALIZOU";

}


/* =========================================================
   ÁREA
========================================================= */

function normalizarArea(valor) {

    const texto =
        normalizarTexto(valor);

    if (texto === "OUTBOUND") return "Outbound";

    if (texto === "INBOUND") return "Inbound";

    if (texto === "ICQA") return "ICQA";

    if (texto === "OPEX") return "OPEX";

    if (

        texto === "LINE HAUL"

        ||

        texto === "LINEHAUL"

    ) {

        return "Line Haul";

    }

    return "";

}


/* =========================================================
   MÊS
========================================================= */

function descobrirMes(registros) {

    const contador = {};

    registros.forEach(r => {

        if (!r.mes) return;

        contador[r.mes] =

            (contador[r.mes] || 0) + 1;

    });

    const maior =

        Object.entries(contador)

            .sort((a, b) => b[1] - a[1])[0];

    return maior

        ? formatarMes(maior[0])

        : "";

}
