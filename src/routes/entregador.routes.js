const express = require('express');
const router = express.Router();
const { Entregador } = require('../models');

router.get('/:adminId', async (req, res) => {
    const entregadores = await Entregador.find({ adminId: req.params.adminId, ativo: true });
    res.json(entregadores);
});

router.post('/', async (req, res) => {
    const entregador = await Entregador.create(req.body);
    res.json({ sucesso: true, entregador });
});

module.exports = router;
