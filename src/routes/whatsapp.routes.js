const express = require('express');
const router = express.Router();
const whatsapp = require('../services/whatsapp.service');
const { processarMensagem } = require('../services/bot.service');
const { Admin } = require('../models');

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

router.post('/webhook', async (req, res) => {
    try {
        const msgData = whatsapp.processarWebhook(req.body);
        if (msgData) {
            const msg = Array.isArray(msgData) ? msgData[0] : msgData;
            const key = msg?.key;
            const message = msg?.message;

            if (key && !key.fromMe && message) {
                const telefone = key.remoteJid?.replace('@s.whatsapp.net', '') || '';
                const texto = message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || '';

                if (telefone && texto) {
                    console.log('📩 Msg de ' + telefone + ': ' + texto);
                    const admin = await Admin.findOne();
                    if (admin) {
                        await processarMensagem(telefone, texto, admin._id);
                    }
                }
            }
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
