const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================
   📶 WLAN SCAN (zeigt mehrere Netzwerke)
========================================= */
app.get("/wifi", (req, res) => {
  console.log("📡 WLAN Scan gestartet...");

  exec("netsh wlan show networks mode=bssid", (err, stdout) => {
    if (err) {
      console.error("Scan Fehler:", err);
      return res.status(500).json({ error: "WLAN Scan fehlgeschlagen" });
    }

    const networks = parseWindowsWifi(stdout);

    // 🔥 nur Top 3 nach Signal
    const sorted = networks
      .sort((a, b) => b.signal_level - a.signal_level)
      .slice(0, 3);

    res.json(sorted);
  });
});

/* =========================================
   🧠 PARSER (Windows netsh -> JSON)
========================================= */
function parseWindowsWifi(output) {
  const networks = [];
  const blocks = output.split("SSID");

  for (let i = 1; i < blocks.length; i++) {
    const block = "SSID" + blocks[i];

    const ssidMatch = block.match(/SSID\s+\d+\s*:\s*(.*)/);
    const signalMatch = block.match(/Signal\s*:\s*(\d+)%/);

    if (ssidMatch) {
      networks.push({
        ssid: ssidMatch[1].trim(),
        signal_level: signalMatch ? parseInt(signalMatch[1]) : 0,
      });
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

  exec(`netsh wlan connect name="${ssid}"`, (err, stdout, stderr) => {
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
  exec("netsh wlan disconnect", (err) => {
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