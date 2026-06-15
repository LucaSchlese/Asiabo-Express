let products=[];
let cart=[];

function euro(v){return v.toLocaleString("de-DE")+" $"}

async function loadData(){
  try{
    products = await (await fetch("/api/products")).json();
    const factions = await (await fetch("/api/factions")).json();

    document.getElementById("fraktion").innerHTML =
      '<option value="">Fraktion auswählen</option>' +
      factions.map(f=>`<option value="${f}">${f}</option>`).join("");

    renderProducts();
    renderCart();

    const me = await (await fetch("/api/admin/me")).json();
    if(me.admin){
      document.body.classList.add("owner");
      enterAsVisitor();
      showOrders();
    }
  }catch{
    alert("Server nicht erreichbar. Prüfe Render.");
  }
}

function enterAsVisitor(){
  document.body.classList.remove("locked");
  document.getElementById("loginScreen").style.display="none";
}

async function enterAsOwner(){
  const password=document.getElementById("ownerPassword").value;

  const res = await fetch("/api/admin/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password})
  });

  const data = await res.json();

  if(!res.ok){
    alert(data.error || "Login fehlgeschlagen.");
    return;
  }

  document.body.classList.add("owner");
  enterAsVisitor();
  showOrders();
}

async function logout(){
  await fetch("/api/admin/logout",{method:"POST"});
  document.body.classList.remove("owner");
  document.body.classList.add("locked");
  document.getElementById("loginScreen").style.display="flex";
  document.getElementById("ownerPassword").value="";
  document.getElementById("orders").innerHTML="";
  location.href="#start";
}

function renderProducts(){
  document.getElementById("productList").innerHTML=products.map(p=>`
    <div class="card">
      <div class="pic">${p.icon}</div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">${euro(p.price)}</div>
      <button onclick="addToCart(${p.id})">In den Warenkorb</button>
    </div>
  `).join("");
}

function addToCart(id){
  const p=products.find(x=>x.id===id);
  cart.push(p);
  renderCart();
}

function removeFromCart(i){
  cart.splice(i,1);
  renderCart();
}

function renderCart(){
  const box=document.getElementById("cartItems");
  if(cart.length===0){
    box.innerHTML="<p>Dein Warenkorb ist leer.</p>";
  }else{
    box.innerHTML=cart.map((p,i)=>`
      <div class="cart-item">
        <div><b>${p.name}</b><br>${euro(p.price)}</div>
        <button onclick="removeFromCart(${i})">Entfernen</button>
      </div>
    `).join("");
  }
  const total=cart.reduce((s,p)=>s+p.price,0);
  document.getElementById("cartTotal").textContent=euro(total);
}

document.getElementById("orderForm").addEventListener("submit",async function(e){
  e.preventDefault();

  if(cart.length===0){
    alert("Bitte zuerst ein Paket auswählen.");
    return;
  }

  const payload={
    name:document.getElementById("name").value,
    phone:document.getElementById("telefon").value,
    faction:document.getElementById("fraktion").value,
    factionPassword:document.getElementById("fraktionspasswort").value,
    productIds:cart.map(p=>p.id)
  };

  const res=await fetch("/api/order",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });

  const data=await res.json();

  if(!res.ok){
    alert(data.error || "Bestellung fehlgeschlagen.");
    return;
  }

  alert(data.message + " Nummer: " + data.number);
  cart=[];
  renderCart();
  this.reset();

  if(document.body.classList.contains("owner")){
    showOrders();
  }
});

async function showOrders(){
  const res=await fetch("/api/admin/orders");
  const data=await res.json();

  if(!res.ok){
    alert(data.error || "Nur Inhaber können Bestellungen ansehen.");
    return;
  }

  const div=document.getElementById("orders");

  if(data.length===0){
    div.innerHTML="<p>Noch keine Bestellungen vorhanden.</p>";
    return;
  }

  div.innerHTML=data.map(o=>`
    <div class="order-card">
      <h3>Bestellung ${o.number}</h3>
      <p><b>Datum:</b> ${o.created_at}</p>
      <p><b>Name:</b> ${o.name}</p>
      <p><b>Fraktion:</b> ${o.faction}</p>
      <p><b>Telefon:</b> ${o.phone}</p>
      <p><b>Pakete:</b> ${o.products.map(p=>p.name).join(", ")}</p>
      <p><b>Gesamt:</b> ${euro(o.total)}</p>
      <p><b>Status:</b> ${o.status}</p>
    </div>
  `).join("");
}

async function deleteOrders(){
  if(!confirm("Alle Bestellungen wirklich löschen?")) return;

  const res=await fetch("/api/admin/orders",{method:"DELETE"});
  const data=await res.json();

  if(!res.ok){
    alert(data.error || "Löschen fehlgeschlagen.");
    return;
  }

  document.getElementById("orders").innerHTML="<p>Bestellungen gelöscht.</p>";
}

loadData();
