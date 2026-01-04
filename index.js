import express from "express";

const app = express();

// rota raiz obrigatória
app.get("/", (req, res) => {
  res.status(200).send("🚀 WhatsApp Delivery AI ONLINE");
});

// PORTA (Railway ou Local)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});
