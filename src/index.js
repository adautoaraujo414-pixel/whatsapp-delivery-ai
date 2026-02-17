require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/cardapio', require('./routes/cardapio.routes'));
app.use('/api/pedidos', require('./routes/pedido.routes'));
app.use('/api/entregadores', require('./routes/entregador.routes'));
app.use('/api/config', require('./routes/config.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp.routes'));

// Páginas
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/login.html')));
app.get('/cozinha', (req, res) => res.sendFile(path.join(__dirname, 'public/cozinha/index.html')));
app.get('/entregador', (req, res) => res.sendFile(path.join(__dirname, 'public/entregador/index.html')));

app.get('/', (req, res) => {
    res.json({ nome: 'ZapFacil Delivery', versao: '1.0.0', status: 'online', rotas: { admin: '/admin', cozinha: '/cozinha', entregador: '/entregador', login: '/login' } });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado!'))
    .catch(e => console.log('❌ MongoDB erro:', e.message));

app.listen(PORT, '0.0.0.0', () => {
    console.log('🍕 ZapFacil Delivery v1.0.0');
    console.log('📡 Porta:', PORT);
    console.log('🍳 Cozinha: /cozinha');
    console.log('🛵 Entregador: /entregador');
    console.log('⚙️  Admin: /admin');
    console.log('📱 WhatsApp: /api/whatsapp/status');
});
