import { useEffect, useRef } from 'react'

interface ButtonVisualProps {
  index: number
  label: string
  x: number
  y: number
  width: number
  height: number
  isSelected: boolean
  actuationPoint: number // firmware scale 0-1000
  positionsRef: React.RefObject<number[]>
  pressedMaskRef: React.RefObject<number>
  hasFirmwareMaskRef: React.RefObject<boolean>
  onClick: (index: number, event: React.MouseEvent) => void
}

export function ButtonVisual({
  index,
  label,
  x,
  y,
  width,
  height,
  isSelected,
  actuationPoint,
  positionsRef,
  pressedMaskRef,
  hasFirmwareMaskRef,
  onClick
}: ButtonVisualProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)

  // Imperitive rAF loop for smooth 60fps updates without React re-renders
  useEffect(() => {
    const animate = (): void => {
      const position = positionsRef.current[index] ?? 0
      const normalizedPosition = Math.max(0, Math.min(1, position / 1000))
      // Use firmware bitmask for pressed state if firmware supports it, fallback to position check
      const mask = pressedMaskRef.current
      const isPressed = hasFirmwareMaskRef.current
        ? (mask & (1 << index)) !== 0
        : position >= actuationPoint

      // Update depth bar height
      if (barRef.current) {
        barRef.current.style.height = `${normalizedPosition * 100}%`
        barRef.current.style.backgroundColor = isPressed
          ? 'var(--color-accent)'
          : 'var(--color-primary)'
      }

      // Update container glow
      if (containerRef.current) {
        containerRef.current.style.boxShadow = isPressed
          ? '0 0 12px var(--color-accent), inset 0 0 8px rgba(6, 182, 212, 0.15)'
          : 'none'
        containerRef.current.style.borderColor = isPressed
          ? 'var(--color-accent)'
          : isSelected
            ? 'var(--color-primary)'
            : 'var(--color-surface-border)'
      }

      // Update value text
      if (valueRef.current) {
        valueRef.current.textContent = `${(position / 250).toFixed(1)}`
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [index, actuationPoint, isSelected, positionsRef, pressedMaskRef, hasFirmwareMaskRef])

  const actuationPercent = (actuationPoint / 1000) * 100

  return (
    <div
      ref={containerRef}
      onClick={(e) => onClick(index, e)}
      className="absolute flex flex-col items-center justify-between rounded-full border-2 cursor-pointer transition-colors bg-surface-raised overflow-hidden"
      style={{
        left: x,
        top: y,
        width,
        height,
        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-border)'
      }}
    >
      {/* Button label */}
      <span className="text-[10px] font-bold text-text-primary mt-1 z-10 pointer-events-none">
        {label}
      </span>

      {/* Depth bar container */}
      <div className="relative w-full flex-1 mx-1">
        {/* Depth bar fill (top-down) */}
        <div
          ref={barRef}
          className="absolute top-0 left-0 right-0 transition-none"
          style={{ height: '0%', backgroundColor: 'var(--color-primary)', opacity: 0.4 }}
        />

        {/* Actuation point marker */}
        <div
          ref={markerRef}
          className="absolute left-0 right-0 h-0.5 bg-danger z-10"
          style={{ top: `${actuationPercent}%` }}
        />
      </div>

      {/* Current value */}
      <span
        ref={valueRef}
        className="text-[9px] font-mono text-text-muted mb-0.5 z-10 pointer-events-none"
      >
        0.0
      </span>
    </div>
  )
}
