"use client";
import { useState, useEffect } from 'react';

interface DailyStats {
  fecha: string;
  totalVotos: number;
  totalPuntos: number;
  usuariosActivos: number;
  usuariosRegistrados: number;
}

export default function DailyStatsModule() {
  const [statsData, setStatsData] = useState<DailyStats[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener mes actual en formato YYYY-MM
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Cargar datos estadísticos diarios
  const loadStatsData = async (month?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = month
        ? `/api/admin/daily-stats?month=${month}`
        : '/api/admin/daily-stats';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar datos estadísticos');

      const result = await response.json();
      setStatsData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales (último mes)
  useEffect(() => {
    const currentMonth = getCurrentMonth();
    setSelectedMonth(currentMonth);
    loadStatsData(currentMonth);
  }, []);

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcular totales
  const getTotalVotes = () => statsData.reduce((sum, item) => sum + item.totalVotos, 0);
  const getTotalPoints = () => statsData.reduce((sum, item) => sum + item.totalPuntos, 0);
  const getTotalRegisteredUsers = () => statsData.reduce((sum, item) => sum + item.usuariosRegistrados, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Estadísticas Diarias</h2>
        <p className="text-muted-foreground">Actividad diaria de votos y usuarios</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Tabla única con todas las estadísticas */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Actividad Diaria</h3>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-bold text-foreground">{getTotalVotes()}</span> votos |
                <span className="font-bold text-foreground"> {getTotalPoints().toLocaleString()}</span> puntos |
                <span className="font-bold text-foreground"> {getTotalRegisteredUsers()}</span> usuarios registrados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="selected-month" className="text-sm font-medium text-foreground">
                Mes:
              </label>
              <input
                type="month"
                id="selected-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => loadStatsData(selectedMonth)}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {loading ? 'Cargando...' : 'Filtrar'}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando datos...
            </div>
          ) : statsData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay datos para el período seleccionado
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Votos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Puntos Totales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuarios Activos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuarios Registrados
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statsData.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(item.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-medium">
                      {item.totalVotos.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-medium">
                      {item.totalPuntos.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-medium">
                      {item.usuariosActivos.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-medium">
                      {item.usuariosRegistrados.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}