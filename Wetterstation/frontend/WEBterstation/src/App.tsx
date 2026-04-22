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
  "/": "#168ed8",
  "/temperatur": "#ef4444",
  "/luft": "#3b82f6",
  "/licht": "#f59e0b",
  "/uv": "#22c55e",
};


// 🔹 TOPBAR
function Topbar({ title, color, onRefresh }: any) {
  return (
    <div className="topbar" style={{ background: color }}>
      <h1>{title}</h1>
      <button onClick={onRefresh}>↻</button>
    </div>
  );
}


// 🔹 DASHBOARD
function Dashboard({ data, fetchData, loading }: any) {
  const location = useLocation();
  const color = pageColors[location.pathname] || "#168ed8";

  return (
    <div>
      <Topbar title="Wetterstation" color={color} onRefresh={fetchData} />

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


// 🔹 DETAILSEITEN
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


// 🔹 HAUPT COMPONENT
export default function Wetterstation() {

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

      /*
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(json);
      */

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
    <Router>
      <Routes>

        <Route path="/" element={
          <Dashboard data={data} fetchData={fetchData} loading={loading} />
        } />

        <Route path="/temperatur" element={
          <Detail title="🌡️ Temperatur" value={data.temp} unit="°C" />
        } />

        <Route path="/luft" element={
          <Detail title="💧 Luftfeuchtigkeit" value={data.hygro} unit="%" />
        } />

        <Route path="/licht" element={
          <Detail title="💡 Licht" value={data.lighting} unit="lx" />
        } />

        <Route path="/uv" element={
          <Detail title="☀️ UV Index" value={data.uv} unit="" />
        } />

      </Routes>
    </Router>
  );
}