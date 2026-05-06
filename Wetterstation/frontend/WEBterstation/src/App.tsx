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
      <Topbar title={title} color={color} onRefresh={() => {}} />

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

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
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
      <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
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
              <label>WLAN</label>
              <span>192.168.0.50 verbunden</span>
            </div>

            <button onClick={() => setSettingsOpen(false)}>
              Schließen
            </button>

          </div>
        </div>
      )}
    </div>
  );
}