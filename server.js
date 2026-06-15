const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database("asiabo.db");

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  faction TEXT NOT NULL,
  products TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Offen'
);
`);

const products = [
  {id:1,name:"Sakura Paket",desc:"Kleines Lieferpaket mit Alltagswaren.",price:2500,icon:"🌸"},
  {id:2,name:"Dragon Paket",desc:"Großes Premium-Paket für besondere Bestellungen.",price:7500,icon:"🐉"},
  {id:3,name:"Bambus Paket",desc:"Solides Standardpaket für regelmäßige Lieferungen.",price:4200,icon:"🎋"},
  {id:4,name:"Neon Tokyo Paket",desc:"Modernes Paket mit Technik- und Zubehörwaren.",price:5900,icon:"🏮"},
  {id:5,name:"Kaiser Paket",desc:"Exklusive Lieferung mit bevorzugter Bearbeitung.",price:12000,icon:"👑"},
  {id:6,name:"Express Lieferung",desc:"Schnelle Zustellung mit bevorzugter Bearbeitung.",price:3000,icon:"🚚"}
];

function getFactionPasswords(){
  try{
    return JSON.parse(process.env.FACTIONS_JSON || "{}");
  }catch{
    return {};
  }
}

function getAdminPassword(){
  return process.env.ADMIN_PASSWORD || "";
}

function clean(value, max = 120){
  return String(value || "").trim().slice(0, max);
}

function requireAdmin(req, res, next){
  if(req.session && req.session.role === "admin"){
    next();
  }else{
    res.status(401).json({error:"Nicht eingeloggt."});
  }
}

app.use(helmet({contentSecurityPolicy:false}));
app.use(cors());
app.use(express.json({limit:"100kb"}));
app.use(session({
  secret: process.env.SESSION_SECRET || "Bitte-in-Render-aendern",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly:true, sameSite:"lax" }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/products", (req,res)=>res.json(products));

app.get("/api/factions", (req,res)=>{
  res.json(Object.keys(getFactionPasswords()));
});

app.post("/api/order", async (req,res)=>{
  const passwords = getFactionPasswords();

  const name = clean(req.body.name);
  const phone = clean(req.body.phone);
  const faction = clean(req.body.faction);
  const factionPassword = String(req.body.factionPassword || "");
  const productIds = Array.isArray(req.body.productIds) ? req.body.productIds : [];

  if(!name || !phone || !faction || !factionPassword){
    return res.status(400).json({error:"Bitte alle Felder ausfüllen."});
  }

  if(!passwords[faction]){
    return res.status(403).json({error:"Diese Fraktion ist nicht freigeschaltet."});
  }

  if(passwords[faction] !== factionPassword){
    return res.status(403).json({error:"Falsches Fraktionspasswort."});
  }

  const selected = productIds.map(id=>products.find(p=>p.id===Number(id))).filter(Boolean);

  if(selected.length === 0){
    return res.status(400).json({error:"Bitte zuerst ein Paket auswählen."});
  }

  const number = "AX-" + Date.now();
  const created = new Date().toLocaleString("de-DE");
  const total = selected.reduce((sum,p)=>sum+p.price,0);

  db.prepare(`
    INSERT INTO orders (number, created_at, name, phone, faction, products, total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(number, created, name, phone, faction, JSON.stringify(selected), total, "Offen");

  res.json({success:true, message:"Bestellung wurde gespeichert.", number});
});

app.post("/api/admin/login", async (req,res)=>{
  const password = String(req.body.password || "");
  const adminPassword = getAdminPassword();

  if(!adminPassword || password !== adminPassword){
    return res.status(403).json({error:"Falsches Admin-Passwort."});
  }

  req.session.role = "admin";
  res.json({success:true});
});

app.post("/api/admin/logout", (req,res)=>{
  req.session.destroy(()=>res.json({success:true}));
});

app.get("/api/admin/me", (req,res)=>{
  res.json({admin: req.session && req.session.role === "admin"});
});

app.get("/api/admin/orders", requireAdmin, (req,res)=>{
  const rows = db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  const orders = rows.map(row => ({
    ...row,
    products: JSON.parse(row.products)
  }));
  res.json(orders);
});

app.delete("/api/admin/orders", requireAdmin, (req,res)=>{
  db.prepare("DELETE FROM orders").run();
  res.json({success:true});
});

app.listen(PORT, ()=>console.log("Asiabo Express läuft auf Port " + PORT));
