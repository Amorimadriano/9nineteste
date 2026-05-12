/**
 * Fixtures de extratos brutos para testes de parsers
 * @agente-testes
 */

// Extrato Rede (formato CSV padrão)
export const extratoRedeCSV = `Data;Bandeira;Produto;Número do Cartão;Número da Autorização;NSU;Valor da Transação;Valor da Taxa;Valor Líquido;Status
15/01/2024;VISA;Crédito à Vista;****1234;123456;987654321;150,00;3,75;146,25;Aprovada
14/01/2024;MASTERCARD;Débito;****5678;654321;123456789;89,90;2,25;87,65;Aprovada
13/01/2024;ELO;Crédito Parcelado;****9012;789012;456789012;450,00;13,50;436,50;Aprovada
12/01/2024;VISA;CHARGEBACK;****1234;000000;999888777;-250,00;0,00;-250,00;Contestada`;

// Extrato Cielo (formato CSV)
export const extratoCieloCSV = `Data da Venda;Data do Pagamento;Bandeira;Valor Bruto;Valor Líquido;Taxa;TID;Número do Cartão
15/01/2024;17/01/2024;VISA;150,00;146,25;2,50%;1234567890;****1234
14/01/2024;16/01/2024;MASTERCARD;89,90;87,65;2,50%;0987654321;****5678
13/01/2024;15/01/2024;ELO;450,00;436,50;3,00%;1122334455;****9012`;

// Extrato Stone (formato CSV)
export const extratoStoneCSV = `Data/Hora,Bandeira,Valor,Tipo,Parcela,Status,NSU
2024-01-15T10:00:00,VISA,150.00,Crédito,1/1,Aprovado,TX123456
2024-01-14T09:30:00,MASTERCARD,89.90,Débito,1/1,Aprovado,TX789012
2024-01-13T14:15:00,ELO,450.00,Parcelado,1/3,Aprovado,TX345678
2024-01-12T16:00:00,VISA,-250.00,Estorno,1/1,Cancelado,TX901234`;

// Extrato com valores negativos (chargebacks)
export const extratoComChargebacks = `Data;Bandeira;Valor;Descrição;Tipo
15/01/2024;VISA;150,00;Compra Cliente A;Venda
14/01/2024;MC;89,90;Compra Cliente B;Venda
13/01/2024;ELO;-150,00;CHARGEBACK;Estorno
13/01/2024;ELO;150,00;Reapresentacao;Reapresentacao`;

// Extrato com parcelas
export const extratoComParcelas = `Data;Bandeira;Valor;Parcela;Valor Parcela
15/01/2024;VISA;900,00;1/3;300,00
15/02/2024;VISA;900,00;2/3;300,00
15/03/2024;VISA;900,00;3/3;300,00`;

// Extrato inválido (para testes de erro)
export const extratoInvalido = `conteudo
invalido
sem estrutura correta`;

// Extrato vazio
export const extratoVazio = ``;

// Extrato com cabeçalho ausente
export const extratoSemCabecalho = `15/01/2024;VISA;150,00
14/01/2024;MC;89,90`;

// Extrato com encoding estranho
export const extratoEncodingEstranho = `Data;Bandeira;Valor
15/01/2024;VISÃO;150,00`;

// ============================================
// EXTRATOS ATUALIZADOS 2026
// ============================================

// Extrato Rede/Itaú 2026 (formato brasileiro padrão)
export const extratoRede2026CSV = `Data;Hora;Número do Cartão;Bandeira;Valor da Compra;Valor Líquido;Taxa;NSU;Código de Autorização;Tipo de Transação;Número de Parcelas;Parcela Atual
17/04/2026;10:30:15;****1234;Visa;150,00;147,02;1,99;123456789;AUTH001;Crédito;1;1
17/04/2026;14:22:45;****5678;Mastercard;320,50;314,12;1,99;123456790;AUTH002;Crédito;3;1
17/04/2026;16:45:30;****9012;Elo;89,90;87,85;2,29;123456791;AUTH003;Débito;1;1
16/04/2026;09:15:00;****3456;Visa;1250,00;1225,13;1,99;123456792;AUTH004;Crédito;6;1
18/04/2026;-;****9999;Visa;-150,00;-147,02;1,99;123456789;AUTH001;Estorno;1;1`;

// Extrato Cielo 2026 (formato com TID e datas separadas)
export const extratoCielo2026CSV = `Data Venda;Data Pagamento;Hora Venda;Modalidade;Bandeira;Número Cartão;Valor Bruto;Taxa;Valor Líquido;TID;NSU;Código Autorização;Parcela;Total Parcelas
17/04/2026;19/04/2026;10:30:15;Crédito;Visa;****1234;150,00;1,99;147,02;TID001;123456789;AUTH001;1;1
17/04/2026;19/06/2026;14:22:45;Crédito;Mastercard;****5678;320,50;1,99;314,12;TID002;123456790;AUTH002;1;3
17/04/2026;19/04/2026;16:45:30;Débito;Elo;****9012;89,90;2,29;87,85;TID003;123456791;AUTH003;1;1
18/04/2026;18/04/2026;10:30:15;Estorno;Visa;****1234;-150,00;1,99;-147,02;TID001;123456789;AUTH001;1;1`;

// Extrato Stone 2026 (formato moderno CSV)
export const extratoStone2026CSV = `Data/Hora,Tipo,Modalidade,Bandeira,Últimos 4 dígitos,Valor Bruto,Taxa,Valor Líquido,Parcela,Total Parcelas,NSU,Autorização,Status
17/04/2026 10:30:15,Crédito,À vista,Visa,1234,"150,00","1,99%","147,02",1,1,ST001,AUTH001,Recebido
17/04/2026 14:22:45,Crédito,Parcelado,Mastercard,5678,"320,50","1,99%","314,12",1,3,ST002,AUTH002,Recebido
17/04/2026 16:45:30,Débito,À vista,Elo,9012,"89,90","2,29%","87,85",1,1,ST003,AUTH003,Recebido
18/04/2026 10:30:15,Estorno,À vista,Visa,1234,"-150,00","1,99%","-147,02",1,1,ST001,AUTH001,Estornado`;
