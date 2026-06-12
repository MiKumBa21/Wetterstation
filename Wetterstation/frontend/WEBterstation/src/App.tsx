// ============================================================================
// Wetterstation Frontend Application
// ============================================================================
// Eine vollständige Wetterstation-Anwendung mit:
// - Dashboard zur Anzeige aktueller Messwerte
// - Detailansichten mit historischen Daten
// - WLAN-Verwaltung (Scannen, Verbinden)
// - Dark Mode und Schriftgröße-Anpassung
// ============================================================================

import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { BrowserRouter as Router, Routes, Route, Link, useParams } from "react-router-dom";

// ============================================================================
// Type Definitions
// ============================================================================

/** Datentyp-Interface: Repräsentiert einen Messwerttyp (z.B. Temperatur, Luftfeuchte) */
interface Typ {
  typ_id: number;           // Eindeutige ID des Datentyps
  name: string;             // Name des Typs (z.B. "Temperatur")
  einheit?: string;         // Einheit (z.B. "°C", "%", "Lux")
}

/** Historischer Datensatz: Ein einzelner Messwert aus der Vergangenheit */
interface HistoryEntry {
  typ: string;              // Name des Datentyps
  einheit: string;          // Einheit des Messwerts
  sensor: string;           // Name des Sensors
  wert: number;             // Messwert
  zeitstempel: string;      // ISO-8601 Zeitstempel
}

/** WLAN-Netzwerk: Informationen über verfügbare Netzwerke */
type WifiNetwork = {
  ssid: string;             // Netzwerkname
  security: string;         // Sicherheitstyp (z.B. "WPA2", "WPA3")
  signal: number;           // Signalstärke in %
};

// ============================================================================
// Helper Functions - Chart Data Formatting & Styling
// ============================================================================

/**
 * Erstellt Daten-Array für Recharts RadialBarChart.
 * @param value Der anzuzeigende Wert (null wird zu 0)
 * @returns Array mit formatierten Chartdaten
 */
const createChartData = (value: number | null) => [{ name: "value", value: value ?? 0 }];

const formatDashboardValue = (value: number | null) => {
  if (value === null) return "-";
  const formatted = value.toFixed(2).replace(/\.0+$|(?<=\.[0-9])0+$/, "");
  return formatted;
};

/**
 * Bestimmt die Chartfarbe basierend auf Temperaturwert.
 * Spektrum: Rot (heiß) → Orange → Gelb → Grün → Blau → Dunkelblau (kalt)
 */
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

/**
 * Bestimmt die Chartfarbe basierend auf Beleuchtungsstärke (Lux).
 * Von dunkel (schwach) zu orange/braun (stark)
 */
const getLuxFill = (value?: number | null) => {
  const lux = value ?? 0;
  if (lux >= 140000) return "#b45309";
  if (lux >= 100000) return "#d97706";
  if (lux >= 70000) return "#f59e0b";
  if (lux >= 40000) return "#fbbf24";
  if (lux >= 20000) return "#facc15";
  if (lux >= 10000) return "#fde68a";
  if (lux >= 5000) return "#fef08a";
  if (lux >= 2000) return "#fef9c3";
  if (lux >= 500) return "#fefce8";
  return "#fffbeb";
};

/**
 * Bestimmt die Chartfarbe basierend auf Windgeschwindigkeit.
 * Spektrum: Grün (schwach) → Gelb → Orange → Rot → Violett (Sturm)
 */
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
};

/**
 * Bestimmt Chart-Eigenschaften (Domain, Farbe, Einheit) basierend auf Datentyp.
 * Automatische Erkennung via Name oder Einheit des Messwerts.
 */
const getChartProps = (name: string, einheit?: string, value?: number | null) => {
  const t = name.toLowerCase();
  if (t.includes("temp") || t.includes("temperatur") || (einheit || "").toLowerCase().includes("c")) {
    return { domain: [0, 50], fill: getTemperatureFill(value), unit: "°C" };
  }
  if (t.includes("hygro") || t.includes("feucht") || (einheit || "").toLowerCase().includes("%")) {
    return { domain: [0, 100], fill: "#3b82f6", unit: "%" };
  }
  if (t.includes("licht") || t.includes("lux") || t.includes("beleuchtungsstärke")) {
    return { domain: [0, 140000], fill: getLuxFill(value), unit: "Lux" };
  }
  if (t.includes("wind") || t.includes("druck") || (einheit || "").toLowerCase().includes("km/h") || (einheit || "").toLowerCase().includes("m/s")) {
    return { domain: [0, 100], fill: getWindFill(value), unit: "km/h" };
  }
  return { domain: [0, 100], fill: "#888", unit: einheit || "" };
};

