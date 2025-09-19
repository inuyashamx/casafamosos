"use client";
import { useState, useEffect } from 'react';

interface VotingTrend {
  combination: string;
  candidateIds: string[];
  candidateNames: string[];
  totalVotes: number;
  percentage: number;
  description: string;
}

interface VotingTrendsData {
  combinations: VotingTrend[];
  totalVotes: number;
  totalCombinations: number;
  week: {
    id: string;
    name: string;
    weekNumber: number;
  };
  season: {
    id: string;
    name: string;
    year: number;
  };
}

interface VotingTrendsProps {
  onRefresh?: () => void;
}

export default function VotingTrends({ onRefresh }: VotingTrendsProps) {
  const [trendsData, setTrendsData] = useState<VotingTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('');

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/public/voting-trends');

      if (response.ok) {
        const data = await response.json();
        setTrendsData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar tendencias');
      }
    } catch (error) {
      console.error('Error fetching voting trends:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendsData();
  }, []);

  const handleRefresh = async () => {
    await fetchTrendsData();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Obtener candidatos únicos para los filtros
  const uniqueCandidates = trendsData ? Array.from(
    new Set(
      trendsData.combinations.flatMap(combo => combo.candidateNames)
    )
  ).slice(0, 4) : []; // Máximo 4 candidatos

  // Seleccionar automáticamente el primer candidato cuando se cargan los datos
  useEffect(() => {
    if (trendsData && uniqueCandidates.length > 0 && selectedFilter === '') {
      setSelectedFilter(uniqueCandidates[0]);
    }
  }, [trendsData, uniqueCandidates, selectedFilter]);

  // Filtrar combinaciones basado en el filtro seleccionado
  const filteredCombinations = trendsData?.combinations.filter(combo => {
    if (selectedFilter === 'all' || selectedFilter === '') return true;
    return combo.candidateNames.includes(selectedFilter);
  }) || [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Tendencias de Votación</h3>
          <div className="animate-pulse">
            <div className="w-6 h-6 bg-muted rounded"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border/20 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Tendencias de Votación</h3>
          <button
            onClick={handleRefresh}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            🔄
          </button>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-destructive font-medium">Error al cargar tendencias</h4>
              <p className="text-destructive/80 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm hover:bg-destructive/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trendsData || trendsData.combinations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Tendencias de Votación</h3>
          <button
            onClick={handleRefresh}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            🔄
          </button>
        </div>
        <div className="bg-muted/30 border border-border/40 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-foreground mb-2">Sin datos de tendencias</h4>
          <p className="text-muted-foreground">Aún no hay suficientes votos para mostrar tendencias.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Tendencias de Votación</h3>
        <button
          onClick={handleRefresh}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          🔄
        </button>
      </div>

      {/* Filtros por candidato */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Filtrar por candidato:</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            🗳️ Todos
          </button>
          {uniqueCandidates.map((candidateName) => (
            <button
              key={candidateName}
              onClick={() => setSelectedFilter(candidateName)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedFilter === candidateName
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              👤 {candidateName}
            </button>
          ))}
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="bg-card rounded-xl p-4 border border-border/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {selectedFilter === 'all' || selectedFilter === ''
                ? trendsData.totalVotes.toLocaleString()
                : filteredCombinations.reduce((sum, combo) => sum + combo.totalVotes, 0).toLocaleString()
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedFilter === 'all' || selectedFilter === '' ? 'Total de votos' : `Votos con ${selectedFilter}`}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">
              {selectedFilter === 'all' || selectedFilter === '' ? trendsData.totalCombinations : filteredCombinations.length}
            </div>
            <div className="text-xs text-muted-foreground">Combinaciones</div>
          </div>
        </div>
      </div>

      {/* Lista de tendencias */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          📈 Combinaciones de Votos
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          {selectedFilter === 'all' || selectedFilter === ''
            ? 'Distribución de votos según las combinaciones elegidas por los votantes'
            : `Combinaciones que incluyen a ${selectedFilter}`
          }
        </p>

        {filteredCombinations.map((trend, index) => (
          <div
            key={trend.combination}
            className={`rounded-xl p-4 border transition-all duration-200 hover:scale-[1.01] ${
              index === 0
                ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-lg'
                : 'bg-card border-border/20 hover:border-primary/30'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Position Badge */}
              <div className="flex items-center space-x-3">
                <div className={`position-badge ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg'
                    : index === 1
                      ? 'bg-gray-400 text-white'
                      : index === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-muted text-muted-foreground'
                }`}>
                  {index === 0 ? '👑' : `#${index + 1}`}
                </div>

                {/* Combination Info */}
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    index === 0 ? 'text-primary font-bold' : 'text-foreground'
                  }`}>
                    {trend.description}
                    {index === 0 && <span className="ml-2 text-yellow-500">🏆</span>}
                  </h4>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  index === 0 ? 'text-primary' : 'text-foreground'
                }`}>
                  {trend.totalVotes.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  votos
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="bg-muted/30 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">
          📊 Datos basados en la {trendsData.week.name} - {trendsData.season.name} {trendsData.season.year}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Los porcentajes se calculan sobre el total de votos válidos
        </p>
      </div>
    </div>
  );
}