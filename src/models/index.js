const mongoose = require('mongoose');

// ADMIN (dono do restaurante)
const AdminSchema = new mongoose.Schema({
    nome: String,
    email: { type: String, unique: true },
    senha: String,
    telefone: String,
    restaurante: {
        nome: String,
        endereco: String,
        telefone: String,
        logo: String,
        taxaEntrega: { type: Number, default: 5 },
        tempoMedio: { type: Number, default: 30 },
        horarioAbre: { type: String, default: '08:00' },
        horarioFecha: { type: String, default: '23:00' },
        aberto: { type: Boolean, default: true }
    },
    configEstoque: {
        alertaMinimo: { type: Number, default: 10 },
        enviarRelatorio: { type: Boolean, default: true },
        diaRelatorio: { type: String, default: 'segunda' }
    },
    instanciaWhatsapp: {
        conectado: { type: Boolean, default: false },
        qrCode: String,
        numero: String
    },
    configurado: { type: Boolean, default: false }
}, { timestamps: true });

// CARDÁPIO
const ItemCardapioSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    nome: { type: String, required: true },
    descricao: String,
    preco: { type: Number, required: true },
    categoria: { type: String, default: 'Geral' },
    imagem: String,
    disponivel: { type: Boolean, default: true },
    estoque: { type: Number, default: 999 },
    estoqueMinimo: { type: Number, default: 10 },
    vendidos: { type: Number, default: 0 }
}, { timestamps: true });

// PEDIDO
const PedidoSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    clienteNome: String,
    clienteTelefone: { type: String, required: true },
    clienteEndereco: String,
    clienteComplemento: String,
    itens: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemCardapio' },
        nome: String,
        quantidade: Number,
        preco: Number,
        observacao: String
    }],
    subtotal: Number,
    taxaEntrega: Number,
    total: Number,
    formaPagamento: { type: String, default: 'dinheiro' },
    troco: Number,
    status: {
        type: String,
        enum: ['novo', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'],
        default: 'novo'
    },
    entregadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entregador' },
    entregadorNome: String,
    tempoEstimado: Number,
    observacao: String,
    avaliacaoCliente: Number,
    motivoCancelamento: String
}, { timestamps: true });

// ENTREGADOR
const EntregadorSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    nome: { type: String, required: true },
    telefone: { type: String, required: true },
    veiculo: { type: String, default: 'moto' },
    placa: String,
    status: { type: String, enum: ['disponivel', 'em_entrega', 'offline'], default: 'offline' },
    ativo: { type: Boolean, default: true },
    latitude: Number,
    longitude: Number,
    entregas: { type: Number, default: 0 }
}, { timestamps: true });

// CLIENTE
const ClienteSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    nome: String,
    telefone: { type: String, required: true },
    endereco: String,
    complemento: String,
    pedidos: { type: Number, default: 0 },
    ultimoPedido: Date
}, { timestamps: true });

// CONVERSA (estado do chat WhatsApp)
const ConversaSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    telefone: { type: String, required: true },
    etapa: { type: String, default: 'inicio' },
    dados: { type: mongoose.Schema.Types.Mixed, default: {} },
    carrinho: [{
        itemId: mongoose.Schema.Types.ObjectId,
        nome: String,
        quantidade: Number,
        preco: Number,
        observacao: String
    }],
    ultimaMensagem: Date
}, { timestamps: true });

module.exports = {
    Admin: mongoose.model('Admin', AdminSchema),
    ItemCardapio: mongoose.model('ItemCardapio', ItemCardapioSchema),
    Pedido: mongoose.model('Pedido', PedidoSchema),
    Entregador: mongoose.model('Entregador', EntregadorSchema),
    Cliente: mongoose.model('Cliente', ClienteSchema),
    Conversa: mongoose.model('Conversa', ConversaSchema)
};
