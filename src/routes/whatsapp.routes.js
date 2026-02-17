const express = require('express');
const router = express.Router();
const whatsapp = require('../services/whatsapp.service');

router.get('/status', async (req, res) => {
    try {
        const status = await whatsapp.verificarStatus();
        res.json(status);
    } catch (e) { res.json(whatsapp.getStatus()); }
});

router.post('/conectar', async (req, res) => {
    try {
        const status = await whatsapp.conectar();
        res.json({ sucesso: true, status });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.post('/desconectar', async (req, res) => {
    try {
        await whatsapp.desconectar();
        res.json({ sucesso: true, msg: 'Desconectado' });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.post('/webhook', (req, res) => {
    try {
        const msgData = whatsapp.processarWebhook(req.body);
        if (msgData) {
            console.log('📩 Webhook msg recebida:', JSON.stringify(msgData).substring(0, 200));
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('Erro webhook:', e.message);
        res.json({ ok: true });
    }
});

router.post('/enviar', async (req, res) => {
    try {
        const { telefone, mensagem } = req.body;
        await whatsapp.enviarMensagem(telefone, mensagem);
        res.json({ sucesso: true });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

module.exports = router;
