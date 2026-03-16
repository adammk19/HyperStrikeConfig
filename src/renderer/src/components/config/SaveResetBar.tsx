import { useState } from 'react'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

interface SaveResetBarProps {
  isDirty: boolean
  onSave: () => Promise<void>
  onReset: () => Promise<void>
}

export function SaveResetBar({ isDirty, onSave, onReset }: SaveResetBarProps): React.JSX.Element {
  const [saving, setSaving] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (): Promise<void> => {
    setResetting(true)
    try {
      await onReset()
      setShowResetConfirm(false)
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="flex gap-3 pt-4 border-t border-surface-border">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save to Device'}
        </Button>
        <Button
          variant="danger"
          onClick={() => setShowResetConfirm(true)}
          disabled={resetting}
        >
          Reset to Default
        </Button>
      </div>

      <Modal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset to Defaults"
      >
        <p className="text-text-secondary mb-6">
          This will reset all settings to factory defaults on your controller.
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
