// Cálculo de diferença entre datas:
function calcularDiferencaEntreDatas(data1, data2) {
    const diff = Math.abs(data1 - data2);
    const umDiaEmMilissegundos = 1000 * 60 * 60 * 24;
    return Math.floor(diff / umDiaEmMilissegundos);
}

// Exemplo de uso:
const data1 = new Date('2023-05-01');
const data2 = new Date('2024-05-10');
console.log("Diferença em dias:", calcularDiferencaEntreDatas(data1, data2));

// Formatação de datas para exibição:
function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Exemplo de uso:
const data = new Date('2024-04-03T00:00:00.000');
console.log("Data formatada:", formatarData(data));

// Manipulação de fusos horários:
function converterFusoHorario(data, fusoHorarioAlvo) {
    const fusoHorarioAtual = data.getTimezoneOffset() / 60;
    const diferencaHoras = fusoHorarioAlvo - fusoHorarioAtual;
    const novaData = new Date(data);
    novaData.setHours(data.getHours() + diferencaHoras);
    return novaData;
}

// Exemplo de uso:
const date = new Date('2024-05-01T12:00:00Z'); // Data em UTC
const novaData = converterFusoHorario(date, -3); // Converter para fuso horário de Brasília
console.log("Nova data:", novaData.toISOString());