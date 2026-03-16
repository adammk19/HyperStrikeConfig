import { useCallback } from 'react'
import { useDeviceState, useDeviceDispatch } from '../context/DeviceContext'
import type { DeviceConfig } from '../types/config'
import { CMD_GET_CONFIG, CMD_SET_CONFIG, CMD_RESET_DEFAULTS, STATUS_OK } from '../types/hid-protocol'
import { sendCommand, sendMultiPacketCommand } from '../services/hid-connection'
import { serializeConfig, deserializeConfig } from '../services/config-serializer'

export function useDeviceConfig(): {
  readConfig: () => Promise<void>
  updateConfig: (partial: Partial<DeviceConfig>) => void
  updateActuationPoints: (buttonIndices: number[], value: number) => void
  saveConfig: () => Promise<void>
  resetToDefaults: () => Promise<void>
} {
  const state = useDeviceState()
  const dispatch = useDeviceDispatch()

  const readConfig = useCallback(async () => {
    if (!state.device || !state.deviceInfo) return

    const response = await sendCommand(state.device, CMD_GET_CONFIG)
    if (response.status !== STATUS_OK) {
      throw new Error('Failed to read config')
    }
    const config = deserializeConfig(response.payload, state.deviceInfo.buttonCount)
    dispatch({ type: 'CONFIG_LOADED', config })
  }, [state.device, state.deviceInfo, dispatch])

  const updateConfig = useCallback(
    (partial: Partial<DeviceConfig>) => {
      if (!state.pendingConfig) return
      dispatch({
        type: 'CONFIG_CHANGED',
        config: { ...state.pendingConfig, ...partial }
      })
    },
    [state.pendingConfig, dispatch]
  )

  const updateActuationPoints = useCallback(
    (buttonIndices: number[], value: number) => {
      if (!state.pendingConfig) return
      const newPoints = [...state.pendingConfig.actuationPoints]
      for (const idx of buttonIndices) {
        if (idx >= 0 && idx < newPoints.length) {
          newPoints[idx] = value
        }
      }
      dispatch({
        type: 'CONFIG_CHANGED',
        config: { ...state.pendingConfig, actuationPoints: newPoints }
      })
    },
    [state.pendingConfig, dispatch]
  )

  const saveConfig = useCallback(async () => {
    if (!state.device || !state.deviceInfo || !state.pendingConfig) return

    const data = serializeConfig(state.pendingConfig, state.deviceInfo.buttonCount)
    const response = await sendMultiPacketCommand(state.device, CMD_SET_CONFIG, data)
    if (response.status !== STATUS_OK) {
      throw new Error('Failed to save config')
    }
    dispatch({ type: 'CONFIG_SAVED' })
  }, [state.device, state.deviceInfo, state.pendingConfig, dispatch])

  const resetToDefaults = useCallback(async () => {
    if (!state.device || !state.deviceInfo) return

    const response = await sendCommand(state.device, CMD_RESET_DEFAULTS)
    if (response.status !== STATUS_OK) {
      throw new Error('Failed to reset to defaults')
    }

    // Re-read config from device
    const configResponse = await sendCommand(state.device, CMD_GET_CONFIG)
    if (configResponse.status !== STATUS_OK) {
      throw new Error('Failed to read config after reset')
    }
    const config = deserializeConfig(configResponse.payload, state.deviceInfo.buttonCount)
    dispatch({ type: 'CONFIG_RESET', config })
  }, [state.device, state.deviceInfo, dispatch])

  return { readConfig, updateConfig, updateActuationPoints, saveConfig, resetToDefaults }
}
