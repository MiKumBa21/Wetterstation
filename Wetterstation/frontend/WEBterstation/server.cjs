const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================
   ⚠️ RASPBERRY PI SETUP
   
   Für Raspberry Pi (Linux) benötigt:
   - nmcli (NetworkManager) muss installiert sein
   - Node.js muss als root/sudo laufen für WiFi-Befehle
   
   Start mit: sudo node server.cjs
   
   Installation von nmcli (falls nicht vorhanden):
   sudo apt-get install network-manager
========================================= */

/* =========================================
   📶 WLAN SCAN (zeigt mehrere Netzwerke)
========================================= */
app.get("/wifi", (req, res) => {
  console.log("📡 WLAN Scan gestartet...");

  exec("nmcli device wifi list --rescan yes", (err, stdout) => {
    if (err) {
      console.error("Scan Fehler:", err);
      return res.status(500).json({ error: "WLAN Scan fehlgeschlagen" });
    }

    const networks = parseLinuxWifi(stdout);

    // 🔥 nur Top 3 nach Signal
    const sorted = networks
      .sort((a, b) => b.signal_level - a.signal_level)
      .slice(0, 3);

    res.json(sorted);
  });
});

/* =========================================
   🧠 PARSER (Linux nmcli -> JSON)
========================================= */
function parseLinuxWifi(output) {
  const networks = [];
  const lines = output.split("\n").slice(1); // Skip header

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    
    if (parts.length >= 7) {
      // Format: SSID BSSID MODE CHAN RATE SIGNAL BARS SECURITY
      // Signal ist die Spalte vor BARS
      const signal = parseInt(parts[parts.length - 3]);
      const ssid = parts.slice(0, parts.length - 6).join(" ");

      if (ssid && !isNaN(signal)) {
        networks.push({
          ssid: ssid.trim(),
          signal_level: signal,
        });
      }
    }
  }

  return networks;
}

/* =========================================
   🔗 WLAN CONNECT
========================================= */
app.post("/wifi/connect", (req, res) => {
  const { ssid } = req.body;

  if (!ssid) {
    return res.status(400).json({ error: "SSID fehlt" });
  }

  console.log("🔗 Verbinde mit:", ssid);

  // Hinweis: Passwort-Handling würde hier erforderlich sein
  exec(`nmcli device wifi connect "${ssid}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("Connect Fehler:", stderr || err.message);
      return res.status(500).json({
        error: "Verbindung fehlgeschlagen",
        details: stderr || err.message,
      });
    }

    res.json({
      status: "connected",
      ssid,
    });
  });
});

/* =========================================
   🔻 WLAN TRENNEN
========================================= */
app.post("/wifi/disconnect", (req, res) => {
  exec("nmcli device disconnect", (err) => {
    if (err) {
      console.error("Disconnect Fehler:", err);
      return res.status(500).json({ error: "Trennen fehlgeschlagen" });
    }

    res.json({ status: "disconnected" });
  });
});

/* =========================================
   🌐 SERVER (WICHTIG für WLAN Zugriff)
========================================= */
app.listen(3001, "0.0.0.0", () => {
  console.log("🚀 Server läuft:");
  console.log("   http://localhost:3001");
  console.log("   http://DEINE-IP:3001 (WLAN)");
});