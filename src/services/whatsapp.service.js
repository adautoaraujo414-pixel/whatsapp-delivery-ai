const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.qrCode = null;
        this.status = 'desconectado';
        this.numero = null;
        this.reconectar = true;
        this.tentativas = 0;
        this.maxTentativas = 5;
        this.onMessage = null;
        this.authDir = path.join(process.cwd(), 'auth');
    }

    async conectar() {
        try {
            if (!fs.existsSync(this.authDir)) fs.mkdirSync(this.authDir, { recursive: true });
            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

            this.sock = makeWASocket({
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, { level: 'silent' }) },
                printQRInTerminal: true,
                browser: ['ZapFacil Delivery', 'Chrome', '4.0.0'],
                logger: { level: 'silent', child: () => ({ level: 'silent', info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{}, trace:()=>{}, fatal:()=>{} }) }
            });

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) { this.qrCode = qr; this.status = 'aguardando_qr'; console.log('📱 QR Code gerado!'); }
                if (connection === 'close') {
                    const code = lastDisconnect?.error?.output?.statusCode;
                    console.log('❌ WhatsApp desconectado. Código:', code);
                    this.status = 'desconectado'; this.qrCode = null;
                    if (code === DisconnectReason.loggedOut) {
                        this.reconectar = false;
                        if (fs.existsSync(this.authDir)) fs.rmSync(this.authDir, { recursive: true, force: true });
                    } else if (this.reconectar && this.tentativas < this.maxTentativas) {
                        this.tentativas++;
                        console.log('🔄 Reconectando... (' + this.tentativas + '/' + this.maxTentativas + ')');
                        setTimeout(() => this.conectar(), 3000);
                    }
                }
                if (connection === 'open') {
                    this.status = 'conectado'; this.qrCode = null; this.tentativas = 0;
                    this.numero = this.sock.user?.id?.split(':')[0] || '';
                    console.log('✅ WhatsApp conectado! Número:', this.numero);
                }
            });

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;
                for (const msg of messages) {
                    if (msg.key.fromMe || !msg.message) continue;
                    const telefone = msg.key.remoteJid.replace('@s.whatsapp.net', '');
                    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
                    if (!texto && !msg.message.imageMessage) continue;
                    console.log('📩 Msg de ' + telefone + ': ' + texto);
                    if (this.onMessage) { try { await this.onMessage(telefone, texto, msg); } catch(e) { console.error('Erro msg:', e.message); } }
                }
            });
        } catch (e) { console.error('Erro WhatsApp:', e.message); this.status = 'desconectado'; }
    }

    async enviarMensagem(telefone, texto) {
        if (!this.sock || this.status !== 'conectado') throw new Error('WhatsApp não conectado');
        const jid = telefone.includes('@') ? telefone : telefone + '@s.whatsapp.net';
        await this.sock.sendMessage(jid, { text: texto });
    }

    async desconectar() {
        this.reconectar = false;
        if (this.sock) { await this.sock.logout().catch(() => {}); this.sock = null; }
        this.status = 'desconectado'; this.qrCode = null; this.numero = null;
        if (fs.existsSync(this.authDir)) fs.rmSync(this.authDir, { recursive: true, force: true });
        console.log('🔌 WhatsApp desconectado.');
    }

    getStatus() {
        return { status: this.status, conectado: this.status === 'conectado', numero: this.numero, qrCode: this.qrCode, tentativas: this.tentativas };
    }
}

module.exports = new WhatsAppService();
