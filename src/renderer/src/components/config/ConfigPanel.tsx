import { useEffect, useState } from 'react'
import { useDeviceState } from '../../context/DeviceContext'
import { useDeviceConfig } from '../../hooks/useDeviceConfig'
import { ControllerType } from '../../types/device'
import { CalibrationOverlay } from '../calibration/CalibrationOverlay'
import { Button } from '../common/Button'
import { FirmwarePanel } from '../firmware/FirmwarePanel'
import { ActuationSlider } from './ActuationSlider'
import { RapidTriggerSection } from './RapidTriggerSection'
import { SaveResetBar } from './SaveResetBar'

const LABELS_12 = ['L', 'R', 'U', 'D', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']
const LABELS_14 = ['L', 'R', 'U', 'D', 'B1', 'B2', 'B3', 'B4', 'M1', 'M2', 'B5', 'B6', 'B7', 'B8']

interface ConfigPanelProps {
  selectedButtons: Set<number>
  requestedTab?: Tab | null
  onTabChanged?: () => void
}

type Tab = 'config' | 'firmware'

export function ConfigPanel({
  selectedButtons,
  requestedTab,
  onTabChanged
}: ConfigPanelProps): React.JSX.Element | null {
  const { pendingConfig, isDirty, deviceInfo } = useDeviceState()
  const { updateConfig, updateActuationPoints, saveConfig, resetToDefaults } = useDeviceConfig()
  const [showCalibration, setShowCalibration] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('config')

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab)
      onTabChanged?.()
    }
  }, [requestedTab, onTabChanged])

  if (!pendingConfig) return null

  const buttonLabels =
    deviceInfo?.controllerType === ControllerType.Mini ||
    deviceInfo?.controllerType === ControllerType.FoundersEdition
      ? LABELS_12
      : LABELS_14

  const getSelectedLabel = (): string => {
    if (selectedButtons.size === 0) return 'No buttons selected'
    if (selectedButtons.size === 1) {
      const idx = Array.from(selectedButtons)[0]!
      return buttonLabels[idx] ?? `Button ${idx + 1}`
    }
    return Array.from(selectedButtons)
      .sort((a, b) => a - b)
      .map((idx) => buttonLabels[idx] ?? `B${idx + 1}`)
      .join(', ')
  }

  const handleModeChange = (mode: 'off' | 'on' | 'continuous'): void => {
    updateConfig({
      rapidTrigger: mode !== 'off',
      continuousRapidTrigger: mode === 'continuous'
    })
  }

  return (
    <>
      <div className="w-80 bg-surface-raised border-l border-surface-border flex flex-col shrink-0">
        {/* Tab selector */}
        <div className="flex border-b border-surface-border">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('firmware')}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'firmware'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Firmware
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'config' && (
            <>
              {/* Selected buttons indicator */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-text-primary">Selected Buttons</h4>
                <p className="text-xs text-text-muted">{getSelectedLabel()}</p>
              </div>

              {/* Actuation point */}
              <ActuationSlider
                selectedButtons={selectedButtons}
                actuationPoints={pendingConfig.actuationPoints}
                onChange={updateActuationPoints}
              />

              {/* Rapid trigger */}
              <RapidTriggerSection
                rapidTrigger={pendingConfig.rapidTrigger}
                continuousRapidTrigger={pendingConfig.continuousRapidTrigger}
                sensitivity={pendingConfig.rapidTriggerSensitivity}
                onModeChange={handleModeChange}
                onSensitivityChange={(v) => updateConfig({ rapidTriggerSensitivity: v })}
              />

              {/* Calibrate button */}
              <Button
                variant="secondary"
                onClick={() => setShowCalibration(true)}
                className="w-full"
              >
                Calibrate Buttons
              </Button>

              {/* Save / Reset */}
              <SaveResetBar isDirty={isDirty} onSave={saveConfig} onReset={resetToDefaults} />
            </>
          )}

          {activeTab === 'firmware' && <FirmwarePanel />}
        </div>
      </div>

      <CalibrationOverlay open={showCalibration} onClose={() => setShowCalibration(false)} />
    </>
  )
}
