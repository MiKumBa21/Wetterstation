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
  "/wind": "linear-gradient(90deg, #72faf6, #98f9f6)",
  "/uv": "linear-gradient(90deg, #22c55e, #4adea8)",
};

const getTemperatureFill = (value?: number | null) => {
  const temp = value ?? 0;
  if (temp >= 32) return "#ef4444";
  if (temp >= 26) return "#fb923c";
  if (temp >= 20) return "#facc15";
  if (temp >= 13) return "#22c55e";
  if (temp >= 7) return "#38bdf8";
  if (temp >= 1) return "#3b82f6";
  if (temp >= -5) return "#2563eb";
  return "#888";
};

const getUVFill = (value?: number | null) => {
  const uv = value ?? 0;
  let fill = "#888";
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
  return fill;
};

const getWindFill = (value?: number | null) => {
  const wind = value ?? 0;
  if (wind > 117) return "#22d3ee"; 
  if (wind >= 103) return "#0ea5e9";
  if (wind >= 89) return "#2563eb";
  if (wind >= 75) return "#6366f1";
  if (wind >= 62) return "#8b5cf6";
  if (wind >= 50) return "#c026d3";
  if (wind >= 39) return "#ef4444";
  if (wind >= 29) return "#fb923c";
  if (wind >= 20) return "#facc15";
  if (wind >= 12) return "#a3e635";
  if (wind >= 6) return "#22c55e"; 
  if (wind >= 1) return "#4ade80"; 
  return "#888"; 
}

