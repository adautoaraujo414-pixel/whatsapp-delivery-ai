const { Conversa, ItemCardapio, Pedido, Cliente, Admin } = require('../models');
const { gerarResposta } = require('./ia.service');
const whatsapp = require('./whatsapp.service');

async function processarMensagem(telefone, texto, adminId) {
    try {
        // Buscar ou criar conversa
        let conversa = await Conversa.findOne({ telefone, adminId });
        if (!conversa) {
            conversa = await Conversa.create({ telefone, adminId, etapa: 'inicio', carrinho: [], dados: {} });
        }

        // Buscar admin e cardápio
        const admin = await Admin.findById(adminId);
        const cardapio = await ItemCardapio.find({ adminId, disponivel: true });

        // Gerar resposta da IA
        const contexto = {
            cardapio,
            carrinho: conversa.carrinho || [],
            etapa: conversa.etapa,
            nomeRestaurante: admin?.restaurante?.nome || 'Restaurante',
            taxaEntrega: admin?.restaurante?.taxaEntrega || 5
        };

        const resposta = await gerarResposta(texto, contexto);

        // Processar ações da IA
        for (const acao of resposta.acoes) {
            const partes = acao.split('|');
            const tipo = partes[0];

            if (tipo === 'adicionar' && partes[1]) {
                const nomeItem = partes[1];
                const qtd = parseInt(partes[2]) || 1;
                const item = cardapio.find(i => i.nome.toLowerCase().includes(nomeItem.toLowerCase()));
                if (item) {
                    const existe = conversa.carrinho.findIndex(c => c.nome.toLowerCase() === item.nome.toLowerCase());
                    if (existe >= 0) {
                        conversa.carrinho[existe].quantidade += qtd;
                    } else {
                        conversa.carrinho.push({ itemId: item._id, nome: item.nome, quantidade: qtd, preco: item.preco });
                    }
                }
            }

            if (tipo === 'remover' && partes[1]) {
                conversa.carrinho = conversa.carrinho.filter(c => !c.nome.toLowerCase().includes(partes[1].toLowerCase()));
            }

            if (tipo === 'etapa' && partes[1]) {
                conversa.etapa = partes[1];
            }

            if (tipo === 'confirmar') {
                const nome = partes[1] || '';
                const endereco = partes[2] || '';
                const pagamento = partes[3] || 'dinheiro';
                const troco = parseFloat(partes[4]) || 0;
                const taxa = admin?.restaurante?.taxaEntrega || 5;
                const subtotal = conversa.carrinho.reduce((s, i) => s + (i.quantidade * i.preco), 0);

                // Criar pedido
                const pedido = await Pedido.create({
                    adminId,
                    clienteNome: nome,
                    clienteTelefone: telefone,
                    clienteEndereco: endereco,
                    itens: conversa.carrinho,
                    subtotal,
                    taxaEntrega: taxa,
                    total: subtotal + taxa,
                    formaPagamento: pagamento,
                    troco,
                    status: 'novo'
                });

                // Atualizar cliente
                await Cliente.findOneAndUpdate(
                    { telefone, adminId },
                    { nome, endereco, $inc: { pedidos: 1 }, ultimoPedido: new Date() },
                    { upsert: true }
                );

                // Atualizar estoque
                for (const item of conversa.carrinho) {
                    await ItemCardapio.findByIdAndUpdate(item.itemId, {
                        $inc: { estoque: -item.quantidade, vendidos: item.quantidade }
                    });
                }

                console.log('🛒 Novo pedido #' + pedido._id + ' de ' + nome);

                // Limpar conversa
                conversa.carrinho = [];
                conversa.etapa = 'inicio';
                conversa.dados = {};
            }

            if (tipo === 'finalizar') {
                conversa.etapa = 'finalizando';
            }
        }

        conversa.ultimaMensagem = new Date();
        await conversa.save();

        // Enviar resposta
        if (resposta.texto) {
            await whatsapp.enviarMensagem(telefone, resposta.texto);
        }

        return resposta;

    } catch (e) {
        console.error('❌ Erro bot:', e.message);
        try {
            await whatsapp.enviarMensagem(telefone, 'Desculpe, tive um probleminha. Pode repetir? 😊');
        } catch(e2) {}
    }
}

module.exports = { processarMensagem };
