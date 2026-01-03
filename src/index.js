const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

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

client.initialize();

// Servidor HTTP (obrigatório no Railway)
app.get("/", (req, res) => {
  res.send("WhatsApp Delivery AI rodando 🚀");
});

app.listen(PORT, () => {
 console.log(`Servidor rodando na porta ${PORT}`);

});
