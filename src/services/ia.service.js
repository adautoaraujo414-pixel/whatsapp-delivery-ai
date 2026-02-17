const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function gerarResposta(mensagemCliente, contexto) {
    try {
        const { cardapio, carrinho, etapa, nomeRestaurante, taxaEntrega } = contexto;

        let cardapioTexto = '';
        if (cardapio && cardapio.length > 0) {
            const categorias = {};
            cardapio.forEach(item => {
                if (!categorias[item.categoria]) categorias[item.categoria] = [];
                categorias[item.categoria].push(item);
            });
            for (const [cat, itens] of Object.entries(categorias)) {
                cardapioTexto += '\n📂 ' + cat + ':\n';
                itens.forEach(i => {
                    cardapioTexto += '  • ' + i.nome + ' - R$ ' + i.preco.toFixed(2) + (i.descricao ? ' (' + i.descricao + ')' : '') + '\n';
                });
            }
        }

        let carrinhoTexto = '';
        if (carrinho && carrinho.length > 0) {
            let subtotal = 0;
            carrinho.forEach(item => {
                carrinhoTexto += '  • ' + item.quantidade + 'x ' + item.nome + ' = R$ ' + (item.quantidade * item.preco).toFixed(2) + '\n';
                subtotal += item.quantidade * item.preco;
            });
            carrinhoTexto += '  Subtotal: R$ ' + subtotal.toFixed(2) + '\n';
            carrinhoTexto += '  Taxa entrega: R$ ' + (taxaEntrega || 5).toFixed(2) + '\n';
            carrinhoTexto += '  TOTAL: R$ ' + (subtotal + (taxaEntrega || 5)).toFixed(2);
        }

        const systemPrompt = `Você é a atendente virtual do ${nomeRestaurante || 'restaurante'} via WhatsApp. Seja simpática, use emojis e seja direta.

REGRAS:
- Cumprimente o cliente de forma natural e amigável
- Mostre o cardápio quando pedir ou quando for novo cliente
- Ajude a montar o pedido, pergunte quantidade
- Quando cliente quiser finalizar, peça: nome, endereço completo com número, complemento, forma de pagamento (pix, cartão, dinheiro), se dinheiro pergunte troco
- Confirme o pedido completo antes de enviar pra cozinha
- Se cliente perguntar tempo, diga que demora em média 30-45 minutos
- NÃO invente itens que não estão no cardápio
- Responda APENAS em português brasileiro
- Use formato WhatsApp: *negrito*, _itálico_
- Mantenha respostas curtas e objetivas (máximo 3-4 linhas quando possível)

CARDÁPIO DISPONÍVEL:${cardapioTexto || '\n  ⚠️ Cardápio ainda não configurado.'}

CARRINHO ATUAL:${carrinhoTexto || '\n  🛒 Vazio'}

ETAPA ATUAL: ${etapa || 'inicio'}
- inicio: cliente acabou de chegar, cumprimente e ofereça o cardápio
- escolhendo: cliente está escolhendo itens
- carrinho: cliente tem itens no carrinho, pergunte se quer mais algo
- finalizando: pegando dados (nome, endereço, pagamento)
- confirmando: confirmar pedido antes de enviar

Responda a mensagem do cliente de forma natural. Se ele pedir algo do cardápio, responda com JSON no final da sua mensagem assim:
[ACAO:adicionar|nome_do_item|quantidade]
[ACAO:remover|nome_do_item]
[ACAO:finalizar]
[ACAO:confirmar|nome|endereco|pagamento|troco]
[ACAO:etapa|nova_etapa]

Exemplo: se cliente pede "2 x-burguer", responda naturalmente e adicione:
[ACAO:adicionar|X-Burguer|2]
[ACAO:etapa|carrinho]`;

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: 'user', content: mensagemCliente }]
        });

        const textoCompleto = response.content[0].text;
        
        // Separar texto visível das ações
        const linhas = textoCompleto.split('\n');
        let textoResposta = [];
        let acoes = [];
        
        linhas.forEach(linha => {
            const match = linha.match(/\[ACAO:(.+)\]/);
            if (match) {
                acoes.push(match[1]);
            } else {
                textoResposta.push(linha);
            }
        });

        return {
            texto: textoResposta.join('\n').trim(),
            acoes: acoes
        };

    } catch (e) {
        console.error('❌ Erro IA:', e.message);
        return {
            texto: 'Olá! 😊 Desculpe, estou com um probleminha técnico. Pode tentar novamente em instantes?',
            acoes: []
        };
    }
}

module.exports = { gerarResposta };
