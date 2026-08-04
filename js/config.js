/* =========================================================
   CENTRAL BE A REP
   CONFIGURAÇÕES GERAIS DO SISTEMA
========================================================= */

export const API_DADOS =
  "/api/dados";


export const TARGET_BE_A_REP =
  0.90;


export const AREAS_VALIDAS = [
  "Outbound",
  "Inbound",
  "OPEX",
  "ICQA",
  "Line Haul"
];


export const CHAVE_EXCECOES =
  "be-a-rep-pessoas-ocultadas";


export const TEMPO_MINIMO_POR_AREA = {

  OPEX:
    10,

  PADRAO:
    60

};


/* =========================================================
   NOMES DOS ARQUIVOS DAS ARTES
========================================================= */

export const NOMES_ARTES = {

  geral:
    "Be-a-Rep-Resumo-Geral",

  processo:
    "Be-a-Rep-Em-Processo",

  nao:
    "Be-a-Rep-Nao-Realizaram",

  guembaPendente:
    "Be-a-Rep-Guemba-Realizado-Pendente",

  guembaProcessando:
    "Be-a-Rep-Guemba-Realizado-Processando"

};


/* =========================================================
   EXCEÇÕES FIXAS DE SETOR
========================================================= */

export const EXCECOES_SETOR = {

  "PATRICIA GOMES MELO":
    "GERENTE OUT",

  "THIAGO COUTO BALDO":
    "GERENTE IN"

};


/* =========================================================
   MOTIVOS DISPONÍVEIS
========================================================= */

export const MOTIVOS_EXCECAO = [
  "Licença-maternidade",
  "INSS",
  "Afastamento",
  "Férias",
  "Outro"
];
