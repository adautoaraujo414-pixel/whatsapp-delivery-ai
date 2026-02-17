const express = require('express');
const router = express.Router();
const { ItemCardapio } = require('../models');

router.get('/:adminId', async (req, res) => {
    try {
        const itens = await ItemCardapio.find({ adminId: req.params.adminId, disponivel: true }).sort('categoria');
        res.json(itens);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.post('/', async (req, res) => {
    try {
        const item = await ItemCardapio.create(req.body);
        res.json({ sucesso: true, item });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const item = await ItemCardapio.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ sucesso: true, item });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await ItemCardapio.findByIdAndDelete(req.params.id);
        res.json({ sucesso: true });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

module.exports = router;