const getChartProps = (name: string, einheit?: string, value?: number | null) => {
  const t = name.toLowerCase();
  if (t.includes("temp") || t.includes("temperatur") || (einheit || "").toLowerCase().includes("c")) {
    return { domain: [0, 50], fill: getTemperatureFill(value), unit: "°C" };
  }
  if (t.includes("hygro") || t.includes("feucht") || (einheit || "").toLowerCase().includes("%")) {
    return { domain: [0, 100], fill: "#3b82f6", unit: "%" };
  }
  if (t.includes("uv")) {
    return { domain: [0, 11], fill: getUVFill(value), unit: "" };
  }
  if (t.includes("wind") || t.includes("druck") || (einheit || "").toLowerCase().includes("km/h") || (einheit || "").toLowerCase().includes("m/s")) {
    return { domain: [0, 100], fill: getWindFill(value), unit: "km/h" };
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
function Dashboard({ types, currentValues, onRefresh, loading }: any) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <div className="topbar">
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <h1>Wetterstation</h1>
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
      const res = await fetch(`/api/history/${encodeURIComponent(typName)}?zeitraum=${range}`);
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
  const color = props.fill;

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
function Detail({ title, value, unit, types, onRefresh }: any) {
  const location = useLocation();
  const color = pageColors[location.pathname] || "#168ed8";

  return (
    <div>
      <Topbar title={title} color={color} onRefresh={onRefresh} types={types} />

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
  const [wifiNetworks, setWifiNetworks] = useState<{ ssid: string; security: string; signal: number }[]>([]);
  const [wifiLoading, setWifiLoading] = useState(false);
  const [wifiError, setWifiError] = useState<string | null>(null);
  const [wifiStatus, setWifiStatus] = useState<{ ssid: string; security: string; signal: number; connected: boolean } | null>(null);
  const [wifiStatusLoading, setWifiStatusLoading] = useState(false);
  const [wifiStatusError, setWifiStatusError] = useState<string | null>(null);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<{ ssid: string; security: string } | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [connectStatus, setConnectStatus] = useState<string | null>(null);

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

  const refreshDashboard = async () => {
    await Promise.all([fetchSensors(), fetchTypes(), fetchCurrentValues()]);
  };

  useEffect(() => {
    fetchSensors();
    fetchTypes();
    fetchCurrentValues();
    const iv = setInterval(fetchCurrentValues, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      fetchWifiNetworks();
      fetchWifiStatus();
    }
  }, [settingsOpen]);

  const networkRequiresPassword = (security: string) => {
    if (!security) return false;
    return security.toLowerCase() !== "none" && security.toLowerCase() !== "offen";
  };

  const fetchWifiNetworks = async () => {
    try {
      setWifiLoading(true);
      setWifiError(null);
      setConnectStatus(null);
      const res = await fetch("/api/wifi");
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Konnte WLAN-Netzwerke nicht laden");
      if (!Array.isArray(payload)) throw new Error("Ungültige WLAN-Daten vom Server");
      setWifiNetworks(payload.map((item: any) => ({
        ssid: String(item.ssid || ""),
        security: String(item.security || ""),
        signal: Number(item.signal ?? 0),
      })));
    } catch (err: any) {
      setWifiError(err?.message || "Fehler beim Laden der WLAN-Netze");
      setWifiNetworks([]);
    } finally {
      setWifiLoading(false);
    }
  };

  const fetchWifiStatus = async () => {
    try {
      setWifiStatusLoading(true);
      setWifiStatusError(null);
      const res = await fetch("/api/wifi/status");
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Konnte WLAN-Status nicht laden");
      if (payload && typeof payload === "object") {
        setWifiStatus({
          ssid: String(payload.ssid || ""),
          security: String(payload.security || ""),
          signal: Number(payload.signal ?? 0),
          connected: Boolean(payload.connected),
        });
      } else {
        setWifiStatus(null);
      }
    } catch (err: any) {
      setWifiStatusError(err?.message || "Fehler beim Laden des WLAN-Status");
      setWifiStatus(null);
    } finally {
      setWifiStatusLoading(false);
    }
  };

  const connectToWifi = async (ssid: string, password?: string) => {
    try {
      setWifiLoading(true);
      setWifiError(null);
      setConnectStatus(null);
      const res = await fetch("/api/wifi/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password }),
      });
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Verbindung fehlgeschlagen");
      setConnectStatus(`Verbunden mit "${ssid}"`);
      await fetchWifiStatus();
      await fetchWifiNetworks();
    } catch (err: any) {
      setWifiError(err?.message || "Verbindung fehlgeschlagen");
      setConnectStatus(null);
    } finally {
      setWifiLoading(false);
      setPasswordPromptOpen(false);
      setWifiPassword("");
    }
  };

  const handleWifiConnect = (network: { ssid: string; security: string }) => {
    if (networkRequiresPassword(network.security)) {
      setSelectedNetwork(network);
      setPasswordPromptOpen(true);
    } else {
      connectToWifi(network.ssid);
    }
  };

  return (
    <div style={{ fontSize: `${fontSize}px` }}>
      <Router>
        <Routes>

          <Route path="/" element={
            <Dashboard types={types} currentValues={currentValues} onRefresh={refreshDashboard} loading={loading} sensors={sensors} sensorError={sensorError} />
          } />

          <Route path="/typ/:typName" element={<TypDetail darkMode={darkMode} types={types} />} />
          <Route path="/temperatur" element={<Detail title="🌡️ Temperatur" value={data.temp} unit="°C" types={types} onRefresh={fetchCurrentValues} />} />
          <Route path="/luft" element={<Detail title="💧 Luftfeuchtigkeit" value={data.hygro} unit="%" types={types} onRefresh={fetchCurrentValues} />} />
          <Route path="/uv" element={<Detail title="☀️ UV Index" value={data.uv} unit="" types={types} onRefresh={fetchCurrentValues} />} />

        </Routes>
      </Router>

      {/* ⚙️ BUTTON */}
      <button className="settings-btn" onClick={() => {
        setSettingsOpen(true);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <label>📶 WLAN-Netzwerke</label>
                <button type="button" onClick={() => { fetchWifiNetworks(); fetchWifiStatus(); }} style={{ fontSize: 12, padding: '4px 10px' }}>
                  Neuladen
                </button>
              </div>
              {wifiStatusLoading ? (
                <p style={{ margin: '4px 0 8px 0' }}>Lade WLAN-Status...</p>
              ) : wifiStatusError ? (
                <p style={{ color: '#f87171', margin: '4px 0 8px 0' }}>{wifiStatusError}</p>
              ) : wifiStatus ? (
                <div style={{ marginBottom: 10, fontSize: 14, color: wifiStatus.connected ? '#22c55e' : '#f87171' }}>
                  {wifiStatus.connected ? (
                    <span>Verbunden mit <strong>{wifiStatus.ssid || 'unbekannt'}</strong></span>
                  ) : (
                    <span>Derzeit nicht verbunden</span>
                  )}
                </div>
              ) : null}
              {wifiLoading ? (
                <p>Lade WLAN-Netze...</p>
              ) : wifiError ? (
                <p style={{ color: '#f87171' }}>{wifiError}</p>
              ) : (
                <div style={{ maxHeight: 240, overflowY: 'auto', gap: 10, display: 'grid' }}>
                  {wifiNetworks.length > 0 ? wifiNetworks.map((network) => (
                    <div key={network.ssid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>
                      <div style={{ minWidth: 0 }}>
                        <strong>{network.ssid || 'Unbekanntes Netzwerk'}</strong>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {network.security ? network.security : 'Offenes Netzwerk'} · Signal: {network.signal}%
                        </div>
                      </div>
                      <button onClick={() => handleWifiConnect(network)} style={{ whiteSpace: 'nowrap' }}>Verbinden</button>
                    </div>
                  )) : (
                    <p>Keine WLAN-Netze gefunden.</p>
                  )}
                </div>
              )}
              {connectStatus && <p style={{ color: '#22c55e', marginTop: 8 }}>{connectStatus}</p>}
            </div>

            <button onClick={() => setSettingsOpen(false)} style={{ borderRadius: '5px' }}>
              Schließen
            </button>

          </div>
        </div>
      )}

      {passwordPromptOpen && selectedNetwork && (
        <div className="settings-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="settings-modal" style={{ maxWidth: 420, width: '100%' }}>
            <h2>WLAN verbinden</h2>
            <p><strong>SSID:</strong> {selectedNetwork.ssid}</p>
            <p><strong>Sicherheit:</strong> {selectedNetwork.security || 'Offenes Netzwerk'}</p>

            <div className="setting">
              <label>Passwort</label>
              <input
                type="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setPasswordPromptOpen(false)} style={{ borderRadius: '5px' }}>
                Abbrechen
              </button>
              <button onClick={() => connectToWifi(selectedNetwork.ssid, wifiPassword)} style={{ borderRadius: '5px' }}>
                Verbinden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}