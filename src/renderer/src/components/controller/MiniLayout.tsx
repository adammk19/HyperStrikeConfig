import { ButtonVisual } from './ButtonVisual'

// Mini layout: 12 buttons, uniform 8px gap between all buttons
// L/D level, R slightly down-right, U under-left of B3
// Arc: B2/B5 higher, B1/B6 lower; same bottom row
const MINI_LAYOUT = [
  // Left hand — 8px gaps: L(0), D(64), R(128)
  { label: 'L', x: 0, y: 26, width: 56, height: 56 },        // index 0
  { label: 'R', x: 128, y: 40, width: 56, height: 56 },       // index 1
  { label: 'U', x: 160, y: 148, width: 56, height: 56 },      // index 2: between R and B3
  { label: 'D', x: 64, y: 26, width: 56, height: 56 },        // index 3

  // Right hand top row — 8px gaps: B1(192), B2(256), B5(320), B6(384)
  { label: 'B1', x: 192, y: 20, width: 56, height: 56 },      // index 4
  { label: 'B2', x: 256, y: 8, width: 56, height: 56 },       // index 5
  { label: 'B3', x: 192, y: 84, width: 56, height: 56 },      // index 6: under B1
  { label: 'B4', x: 256, y: 72, width: 56, height: 56 },      // index 7: under B2

  { label: 'B5', x: 320, y: 8, width: 56, height: 56 },       // index 8
  { label: 'B6', x: 384, y: 20, width: 56, height: 56 },      // index 9
  { label: 'B7', x: 320, y: 72, width: 56, height: 56 },      // index 10
  { label: 'B8', x: 384, y: 84, width: 56, height: 56 }       // index 11
]

interface MiniLayoutProps {
  selectedButtons: Set<number>
  actuationPoints: number[]
  positionsRef: React.RefObject<number[]>
  pressedMaskRef: React.RefObject<number>
  hasFirmwareMaskRef: React.RefObject<boolean>
  onButtonClick: (index: number, event: React.MouseEvent) => void
}

export function MiniLayout({
  selectedButtons,
  actuationPoints,
  positionsRef,
  pressedMaskRef,
  hasFirmwareMaskRef,
  onButtonClick
}: MiniLayoutProps): React.JSX.Element {
  return (
    <div className="relative" style={{ width: 440, height: 204 }}>
      {MINI_LAYOUT.map((btn, i) => (
        <ButtonVisual
          key={i}
          index={i}
          label={btn.label}
          x={btn.x}
          y={btn.y}
          width={btn.width}
          height={btn.height}
          isSelected={selectedButtons.has(i)}
          actuationPoint={actuationPoints[i] ?? 500}
          positionsRef={positionsRef}
          pressedMaskRef={pressedMaskRef}
          hasFirmwareMaskRef={hasFirmwareMaskRef}
          onClick={onButtonClick}
        />
      ))}
    </div>
  )
}
