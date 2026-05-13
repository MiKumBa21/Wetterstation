import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

const API_URL = "http://192.168.0.50/data";

interface WeatherData {
  temp: number | null;
  hygro: number | null;
  lighting: number | null;
  uv: number | null;
}

const createChartData = (value: number | null) => [
  { name: "value", value: value ?? 0 },
];

// 🔹 Farben pro Seite
const pageColors: Record<string, string> = {
  "/": "linear-gradient(90deg, #168ed8, #06cef1)",
  "/temperatur": "linear-gradient(90deg, #ef4444, #f97316)",
  "/luft": "linear-gradient(90deg, #3b82f6, #06cef1)",
  "/licht": "linear-gradient(90deg, #f59e0b, #fde047)",
  "/uv": "linear-gradient(90deg, #22c55e, #4adea8)",
};

// 🔹 TOPBAR
function Topbar({ title, color, onRefresh }: any) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div className="topbar" style={{ background: color }}>
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <h1>{title}</h1>
        <button onClick={onRefresh}>↻</button>
      </div>

      {menuOpen && (
        <div className="menu">
          <h2>Menü</h2>

          <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Dashboard</Link>
          <Link to="/temperatur" onClick={() => setMenuOpen(false)}>🌡️ Temperatur</Link>
          <Link to="/luft" onClick={() => setMenuOpen(false)}>💧 Luft</Link>
          <Link to="/licht" onClick={() => setMenuOpen(false)}>💡 Licht</Link>
          <Link to="/uv" onClick={() => setMenuOpen(false)}>☀️ UV</Link>
        </div>
      )}
    </div>
  );
}

// 🔹 DASHBOARD
function Dashboard({ data, fetchData, loading }: any) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <div className="topbar">
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <h1>Wetterstation</h1>
        <button onClick={fetchData}>↻</button>
      </div>

      {menuOpen && (
        <div className="menu">
          <h2>Menü</h2>

          <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Dashboard</Link>
          <Link to="/temperatur" onClick={() => setMenuOpen(false)}>🌡️ Temperatur</Link>
          <Link to="/luft" onClick={() => setMenuOpen(false)}>💧 Luft</Link>
          <Link to="/licht" onClick={() => setMenuOpen(false)}>💡 Licht</Link>
          <Link to="/uv" onClick={() => setMenuOpen(false)}>☀️ UV</Link>
        </div>
      )}

      <div className="grid">

        <Link to="/temperatur" className="card">
          <h2>🌡️ Temperatur</h2>
          <RadialBarChart width={200} height={120} cx="50%" cy="100%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={createChartData(data.temp)}>
            <PolarAngleAxis type="number" domain={[0, 50]} tick={false} />
            <RadialBar dataKey="value" fill="#ef4444" />
          </RadialBarChart>
          <div className="value">{data.temp} °C</div>
        </Link>

        <Link to="/luft" className="card">
          <h2>💧 Luftfeuchtigkeit</h2>
          <RadialBarChart width={200} height={120} cx="50%" cy="100%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={createChartData(data.hygro)}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" fill="#3b82f6" />
          </RadialBarChart>
          <div className="value">{data.hygro} %</div>
        </Link>

        <Link to="/licht" className="card">
          <h2>💡 Licht</h2>
          <RadialBarChart width={200} height={120} cx="50%" cy="100%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={createChartData(data.lighting)}>
            <PolarAngleAxis type="number" domain={[0, 1000]} tick={false} />
            <RadialBar dataKey="value" fill="#f59e0b" />
          </RadialBarChart>
          <div className="value">{data.lighting} lx</div>
        </Link>

        <Link to="/uv" className="card">
          <h2>☀️ UV Index</h2>
          <RadialBarChart width={200} height={120} cx="50%" cy="100%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={createChartData(data.uv)}>
            <PolarAngleAxis type="number" domain={[0, 11]} tick={false} />
            <RadialBar dataKey="value" fill="#22c55e" />
          </RadialBarChart>
          <div className="value">{data.uv}</div>
        </Link>

      </div>

      {loading && <p style={{ textAlign: "center" }}>Aktualisiere...</p>}
    </div>
  );
}

// 🔹 DETAIL
function Detail({ title, value, unit }: any) {
  const location = useLocation();
  const color = pageColors[location.pathname] || "#168ed8";

  return (
    <div>
      <Topbar title={title} color={color} onRefresh={() => { }} />

      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>{value} {unit}</h2>
        <p>blabla</p>
        <Link to="/" className="back-link">⬅ Zurück</Link>
      </div>
    </div>
  );
}

