const express = require('express');
const router = express.Router();
const whatsapp = require('../services/whatsapp.service');

router.get('/status', (req, res) => {
    res.json(whatsapp.getStatus());
});

router.post('/conectar', async (req, res) => {
    try {
        if (whatsapp.status === 'conectado') return res.json({ sucesso: true, msg: 'Já conectado', status: whatsapp.getStatus() });
        whatsapp.reconectar = true;
        whatsapp.tentativas = 0;
        await whatsapp.conectar();
        let t = 0;
        await new Promise(r => { const c = setInterval(() => { t++; if (whatsapp.qrCode || whatsapp.status === 'conectado' || t > 30) { clearInterval(c); r(); } }, 500); });
        res.json({ sucesso: true, status: whatsapp.getStatus() });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.post('/desconectar', async (req, res) => {
    try { await whatsapp.desconectar(); res.json({ sucesso: true, msg: 'Desconectado' }); }
    catch (e) { res.status(500).json({ erro: e.message }); }
});

router.post('/enviar', async (req, res) => {
    try { const { telefone, mensagem } = req.body; await whatsapp.enviarMensagem(telefone, mensagem); res.json({ sucesso: true }); }
    catch (e) { res.status(500).json({ erro: e.message }); }
});

module.exports = router;
