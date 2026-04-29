import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

// 👉 HIER deine echte API eintragen


interface WeatherData {
  temp: number | null;
  hygro: number | null;
  lighting: number | null;
  uv: number | null;
}

const createChartData = (value: number | null) => [
  { name: "value", value: value ?? 0 },
];

export default function Wetterstation() {

  // 👉 TESTDATEN (damit du was siehst!)
  const [data] = useState<WeatherData>({
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
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
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
    <div>

      {/* TOPBAR */}
      <div className="topbar">
        <h1>Wetterstation</h1>
        <button onClick={fetchData}>↻</button>
      </div>

      {/* GRID */}
      <div className="grid">

        {/* Temperatur */}
        <div className="card">
          <h2>🌡️ Temperatur</h2>
          <RadialBarChart
            width={200}
            height={120}
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={createChartData(data.temp)}
          >
            <PolarAngleAxis type="number" domain={[0, 50]} tick={false} />
            <RadialBar dataKey="value" fill="#ef4444" />
          </RadialBarChart>
          <div className="value">{data.temp} °C</div>
        </div>

        {/* Luft */}
        <div className="card">
          <h2>💧 Luftfeuchtigkeit</h2>
          <RadialBarChart
            width={200}
            height={120}
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={createChartData(data.hygro)}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" fill="#3b82f6" />
          </RadialBarChart>
          <div className="value">{data.hygro} %</div>
        </div>

        {/* Licht */}
        <div className="card">
          <h2>💡 Licht</h2>
          <RadialBarChart
            width={200}
            height={120}
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={createChartData(data.lighting)}
          >
            <PolarAngleAxis type="number" domain={[0, 1000]} tick={false} />
            <RadialBar dataKey="value" fill="#f59e0b" />
          </RadialBarChart>
          <div className="value">{data.lighting} lx</div>
        </div>

        {/* UV */}
        <div className="card">
          <h2>☀️ UV Index</h2>
          <RadialBarChart
            width={200}
            height={120}
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={createChartData(data.uv)}
          >
            <PolarAngleAxis type="number" domain={[0, 11]} tick={false} />
            <RadialBar dataKey="value" fill="#22c55e" />
          </RadialBarChart>
          <div className="value">{data.uv}</div>
        </div>

      </div>

      {loading && <p style={{ textAlign: "center" }}>Aktualisiere...</p>}

    </div>
  );
}