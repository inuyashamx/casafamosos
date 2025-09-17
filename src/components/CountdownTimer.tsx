"use client";
import { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  endDate: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!endDate) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = (): TimeRemaining | null => {
      const now = new Date().getTime();
      const endTime = new Date(endDate).getTime();
      const timeDiff = endTime - now;

      if (timeDiff <= 0) {
        return null;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    // Función optimizada para actualizar solo cuando sea necesario
    const updateCountdown = () => {
      const newTime = calculateTimeRemaining();

      setTimeRemaining(prevTime => {
        // Solo actualizar si hay un cambio real en los valores
        if (!prevTime && !newTime) return null;
        if (!prevTime && newTime) return newTime;
        if (prevTime && !newTime) return null;
        if (prevTime && newTime &&
            prevTime.days === newTime.days &&
            prevTime.hours === newTime.hours &&
            prevTime.minutes === newTime.minutes &&
            prevTime.seconds === newTime.seconds) {
          return prevTime; // No hay cambios, mantener el estado anterior
        }
        return newTime;
      });
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Configurar intervalo
    intervalRef.current = setInterval(updateCountdown, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endDate]);

  // Si no hay tiempo restante, no renderizar nada
  if (!timeRemaining) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
      <div className="text-center">
        <div className="text-sm text-red-600 font-bold mb-2">
          ⏰ TIEMPO RESTANTE PARA VOTAR
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <div className="text-2xl font-black text-red-600">
              {timeRemaining.days}
            </div>
            <div className="text-xs text-red-500 font-medium">
              {timeRemaining.days === 1 ? 'Día' : 'Días'}
            </div>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <div className="text-2xl font-black text-red-600">
              {timeRemaining.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-red-500 font-medium">
              Horas
            </div>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <div className="text-2xl font-black text-red-600">
              {timeRemaining.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-red-500 font-medium">
              Min
            </div>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <div className="text-2xl font-black text-red-600">
              {timeRemaining.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-red-500 font-medium">
              Seg
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}