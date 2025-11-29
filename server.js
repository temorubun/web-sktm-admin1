// ===============================
//  KaweNia Arsip • Express Server
// ===============================

const express = require("express");
const path = require("path");
const app = express();

// ==== Middleware untuk JSON ====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==== Folder Static ====
app.use(express.static(path.join(__dirname, "public")));  
// artinya file HTML/CSS/JS Anda berada di folder: public/

// ==== Halaman utama ====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ==== Jalankan server ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
