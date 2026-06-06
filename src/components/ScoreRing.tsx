'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e'; // green
  if (score >= 50) return '#eab308'; // yellow
  if (score >= 25) return '#f97316'; // orange
  return '#dc2626'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Concerning';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export default function ScoreRing({ score, size = 80, strokeWidth = 6, showLabel = true }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
          />
          {/* Score circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
