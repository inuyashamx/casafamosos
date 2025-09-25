"use client";
import React from 'react';

interface Nominee {
  id: string;
  name: string;
  photo: string;
  votes: number;
  percentage: number;
}

interface TeamInfluenceChartProps {
  nominees: Nominee[];
}

const TEAM_ASSIGNMENTS = {
  DIA: ['Dalílah', 'Shiky'],
  NOCHE: [] // Se calculará dinámicamente con el resto
};

export default function TeamInfluenceChart({ nominees }: TeamInfluenceChartProps) {
  // Calcular porcentajes por team
  const calculateTeamPercentages = () => {
    let diaPercentage = 0;
    let nochePercentage = 0;

    nominees.forEach(nominee => {
      const isDiaTeam = TEAM_ASSIGNMENTS.DIA.some(
        name => nominee.name.toLowerCase().includes(name.toLowerCase())
      );

      if (isDiaTeam) {
        diaPercentage += nominee.percentage;
      } else {
        nochePercentage += nominee.percentage;
      }
    });

    return {
      dia: parseFloat(diaPercentage.toFixed(2)),
      noche: parseFloat(nochePercentage.toFixed(2))
    };
  };

  const percentages = calculateTeamPercentages();

  return (
    <div className="bg-card rounded-xl p-6 border border-border/20 space-y-4">
      {/* Título con icono */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          Influencia de Teams en la Votación
        </h3>
      </div>

      {/* Barra única dividida */}
      <div className="space-y-4">
        {/* Barra dividida */}
        <div className="relative h-14 bg-muted/30 rounded-lg overflow-hidden border border-border/20">
          <div className="absolute inset-0 flex h-full">
            {/* Sección Team Día */}
            <div
              className="bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center transition-all duration-1000 ease-out relative"
              style={{
                width: `${percentages.dia}%`,
                animation: 'growWidth 1s ease-out'
              }}
            >
              {percentages.dia > 10 && (
                <div className="text-white font-bold drop-shadow-lg flex items-center gap-1">
                  <span>Team Día {percentages.dia}%</span>
                </div>
              )}
            </div>

            {/* Sección Team Noche */}
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center transition-all duration-1000 ease-out relative"
              style={{
                width: `${percentages.noche}%`,
                animation: 'growWidth 1s ease-out 0.2s both'
              }}
            >
              {percentages.noche > 10 && (
                <div className="text-white font-bold drop-shadow-lg flex items-center gap-1">
                  <span>Team Noche {percentages.noche}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Línea divisoria vertical */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
            style={{ left: `${percentages.dia}%` }}
          />
        </div>

      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes growWidth {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}