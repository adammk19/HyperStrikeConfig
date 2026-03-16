import { ButtonVisual } from './ButtonVisual'

// Pro layout: 14 buttons, uniform 8px gap, more pronounced R stagger
// Same structure as Standard but R drops further
const PRO_LAYOUT = [
  // Left hand — 8px gaps: L(0), D(64), R(128)
  { label: 'L', x: 0, y: 26, width: 56, height: 56 },        // index 0
  { label: 'R', x: 128, y: 44, width: 56, height: 56 },       // index 1: deeper stagger
  { label: 'U', x: 160, y: 152, width: 56, height: 56 },      // index 2: between R and B3
  { label: 'D', x: 64, y: 26, width: 56, height: 56 },        // index 3

  // Right hand top row — 8px gaps
  { label: 'B1', x: 192, y: 22, width: 56, height: 56 },      // index 4
  { label: 'B2', x: 256, y: 8, width: 56, height: 56 },       // index 5
  { label: 'B3', x: 192, y: 86, width: 56, height: 56 },      // index 6: under B1
  { label: 'B4', x: 256, y: 72, width: 56, height: 56 },      // index 7: under B2

  // Modifiers flanking U
  { label: 'M1', x: 78, y: 134, width: 44, height: 44 },      // index 8: top-left of U
  { label: 'M2', x: 190, y: 148, width: 44, height: 44 },     // index 9: top-right of U

  { label: 'B5', x: 320, y: 8, width: 56, height: 56 },       // index 10
  { label: 'B6', x: 384, y: 22, width: 56, height: 56 },      // index 11
  { label: 'B7', x: 320, y: 72, width: 56, height: 56 },      // index 12
  { label: 'B8', x: 384, y: 86, width: 56, height: 56 }       // index 13
]

interface ProLayoutProps {
  selectedButtons: Set<number>
  actuationPoints: number[]
  positionsRef: React.RefObject<number[]>
  pressedMaskRef: React.RefObject<number>
  hasFirmwareMaskRef: React.RefObject<boolean>
  onButtonClick: (index: number, event: React.MouseEvent) => void
}

export function ProLayout({
  selectedButtons,
  actuationPoints,
  positionsRef,
  pressedMaskRef,
  hasFirmwareMaskRef,
  onButtonClick
}: ProLayoutProps): React.JSX.Element {
  return (
    <div className="relative" style={{ width: 440, height: 208 }}>
      {PRO_LAYOUT.map((btn, i) => (
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
