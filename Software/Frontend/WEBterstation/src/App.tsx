import { useEffect, useState } from "react";

const API_URL = "http://192.168.0.50/data"; // Passe die URL an

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
    const interval = setInterval(fetchData, 5000); // alle 5 Sekunden aktualisieren
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Wetterstation Dashboard</h1>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 grid gap-4">
        {loading && <p className="text-sm opacity-60">Aktualisiere...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-4 text-lg">
          <p className="font-semibold">Temperatur:</p>
          <p>{data.temp !== null ? `${data.temp} °C` : "--"}</p>

          <p className="font-semibold">Luftfeuchtigkeit:</p>
          <p>{data.hygro !== null ? `${data.hygro} %` : "--"}</p>

          <p className="font-semibold">Beleuchtung:</p>
          <p>{data.lighting !== null ? `${data.lighting} lx` : "--"}</p>

          <p className="font-semibold">UV‑Index:</p>
          <p>{data.uv !== null ? data.uv : "--"}</p>
        </div>

        <button
          className="mt-4 w-full rounded-2xl shadow-md bg-blue-500 text-white py-2 hover:bg-blue-600 transition-colors"
          onClick={fetchData}
        >
          Manuell aktualisieren
        </button>
      </div>
    </div>
  );
}
