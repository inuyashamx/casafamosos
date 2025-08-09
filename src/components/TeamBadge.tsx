"use client";
import React from 'react';

export type TeamType = 'DIA' | 'NOCHE' | 'ECLIPSE' | null | undefined;

export default function TeamBadge({ team, size = 14, withLabel = false }: { team: TeamType; size?: number; withLabel?: boolean }) {
  if (!team) return null;

  const map = {
    DIA: { icon: '☀️', label: 'Día', color: 'text-yellow-500' },
    NOCHE: { icon: '🌙', label: 'Noche', color: 'text-indigo-400' },
    ECLIPSE: { icon: '🌘', label: 'Eclipse', color: 'text-violet-500' },
  } as const;

  const cfg = map[team];
  return (
    <span className={`inline-flex items-center gap-1 ${cfg.color}`} title={`Team ${cfg.label}`}>
      <span style={{ fontSize: size }} aria-hidden>
        {cfg.icon}
      </span>
      {withLabel && <span className="text-xs font-medium">{cfg.label}</span>}
    </span>
  );
}


