interface Props {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
}

export default function ProgressRing({ value, size = 64, stroke = 6 }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={center} cy={center} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-value"
          cx={center}
          cy={center}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="ring-label">{pct}%</span>
    </div>
  );
}
