function validarEntradaUsuario(dadosUsuario) {
    const erros = {};

    // Verificar se o campo 'nome' está preenchido
    if (!dadosUsuario.nome || dadosUsuario.nome.trim() === '') {
        erros.nome = 'O nome é obrigatório.';
    }

    // Verificar se o campo 'email' está preenchido e possui um formato válido
    if (!dadosUsuario.email || !/^\S+@\S+\.\S+$/.test(dadosUsuario.email)) {
        erros.email = 'O email é obrigatório e deve ser válido.';
    }

    // Verificar se o campo 'idade' está preenchido e é um número válido maior ou igual a 18
    if (!dadosUsuario.idade || !Number.isInteger(dadosUsuario.idade) || dadosUsuario.idade < 18) {
        erros.idade = 'A idade é obrigatória e deve ser um número maior ou igual a 18.';
    }

    // Adicione mais verificações conforme necessário para outros campos

    // Retornar um objeto contendo os erros encontrados, se houver, ou null se não houver erros
    return Object.keys(erros).length === 0 ? null : erros;
}

// Exemplo de uso:
const dadosUsuario = {
    nome: 'João da Silva',
    email: 'joao@example.com',
    idade: 19,
    // Adicione mais campos conforme necessário
};

const erros = validarEntradaUsuario(dadosUsuario);
if (erros) {
    console.log('Erros de validação:', erros);
} else {
    console.log('Dados de entrada do usuário válidos.');
}