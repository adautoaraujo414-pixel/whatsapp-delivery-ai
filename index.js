import express from "express";

const app = express();

// rota raiz obrigatória
app.get("/", (req, res) => {
  res.status(200).send("🚀 WhatsApp Delivery AI ONLINE");
});

// Railway SEMPRE injeta a porta via variável de ambiente
const PORT = process.env.PORT;

// segurança: se não tiver PORT, mostra erro claro no log
if (!PORT) {
  console.error("❌ ERRO: PORT não definida pelo Railway");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando corretamente na porta ${PORT}`);
});
