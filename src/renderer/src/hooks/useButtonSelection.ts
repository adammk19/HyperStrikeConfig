import { useCallback, useState, useRef, useEffect } from 'react'

export function useButtonSelection(
  buttonCount: number,
  onSelectionChange?: (selected: Set<number>) => void
): {
  selectedButtons: Set<number>
  selectButton: (index: number, event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => void
  clearSelection: () => void
  isSelected: (index: number) => boolean
} {
  const [selectedButtons, setSelectedButtons] = useState<Set<number>>(new Set())
  const lastClickedRef = useRef<number | null>(null)

  // Notify parent whenever selection changes
  useEffect(() => {
    onSelectionChange?.(selectedButtons)
  }, [selectedButtons, onSelectionChange])

  const selectButton = useCallback(
    (
      index: number,
      event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }
    ) => {
      setSelectedButtons((prev) => {
        const next = new Set(prev)

        if (event.shiftKey && lastClickedRef.current !== null) {
          const start = Math.min(lastClickedRef.current, index)
          const end = Math.max(lastClickedRef.current, index)
          for (let i = start; i <= end; i++) {
            if (i < buttonCount) next.add(i)
          }
        } else if (event.ctrlKey || event.metaKey) {
          if (next.has(index)) {
            next.delete(index)
          } else {
            next.add(index)
          }
        } else {
          next.clear()
          next.add(index)
        }

        lastClickedRef.current = index
        return next
      })
    },
    [buttonCount]
  )

  const clearSelection = useCallback(() => {
    setSelectedButtons(new Set())
    lastClickedRef.current = null
  }, [])

  const isSelected = useCallback(
    (index: number) => selectedButtons.has(index),
    [selectedButtons]
  )

  return { selectedButtons, selectButton, clearSelection, isSelected }
}
