const axios = require('axios');

const API = process.env.EVOLUTION_API_URL || 'https://evolution-api-ubmax.onrender.com';
const KEY = process.env.EVOLUTION_API_KEY || 'UbmaxEvolution2024';
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'zapfacil';

const headers = { apikey: KEY, 'Content-Type': 'application/json' };

class WhatsAppService {
    constructor() {
        this.status = 'desconectado';
        this.qrCode = null;
        this.numero = null;
    }

    async criarInstancia() {
        try {
            const webhookUrl = process.env.APP_URL || 'https://zapfacil-delivery.onrender.com';
            const res = await axios.post(API + '/instance/create', {
                instanceName: INSTANCE,
                integration: 'WHATSAPP-BAILEYS',
                qrcode: true,
                webhook: {
                    url: webhookUrl + '/api/whatsapp/webhook',
                    byEvents: false,
                    base64: false,
                    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
                }
            }, { headers });
            console.log('✅ Instância criada:', INSTANCE);
            return res.data;
        } catch (e) {
            if (e.response?.status === 403 || e.response?.data?.error?.includes('already')) {
                console.log('ℹ️ Instância já existe:', INSTANCE);
                return { exists: true };
            }
            console.error('❌ Erro criar instância:', e.response?.data || e.message);
            throw e;
        }
    }

    async conectar() {
        try {
            // Tenta criar instância primeiro
            await this.criarInstancia();

            // Busca QR Code
            const res = await axios.get(API + '/instance/connect/' + INSTANCE, { headers });
            const data = res.data;

            if (data.base64) {
                this.qrCode = data.base64;
                this.status = 'aguardando_qr';
                console.log('📱 QR Code gerado via Evolution!');
            } else if (data.instance?.state === 'open') {
                this.status = 'conectado';
                this.qrCode = null;
            }

            return this.getStatus();
        } catch (e) {
            console.error('❌ Erro conectar:', e.response?.data || e.message);
            throw e;
        }
    }

    async verificarStatus() {
        try {
            const res = await axios.get(API + '/instance/connectionState/' + INSTANCE, { headers });
            const state = res.data?.instance?.state || res.data?.state;

            if (state === 'open') {
                this.status = 'conectado';
                this.qrCode = null;
                // Buscar número
                try {
                    const info = await axios.get(API + '/instance/fetchInstances', { headers, params: { instanceName: INSTANCE } });
                    const inst = Array.isArray(info.data) ? info.data[0] : info.data;
                    this.numero = inst?.instance?.owner?.split(':')[0] || inst?.owner || '';
                } catch(e) {}
            } else if (state === 'close' || state === 'connecting') {
                this.status = 'desconectado';
            }

            return this.getStatus();
        } catch (e) {
            this.status = 'desconectado';
            return this.getStatus();
        }
    }

    async desconectar() {
        try {
            await axios.delete(API + '/instance/logout/' + INSTANCE, { headers });
            console.log('🔌 Logout realizado');
        } catch (e) {}
        try {
            await axios.delete(API + '/instance/delete/' + INSTANCE, { headers });
            console.log('🗑️ Instância deletada');
        } catch (e) {}
        this.status = 'desconectado';
        this.qrCode = null;
        this.numero = null;
    }

    async enviarMensagem(telefone, texto) {
        const number = telefone.replace(/\D/g, '');
        const res = await axios.post(API + '/message/sendText/' + INSTANCE, {
            number: number,
            text: texto
        }, { headers });
        return res.data;
    }

    async enviarImagem(telefone, imageUrl, caption = '') {
        const number = telefone.replace(/\D/g, '');
        const res = await axios.post(API + '/message/sendMedia/' + INSTANCE, {
            number: number,
            mediatype: 'image',
            media: imageUrl,
            caption: caption
        }, { headers });
        return res.data;
    }

    processarWebhook(body) {
        const event = body.event;

        if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
            const state = body.data?.state || body.data?.instance?.state;
            if (state === 'open') {
                this.status = 'conectado';
                this.qrCode = null;
                this.numero = body.data?.instance?.owner?.split(':')[0] || '';
                console.log('✅ WhatsApp conectado via webhook!');
            } else if (state === 'close') {
                this.status = 'desconectado';
                console.log('❌ WhatsApp desconectado via webhook');
            }
        }

        if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
            this.qrCode = body.data?.qrcode?.base64 || body.data?.qrcode;
            this.status = 'aguardando_qr';
            console.log('📱 QR Code atualizado via webhook');
        }

        if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
            return body.data;
        }

        return null;
    }

    getStatus() {
        return {
            status: this.status,
            conectado: this.status === 'conectado',
            numero: this.numero,
            qrCode: this.qrCode,
            tentativas: 0
        };
    }
}

module.exports = new WhatsAppService();
