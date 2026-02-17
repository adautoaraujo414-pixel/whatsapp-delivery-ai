const express = require('express');
const router = express.Router();
const { Admin } = require('../models');

router.get('/:adminId', async (req, res) => {
    const admin = await Admin.findById(req.params.adminId).select('-senha');
    res.json(admin);
});

router.put('/:adminId', async (req, res) => {
    const admin = await Admin.findByIdAndUpdate(req.params.adminId, req.body, { new: true }).select('-senha');
    res.json({ sucesso: true, admin });
});

module.exports = router;