// 🔹 MAIN APP
export default function Wetterstation() {

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  // 🌙 DARK MODE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));

    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  const [data, setData] = useState<WeatherData>({
    temp: 23,
    hygro: 55,
    lighting: 300,
    uv: 6,
  });

  const WIFI_API = import.meta.env.DEV ? "http://localhost:3001" : "";
  const [networks, setNetworks] = useState<any[]>([]);
  const [currentWifi, setCurrentWifi] = useState<any>(null);
  const [wifiLoading, setWifiLoading] = useState(false);
  const [wifiError, setWifiError] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState("");

  const parseResponse = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const loadWifi = async () => {
    try {
      setWifiLoading(true);
      setWifiError(null);

      const res = await fetch(`${WIFI_API}/wifi`);
      const payload = await parseResponse(res);

      if (!res.ok) {
        const message = typeof payload === "string"
          ? payload
          : payload?.error || "Scan fehlgeschlagen";
        throw new Error(message);
      }

      if (!Array.isArray(payload)) {
        throw new Error(
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload)
        );
      }

      setNetworks(payload);
    } catch (err: any) {
      console.log(err);
      setWifiError(err?.message || "WLAN konnte nicht geladen werden.");
    } finally {
      setWifiLoading(false);
    }
  };

  const loadCurrentWifi = async () => {
    try {
      const res = await fetch(`${WIFI_API}/wifi/current`);
      const payload = await parseResponse(res);

      if (res.ok && payload && typeof payload === "object") {
        setCurrentWifi(payload);
      } else if (!res.ok) {
        console.log("Current WiFi load failed:", payload);
      }
    } catch (err) {
      console.log("Error loading current WiFi:", err);
    }
  };

  useEffect(() => {
    loadCurrentWifi();
    const interval = setInterval(() => {
      loadCurrentWifi();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const connectWifi = async (ssid: string, password: string | null = null) => {
    if (!ssid) return;

    try {
      const res = await fetch(`${WIFI_API}/wifi/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Verbindung fehlgeschlagen");
      }

      alert("Verbunden mit " + ssid);
      setPasswordModal(null);
      setPasswordInput("");
      await loadWifi();
    } catch (err: any) {
      console.log(err);
      alert(err?.message || "Verbindung fehlgeschlagen");
    }
  };

  const handleConnectClick = (ssid: string) => {
    // Passwort-Modal öffnen (Benutzer kann leeres Passwort eingeben = offenes Netzwerk)
    setPasswordModal(ssid);
    setPasswordInput("");
  };

  const [loading, setLoading] = useState(false);


  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const newData = await res.json();
      setData(newData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ fontSize: `${fontSize}px` }}>
      <Router>
        <Routes>

          <Route path="/" element={
            <Dashboard data={data} fetchData={fetchData} loading={loading} />
          } />

          <Route path="/temperatur" element={<Detail title="🌡️ Temperatur" value={data.temp} unit="°C" />} />
          <Route path="/luft" element={<Detail title="💧 Luftfeuchtigkeit" value={data.hygro} unit="%" />} />
          <Route path="/licht" element={<Detail title="💡 Licht" value={data.lighting} unit="lx" />} />
          <Route path="/uv" element={<Detail title="☀️ UV Index" value={data.uv} unit="" />} />

        </Routes>
      </Router>

      {/* ⚙️ BUTTON */}
      <button className="settings-btn" onClick={() => {
        setSettingsOpen(true);
        loadWifi();
        loadCurrentWifi();
      }}>
        ⚙️
      </button>

      {/* ⚙️ SETTINGS */}
      {settingsOpen && (
        <div className="settings-overlay">
          <div className="settings-modal">

            <h2>Einstellungen</h2>

            <div className="setting">
              <label>🌙 Dark Mode</label>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            </div>

            <div className="setting">
              <label>Schriftgröße</label>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>



            <div className="setting">
              <label>📶 WLAN Netzwerke</label>

              {currentWifi && currentWifi.connected && (
                <div className="current-wifi">
                  <strong>Verbunden:</strong> {currentWifi.ssid}
                </div>
              )}

              <div className="wifi-control-row">
                <button className="wifi-scan-btn" onClick={loadWifi}>
                  Netzwerke aktualisieren
                </button>
                <span className="wifi-status">
                  {wifiLoading
                    ? networks.length > 0
                      ? "Aktualisiere..."
                      : "Suche nach WLANs..."
                    : networks.length
                    ? `${networks.length} Netzwerk${networks.length === 1 ? "" : "e"}`
                    : "keine Netzwerke gefunden"}
                </span>
              </div>

              {wifiError && <div className="wifi-error">{wifiError}</div>}

              <div className="wifi-list">
                {networks.length === 0 ? (
                  <div className="wifi-empty">
                    {wifiLoading ? "Suche nach WLANs..." : "Keine WLANs in Reichweite."}
                  </div>
                ) : (
                  networks
                    .sort((a, b) => b.signal_level - a.signal_level)
                    .slice(0, 5)
                    .map((wifi, index) => (
                      <div key={`${wifi.ssid}-${index}`} className="wifi-card">
                        <div className="wifi-header">
                          <div className="wifi-name">{wifi.ssid === "--" ? "Versteckt" : wifi.ssid || "Unbekannt"}</div>
                          <div className="wifi-meta">📶 {wifi.signal_level}%</div>
                        </div>
                        <button className="wifi-connect-btn" onClick={() => handleConnectClick(wifi.ssid)}>
                          🔗 Verbinden
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* 🔐 PASSWORD MODAL */}
            {passwordModal && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
              }}>
                <div style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "10px",
                  minWidth: "300px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}>
                  <h3>Passwort für "{passwordModal}"</h3>
                  <p style={{ fontSize: "12px", color: "#666" }}>Lass das Feld leer, wenn das Netzwerk offen ist</p>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        connectWifi(passwordModal, passwordInput || null);
                      }
                    }}
                    placeholder="Passwort eingeben..."
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      boxSizing: "border-box",
                    }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        setPasswordModal(null);
                        setPasswordInput("");
                      }}
                      style={{ padding: "8px 12px", borderRadius: "5px", border: "1px solid #ccc", cursor: "pointer" }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => connectWifi(passwordModal, passwordInput || null)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "5px",
                        background: "#168ed8",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Verbinden
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => setSettingsOpen(false)} style={{ borderRadius: '5px' }}>
              Schließen
            </button>

          </div>
        </div>
      )}
    </div>
  );
}