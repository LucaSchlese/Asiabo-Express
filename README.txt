ASIABO EXPRESS - SICHERE BACKEND VERSION

Diese Version behebt:
- Passwörter nicht mehr im HTML-Quelltext
- Bestellungen nicht mehr im Browser-localStorage
- echter Admin-Login über Server-Session
- SQLite-Datenbank asiabo.db

GitHub-Dateien:
server.js
package.json
public/index.html
public/style.css
public/script.js

Render:
Language: Node
Build Command: npm install
Start Command: node server.js

Environment Variables bei Render:

ADMIN_PASSWORD
DEIN_ADMIN_PASSWORT

SESSION_SECRET
irgendein-langer-zufallstext

FACTIONS_JSON
{"Vindicta": "VIN2026", "Falkenberg": "FAL2026", "Sicario Cartel": "SIC2026", "Organizazia": "ORG2026", "Los Carronero": "LOS2026", "La Manada": "MAN2026", "Familie Caravelli": "CAR2026", "Tuzak": "TUZ2026", "La Ombra": "OMB2026", "91 Thugs": "THU2026", "Grove Street": "GRO2026", "Internationals": "INT2026", "Public Enemies": "PUB2026", "Barrio de La Sombra": "BAR2026", "Strawberry Gangster Families": "SGF2026", "Block44": "BLK2026", "Red9Block": "RED2026", "18th Avenue": "AVE2026", "Vinewood Block Gangsters": "VBG2026", "Ravens of Doom": "ROD2026", "Red District MC": "RDM2026", "Trust MC": "TRU2026", "Mortecco MC": "MOR2026", "Noctis": "NOC2026", "Asiatische Botschaft": "ASI2026", "Guerilla Kartel": "GUE2026", "BBG": "BBG2026"}
