const express = require('express');
const router = express.Router();
const { Pedido } = require('../models');

router.get('/:adminId', async (req, res) => {
    const { status } = req.query;
    const query = { adminId: req.params.adminId };
    if (status) query.status = status;
    const pedidos = await Pedido.find(query).sort('-createdAt').limit(50);
    res.json(pedidos);
});

router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ sucesso: true, pedido });
});

module.exports = router;
