interface CalibrationButtonStatusProps {
  label: string
  currentPosition: number
}

export function CalibrationButtonStatus({
  label,
  currentPosition
}: CalibrationButtonStatusProps): React.JSX.Element {
  const isPressed = currentPosition > 100

  return (
    <div
      className={`rounded-lg p-3 transition-colors ${
        isPressed ? 'bg-accent/20 text-accent' : 'bg-surface-overlay text-text-muted'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold">{label}</span>
        <span className="text-xs font-mono">{(currentPosition / 250).toFixed(1)}mm</span>
      </div>
      {/* Live position bar */}
      <div className="mt-1 h-2 bg-black/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-none"
          style={{
            width: `${Math.min(100, (currentPosition / 1000) * 100)}%`,
            backgroundColor: isPressed ? 'var(--color-accent)' : 'var(--color-text-muted)'
          }}
        />
      </div>
    </div>
  )
}
