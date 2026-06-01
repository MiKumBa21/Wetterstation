import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from "react-router-dom";

const SENSOR_API_URL = "/api/sensors";

interface WeatherData {
  temp: number | null;
  hygro: number | null;
  wind: number | null;
  uv: number | null;
}

interface Sensor {
  sensor_id: number;
  name: string;
  typ: string;
}

interface Typ {
  typ_id: number;
  name: string;
  einheit?: string;
}

const createChartData = (value: number | null) => [
  { name: "value", value: value ?? 0 },
];

// 🔹 Farben pro Seite
const pageColors: Record<string, string> = {
  "/": "linear-gradient(90deg, #168ed8, #06cef1)",
  "/temperatur": "linear-gradient(90deg, #ef4444, #f97316)",
  "/luft": "linear-gradient(90deg, #3b82f6, #06cef1)",
  "/wind": "linear-gradient(90deg, #7c3aed, #a855f7)",
  "/uv": "linear-gradient(90deg, #22c55e, #4adea8)",
};

const getPageColorByType = (name: string) => {
  const t = name.toLowerCase();
  if (t.includes("temp") || t.includes("temperatur")) return pageColors["/temperatur"];
  if (t.includes("hygro") || t.includes("luft") || t.includes("feucht")) return pageColors["/luft"];
  if (t.includes("wind")) return pageColors["/wind"];
  if (t.includes("uv")) return pageColors["/uv"];
  return pageColors["/"];
};

const getChartProps = (name: string, einheit?: string, value?: number | null) => {
  const t = name.toLowerCase();
  if (t.includes("temp") || t.includes("temperatur") || (einheit || "").toLowerCase().includes("c")) {
    return { domain: [0, 50], fill: "#ef4444", unit: "°C" };
  }
  if (t.includes("hygro") || t.includes("feucht") || (einheit || "").toLowerCase().includes("%")) {
    return { domain: [0, 100], fill: "#3b82f6", unit: "%" };
  }
  if (t.includes("uv")) {
    const uv = value ?? 0;
    let fill = "#22c55e";
    if (uv >= 15 && uv < 16) fill = "#A77AE4";
    else if (uv >= 14 && uv < 15) fill = "#9063CD";
    else if (uv >= 13 && uv < 14) fill = "#794CB6";
    else if (uv >= 12 && uv < 13) fill = "#62359F";
    else if (uv >= 11 && uv < 12) fill = "#4B1E88";
    else if (uv >= 10 && uv < 11) fill = "#BF0D3E";
    else if (uv >= 9 && uv < 10) fill = "#DA291C";
    else if (uv >= 8 && uv < 9) fill = "#EF3340";
    else if (uv >= 7 && uv < 8) fill = "#FF8200";
    else if (uv >= 6 && uv < 7) fill = "#ECA154";
    else if (uv >= 5 && uv < 6) fill = "#FFCD00";
    else if (uv >= 4 && uv < 5) fill = "#FCE300";
    else if (uv >= 3 && uv < 4) fill = "#F7EA48";
    else if (uv >= 2 && uv < 3) fill = "#97D700";
    else if (uv >= 1 && uv < 2) fill = "#84BD00";
    else if (uv >= 0 && uv < 1) fill = "#658D1B";
    else fill = "#658D1B"; // Fallback für Werte unter 0 oder unerwartete Eingaben
    return { domain: [0, 11], fill, unit: "" };
  }
  if (t.includes("wind") || t.includes("druck") || (einheit || "").toLowerCase().includes("km/h") || (einheit || "").toLowerCase().includes("m/s")) {
    return { domain: [0, 100], fill: "#7c3aed", unit: "km/h" };
  }
  return { domain: [0, 100], fill: "#888", unit: einheit || "" };
};

