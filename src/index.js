// ===============================
// IMPORTS (ES MODULE)
// ===============================
import express from "express";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

// ===============================
// EXPRESS (OBRIGATÓRIO NO RAILWAY)
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// WHATSAPP CLIENT
// ===============================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu"
    ]
  }
});

// ===============================
// EVENTOS DO WHATSAPP
// ===============================
client.on("qr", (qr) => {
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
});

client.on("message", (msg) => {
  if (msg.body.toLowerCase() === "oi") {
    msg.reply("Olá! 🤖 Atendimento automático ativo.");
  }
});

// ===============================
// INICIALIZA WHATSAPP
// ===============================
client.initialize();

// ===============================
// ROTAS HTTP (RAILWAY)
// ===============================
app.get("/", (req, res) => {
  res.send("WhatsApp Delivery AI rodando 🚀");
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
