
import { useEffect, useState } from "react";

const API_URL = "http://192.168.0.50/data";

// Interface wird erstellt: Jede Eigenschaft kann entweder eine Zahl oder null sein
interface WeatherData {
  temp: number | null;
  hygro: number | null;
  lighting: number | null;
  uv: number | null;
}
export default function Wetterstation() {
  const [data, setData] = useState<WeatherData>({
    temp: null,
    hygro: null,
    lighting: null,
    uv: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Fehler beim Abrufen der Daten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="side">
        <img src="/sonne.jpg" alt="Sonne" />
      </div>

      <div className="dashboard">
        <h1>Wetterstation Dashboard</h1>

        {/* Lade- und Fehleranzeige */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 grid gap-4">
          {loading && <p className="text-sm opacity-60">Aktualisiere...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Sensordaten */}
          <p><strong>Temperatur:</strong> {data.temp ?? "--"} °C</p>
          <p><strong>Luftfeuchtigkeit:</strong> {data.hygro ?? "--"} %</p>
          <p><strong>Beleuchtung:</strong> {data.lighting ?? "--"} lx</p>
          <p><strong>UV-Index:</strong> {data.uv ?? "--"}</p>

          <button onClick={fetchData}>Manuell aktualisieren</button>
        </div>
      </div>

      <div className="side">
        <img src="/sturm.jpg" alt="Sturm" />
      </div>
    </div>
  );
}
