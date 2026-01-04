import express from "express";

const app = express();

// rota raiz
app.get("/", (req, res) => {
  res.status(200).send("🚀 WhatsApp Delivery AI ONLINE");
});

// 🚨 PORTA OBRIGATÓRIA DO RAILWAY
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});