function Topbar({ title, color, onRefresh, types }: { title: string; color: string; onRefresh: () => void; types: Typ[] }) {
  // Zustand für das Menü (offen/geschlossen)
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div className="topbar" style={{ background: color }}>
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <h1>{title}</h1>
        <button onClick={onRefresh}>↻</button>
      </div>

      {/* Dropdown-Menü mit Navigation zu allen Seiten */}
      {menuOpen && (
        <div className="menu">
          <h2>Menü</h2>
          {/* Link zurück zum Dashboard */}
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          {types.length > 0 && (
            <>
              <hr style={{ margin: "10px 0", borderColor: "#d1d5db" }} />
              {/* Navigation zu Detailseiten für alle Typen (außer Lux) */}
              {types
                .filter((typ) => !/(licht|lx|lux)/i.test(typ.name))
                .map((typ) => (
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

function Dashboard({ types, currentValues, onRefresh, loading }: { types: Typ[]; currentValues: Record<string, number | null>; onRefresh: () => void; loading: boolean }) {
  return (
    <div>
      <Topbar title="Wetterstation" color="#3b82f6" onRefresh={onRefresh} types={types} />
      {/* Grid mit RadialBarCharts für jeden Datentyp */}
      <div className="grid">
        {types.length > 0 ? (
          // Filtert Lux aus (wird separat angezeigt) und erstellt Chart für jeden Typ
          types
            .filter((typ) => !/(licht|lx|lux)/i.test(typ.name))
            .map((typ) => {
              const value = currentValues?.[typ.name] ?? null;
              const chartProps = getChartProps(typ.name, typ.einheit, value);
              // Jede Karte ist ein Link zur Detailseite
              return (
                <Link key={typ.typ_id} to={`/typ/${encodeURIComponent(typ.name)}`} className="card">
                  <h2>{typ.name}</h2>
                  {/* RadialBarChart zur Visualisierung des aktuellen Wertes */}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180 }}>
                    <RadialBarChart width={250} height={180} cx="50%" cy="75%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={createChartData(value)}>
                      <PolarAngleAxis type="number" domain={chartProps.domain as any} tick={false} />
                      <RadialBar dataKey="value" fill={chartProps.fill} />
                    </RadialBarChart>
                  </div>
                  {/* Textanzeige des aktuellen Wertes */}
                  <div className="value" style={{ textAlign: "center" }}>
                    {formatDashboardValue(value)} {chartProps.unit}
                  </div>
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
      setHistory(
        payload.map((item: any) => ({
          typ: item.typ,
          einheit: item.einheit,
          sensor: item.sensor,
          wert: typeof item.wert === "number" ? item.wert : Number(item.wert),
          zeitstempel: item.zeitstempel,
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Fehler beim Laden des Verlaufs");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(zeitraum);
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
  const chartProps = getChartProps(formattedLabel, history[0]?.einheit, history[history.length - 1]?.wert ?? null);

  const formatTooltipValue = (value: any, unit: string) => {
    if (value === null || value === undefined) return "-";
    const valueString = String(value);
    return unit ? `${valueString} ${unit}` : valueString;
  };

  return (
    <div>
      <Topbar title={formattedLabel || "Detail"} color={chartProps.fill} onRefresh={() => fetchHistory(zeitraum)} types={types} />
      <div className="detail-container">
        <div className="detail-card">
          <div className="detail-title-row">
            <h2>{formattedLabel || "Unbekannt"}</h2>
            <Link to="/" className="back-link">
              ⬅ Zurück
            </Link>
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
                      formatter={(value: any) => [formatTooltipValue(value, chartProps.unit), ""]}
                      separator=" "
                    />
                    <Line type="monotone" dataKey="value" stroke={chartProps.fill} strokeWidth={3} dot={false} />
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
              <p>{average !== null ? `${average.toFixed(1)} ${chartProps.unit}` : "-"}</p>
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

export default function Wetterstation() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  
  // ========================================
  // Data State
  // ========================================
  
  // State: Verfügbare Datentypen vom Backend
  const [types, setTypes] = useState<Typ[]>([]);
  // State: Aktuelle Messwerte (Typ-Name => Wert)
  const [currentValues, setCurrentValues] = useState<Record<string, number | null>>({});
  
  // ========================================
  // WLAN State
  // ========================================
  
  // State: Liste verfügbarer WLAN-Netzwerke
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  // State: Ladeindikator für WLAN-Operationen
  const [wifiLoading, setWifiLoading] = useState(false);
  // State: Fehler bei WLAN-Operationen
  const [wifiError, setWifiError] = useState<string | null>(null);
  
  // State: Aktueller WLAN-Verbindungsstatus
  const [wifiStatus, setWifiStatus] = useState<{ ssid: string; security: string; signal: number; connected: boolean } | null>(null);
  // State: Lade-Status für WLAN-Status-Abruf
  const [wifiStatusLoading, setWifiStatusLoading] = useState(false);
  // State: Fehler beim Laden des WLAN-Status
  const [wifiStatusError, setWifiStatusError] = useState<string | null>(null);
  
  // State: Passwort-Eingabedialog offen/geschlossen
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  // State: Ausgewähltes Netzwerk für Verbindung
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  // State: Eingegeben Passwort
  const [wifiPassword, setWifiPassword] = useState("");
  // State: Erfolgsmeldung nach Verbindung
  const [connectStatus, setConnectStatus] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    fetchTypes();
    fetchCurrentValues();
    const interval = setInterval(fetchCurrentValues, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      fetchWifiNetworks();
      fetchWifiStatus();
    }
  }, [settingsOpen]);

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
    if (t.includes("licht") || t.includes("lux") || t.includes("beleuchtungsstärke")) return "lux";
    return null;
  };

  const fetchCurrentValues = async () => {
    try {
      const res = await fetch("/api/aktuell");
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Konnte aktuelle Werte nicht laden");

      const map: Record<string, number | null> = {};
      if (Array.isArray(payload)) {
        payload.forEach((item: any) => {
          const key = matchTypeKey(String(item.typ || ""));
          if (!key) return;
          map[item.typ] = typeof item.wert === "number" ? item.wert : !isNaN(Number(item.wert)) ? Number(item.wert) : null;
        });
      }

      setCurrentValues(map);
    } catch (err: any) {
      console.error("Error fetching current values:", err);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await fetch("/api/typen");
      const payload = await parseResponse(res);
      if (!res.ok) throw new Error(payload?.error || "Konnte Typen nicht laden");
      setTypes(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      console.error("Error fetching types:", err);
      setTypes([]);
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchTypes(), fetchCurrentValues()]);
  };

  const networkRequiresPassword = (security: string) => {
    if (!security) return false;
    const lower = security.toLowerCase();
    return lower !== "none" && lower !== "offen";
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
      setWifiNetworks(
        payload.map((item: any) => ({
          ssid: String(item.ssid || ""),
          security: String(item.security || ""),
          signal: Number(item.signal ?? 0),
        }))
      );
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

  const handleWifiConnect = (network: WifiNetwork) => {
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
          <Route path="/" element={<Dashboard types={types} currentValues={currentValues} onRefresh={refreshDashboard} loading={wifiLoading} />} />
          <Route path="/typ/:typName" element={<TypDetail darkMode={darkMode} types={types} />} />
        </Routes>
      </Router>

      <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
        ⚙️
      </button>

      {settingsOpen && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <h2>Einstellungen</h2>

            <div className="setting">
              <label>🌙 Dark Mode</label>
              <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>

            <div className="setting">
              <label>Schriftgröße</label>
              <input type="range" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
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
                      <button onClick={() => handleWifiConnect(network)} style={{ whiteSpace: 'nowrap' }}>
                        Verbinden
                      </button>
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
              <input type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} style={{ width: '100%' }} />
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
