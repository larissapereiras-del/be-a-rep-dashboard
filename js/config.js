/* =========================================================
   CENTRAL BE A REP
   CONFIGURAÇÕES GERAIS
========================================================= */

export const API_DADOS =
  "/api/dados";


/* =========================================================
   TARGET
========================================================= */

export const TARGET_BE_A_REP =
  0.90;


/* =========================================================
   ÁREAS
========================================================= */

export const AREAS_VALIDAS = [

  "Outbound",

  "Inbound",

  "OPEX",

  "ICQA",

  "Line Haul"

];


/* =========================================================
   LOCAL STORAGE
========================================================= */

export const CHAVE_EXCECOES =
  "be-a-rep-pessoas-ocultadas";


/* =========================================================
   TEMPO MÍNIMO PARA CONCLUSÃO
========================================================= */

export const TEMPO_MINIMO_POR_AREA = {

  OPEX: 10,

  PADRAO: 60

};


/* =========================================================
   NOMES DOS PNG
========================================================= */

export const NOMES_ARTES = {

  geral:
    "Be-a-Rep-Resumo-Geral",

  processo:
    "Be-a-Rep-Em-Processo",

  nao:
    "Be-a-Rep-Nao-Realizaram",

  guembaPendente:
    "Be-a-Rep-Guemba-Pendente",

  guembaProcessando:
    "Be-a-Rep-Guemba-Processando"

};


/* =========================================================
   EXCEÇÕES DE SETOR
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