// 🔹 TOPBAR
function Topbar({ title, color, onRefresh, types }: any) {
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

          <Link to="/" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          {types && types.length > 0 && (
            <>
              <hr style={{ margin: '10px 0', borderColor: '#d1d5db' }} />
              {types.filter((typ: Typ) => !/(licht|lx|lux)/i.test(typ.name)).map((typ: Typ) => (
                <Link key={typ.typ_id} to={`/typ/${encodeURIComponent(typ.name)}`} onClick={() => setMenuOpen(false)}>
                  {typ.name}
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 🔹 DASHBOARD
function Dashboard({ types, currentValues, fetchData, loading }: any) {
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

          <Link to="/" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          {types && types.length > 0 && (
            <>
              <hr style={{ margin: '10px 0', borderColor: '#d1d5db' }} />
              {types.filter((typ: Typ) => !/(licht|lx|lux)/i.test(typ.name)).map((typ: Typ) => (
                <Link key={typ.typ_id} to={`/typ/${encodeURIComponent(typ.name)}`} onClick={() => setMenuOpen(false)}>
                  {typ.name}
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      <div className="grid">
        {types && types.length > 0 ? (
          types.filter((typ: Typ) => !/(licht|lx|lux)/i.test(typ.name)).map((typ: Typ) => {
            const val = currentValues?.[typ.name] ?? null;
            const props = getChartProps(typ.name, typ.einheit, val);
            return (
              <Link key={typ.typ_id} to={`/typ/${encodeURIComponent(typ.name)}`} className="card">
                <h2>{typ.name}</h2>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                  <RadialBarChart width={250} height={180} cx="50%" cy="75%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={createChartData(val)}>
                    <PolarAngleAxis type="number" domain={props.domain as any} tick={false} />
                    <RadialBar dataKey="value" fill={props.fill} />
                  </RadialBarChart>
                </div>
                <div className="value" style={{ textAlign: 'center' }}>{val ?? "-"} {props.unit}</div>
              </Link>
            );
          })
        ) : (
          <p style={{ textAlign: "center" }}>Keine Typen gefunden.</p>
        )}
      </div>

      {loading && <p style={{ textAlign: "center" }}>Aktualisiere...</p>}
    </div>
  );
}

type HistoryEntry = {
  typ: string;
  einheit: string;
  sensor: string;
  wert: number;
  zeitstempel: string;
};

function TypDetail({ darkMode, types }: { darkMode: boolean; types: Typ[] }) {
  const { typName } = useParams<{ typName: string }>();
  const [zeitraum, setZeitraum] = useState("7tage");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeframes = [
    { key: "7tage", label: "7 Tage" },
    { key: "30tage", label: "30 Tage" },
    { key: "90tage", label: "90 Tage" },
  ];

  const parseResponse = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const fetchHistory = async (range: string) => {
    if (!typName) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/history/${encodeURIComponent(typName)}?zeitraum=${range}`);
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Verlauf konnte nicht geladen werden");
      if (!Array.isArray(payload)) throw new Error("Ungültige Daten vom Server");
      setHistory(payload.map((item: any) => ({
        typ: item.typ,
        einheit: item.einheit,
        sensor: item.sensor,
        wert: typeof item.wert === "number" ? item.wert : Number(item.wert),
        zeitstempel: item.zeitstempel,
      })));
    } catch (err: any) {
      setError(err?.message || "Fehler beim Laden des Verlaufs");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typName) {
      fetchHistory(zeitraum);
    }
  }, [typName, zeitraum]);

  const formattedLabel = typName ? decodeURIComponent(typName) : "";
  const color = getPageColorByType(formattedLabel);

  const formatChartTimestamp = (value: any) => {
    const stringValue = value == null ? "" : String(value);
    const date = new Date(stringValue);
    if (Number.isNaN(date.getTime())) return stringValue;
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const chartData = history.map((item) => ({ label: item.zeitstempel, value: item.wert }));
  const average = history.length > 0 ? history.reduce((sum, item) => sum + item.wert, 0) / history.length : null;
  const axisColor = darkMode ? "#cbd5e1" : "#475569";
  const gridColor = darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.4)";
  const tooltipStyle = {
    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
    borderColor: darkMode ? "#475569" : "#d1d5db",
    color: darkMode ? "#e2e8f0" : "#0f172a",
  };
  const props = getChartProps(formattedLabel, history[0]?.einheit, history[history.length - 1]?.wert ?? null);

  const formatTooltipValue = (value: any, unit: string) => {
    if (value === null || value === undefined) return "-";
    const valueString = String(value);
    return unit ? `${valueString} ${unit}` : valueString;
  };

  return (
    <div>
      <Topbar title={formattedLabel || "Detail"} color={color} onRefresh={() => fetchHistory(zeitraum)} types={types} />
      <div className="detail-container">
        <div className="detail-card">
          <div className="detail-title-row">
            <h2>{formattedLabel || "Unbekannt"}</h2>
            <Link to="/" className="back-link">⬅ Zurück</Link>
          </div>

          <div className="range-selector">
            {timeframes.map((item) => (
              <button
                key={item.key}
                className={zeitraum === item.key ? "range-button active" : "range-button"}
                onClick={() => setZeitraum(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {error && <p className="detail-error">{error}</p>}
          {loading && <p className="detail-loading">Lade Verlauf...</p>}

          {!loading && !error && (
            <div className="history-chart-wrapper">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 10 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: axisColor }}
                      tickLine={{ stroke: axisColor }}
                      minTickGap={20}
                      tickFormatter={formatChartTimestamp}
                    />
                    <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: axisColor }} tickLine={{ stroke: axisColor }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={formatChartTimestamp}
                      formatter={(value: any) => [formatTooltipValue(value, props.unit), ""]}
                      separator=" "
                    />
                    <Line type="monotone" dataKey="value" stroke={props.fill} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: "center", padding: "40px 0" }}>Keine Verlaufdaten verfügbar.</p>
              )}
            </div>
          )}

          <div className="detail-summary">
            <div>
              <strong>Durchschnitt</strong>
              <p>{average !== null ? `${average.toFixed(1)} ${props.unit}` : "-"}</p>
            </div>
            <div>
              <strong>Anzahl Messwerte</strong>
              <p>{history.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔹 DETAIL
function Detail({ title, value, unit, types }: any) {
  const location = useLocation();
  const color = pageColors[location.pathname] || "#168ed8";

  return (
    <div>
      <Topbar title={title} color={color} onRefresh={() => { }} types={types} />

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

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const [data, setData] = useState<WeatherData>({
    temp: null,
    hygro: null,
    wind: null,
    uv: null,
  });
  const [types, setTypes] = useState<Typ[]>([]);
  const [currentValues, setCurrentValues] = useState<Record<string, number | null>>({});
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorError, setSensorError] = useState<string | null>(null);

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

  const matchTypeKey = (typ: string) => {
    const t = typ.toLowerCase();
    if (t.includes("temp") || t.includes("temperatur") || t.includes("°c")) return "temp";
    if (t.includes("hygro") || t.includes("luft") || t.includes("feucht")) return "hygro";
    if (t.includes("wind")) return "wind";
    if (t.includes("uv")) return "uv";
    return null;
  };

  const fetchCurrentValues = async () => {
    try {
      const res = await fetch("/api/aktuell");
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Konnte aktuelle Werte nicht laden");

      // payload expected: array of { typ, einheit, sensor, wert, zeitstempel }
      const newData: WeatherData = { temp: null, hygro: null, wind: null, uv: null };
      const map: Record<string, number | null> = {};
      if (Array.isArray(payload)) {
        payload.forEach((item: any) => {
          const key = matchTypeKey(String(item.typ || ""));
          if (!key) return;
          const val = item.wert;
          if (typeof val === "number") newData[key as keyof WeatherData] = val;
          else if (!isNaN(Number(val))) newData[key as keyof WeatherData] = Number(val);
          // also keep raw map by type name
          const rawVal = (typeof item.wert === 'number') ? item.wert : (!isNaN(Number(item.wert)) ? Number(item.wert) : null);
          map[item.typ] = rawVal;
        });
      }

      setData(newData);
      setCurrentValues(map);
    } catch (err: any) {
      console.log("Error fetching current values:", err);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await fetch("/api/typen");
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Konnte Typen nicht laden");
      if (Array.isArray(payload)) setTypes(payload);
      else setTypes([]);
    } catch (err: any) {
      console.log("Error fetching types:", err);
      setTypes([]);
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

  const fetchSensors = async () => {
    try {
      setLoading(true);
      setSensorError(null);
      const res = await fetch(SENSOR_API_URL);
      if (!res.ok) {
        throw new Error(`Fehler beim Laden der Sensoren: ${res.status}`);
      }
      const newSensors = await res.json();
      setSensors(newSensors);
    } catch (err: any) {
      console.log(err);
      setSensorError(err?.message || "Sensordaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
    fetchTypes();
    fetchCurrentValues();
    const iv = setInterval(fetchCurrentValues, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ fontSize: `${fontSize}px` }}>
      <Router>
        <Routes>

          <Route path="/" element={
            <Dashboard types={types} currentValues={currentValues} fetchData={fetchSensors} loading={loading} sensors={sensors} sensorError={sensorError} />
          } />

          <Route path="/typ/:typName" element={<TypDetail darkMode={darkMode} types={types} />} />
          <Route path="/temperatur" element={<Detail title="🌡️ Temperatur" value={data.temp} unit="°C" types={types} />} />
          <Route path="/luft" element={<Detail title="💧 Luftfeuchtigkeit" value={data.hygro} unit="%" types={types} />} />
          <Route path="/uv" element={<Detail title="☀️ UV Index" value={data.uv} unit="" types={types} />} />

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
                  <p style={{ fontSize: "0.75rem", color: "#666" }}>Lass das Feld leer, wenn das Netzwerk offen ist</p>
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