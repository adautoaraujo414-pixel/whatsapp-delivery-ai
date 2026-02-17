const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

router.post('/registro', async (req, res) => {
    try {
        const { nome, email, senha, telefone } = req.body;
        const existe = await Admin.findOne({ email });
        if (existe) return res.status(400).json({ erro: 'Email já cadastrado' });
        const hash = await bcrypt.hash(senha, 10);
        const admin = await Admin.create({ nome, email, senha: hash, telefone });
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ sucesso: true, token, admin: { id: admin._id, nome, email } });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ erro: 'Credenciais inválidas' });
        const ok = await bcrypt.compare(senha, admin.senha);
        if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ sucesso: true, token, admin: { id: admin._id, nome: admin.nome, email: admin.email, restaurante: admin.restaurante, configurado: admin.configurado } });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

module.exports = router;
