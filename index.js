import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

const app = express();
const PORT = process.env.PORT || 3000;

// rota raiz (Railway / navegador)
app.get("/", (req, res) => {
  res.send("🚀 WhatsApp Delivery AI ONLINE");
});

// inicia servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SaaS rodando na porta ${PORT}`);
});

// ============================
// WHATSAPP WEB (QR CODE)
// ============================
async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📲 Escaneie o QR Code abaixo:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Conexão fechada. Reconectar?", shouldReconnect);

      if (shouldReconnect) {
        startWhatsApp();
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado com sucesso!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    console.log("📩 Mensagem recebida:", texto);
  });
}

startWhatsApp();
