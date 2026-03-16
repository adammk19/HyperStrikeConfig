import { useCallback, useEffect, useRef } from 'react'
import { useDeviceState, useDeviceDispatch } from '../context/DeviceContext'
import { ControllerType, type DeviceInfo } from '../types/device'
import { USB_VID, USB_PID, CMD_GET_DEVICE_INFO, CMD_GET_CONFIG, CMD_STOP_REALTIME, RECONNECT_INTERVAL_MS, RECONNECT_MAX_ATTEMPTS, STATUS_OK } from '../types/hid-protocol'
import { requestDevice, getConnectedDevice, openDevice, closeDevice, sendCommand } from '../services/hid-connection'
import { deserializeConfig } from '../services/config-serializer'

function parseDeviceInfo(payload: Uint8Array): DeviceInfo {
  return {
    controllerType: payload[0] as ControllerType,
    buttonCount: payload[1],
    firmwareVersion: {
      major: payload[2],
      minor: payload[3],
      patch: payload[4]
    }
  }
}

export function useDeviceConnection(): {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
} {
  const state = useDeviceState()
  const dispatch = useDeviceDispatch()
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const suppressReconnectRef = useRef(false)

  const stopReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const connectToDevice = useCallback(
    async (device: HIDDevice) => {
      await openDevice(device)

      // Get device info
      const infoResponse = await sendCommand(device, CMD_GET_DEVICE_INFO)
      if (infoResponse.status !== STATUS_OK) {
        throw new Error('Failed to get device info')
      }
      const info = parseDeviceInfo(infoResponse.payload)
      dispatch({ type: 'CONNECT_SUCCESS', device, info })

      // Get config
      const configResponse = await sendCommand(device, CMD_GET_CONFIG)
      if (configResponse.status !== STATUS_OK) {
        throw new Error('Failed to get device config')
      }
      const config = deserializeConfig(configResponse.payload, info.buttonCount)
      dispatch({ type: 'CONFIG_LOADED', config })
    },
    [dispatch]
  )

  const startReconnect = useCallback(() => {
    if (suppressReconnectRef.current) return
    dispatch({ type: 'RECONNECT_START' })
    let attempts = 0

    reconnectTimerRef.current = setInterval(async () => {
      attempts++
      if (attempts > RECONNECT_MAX_ATTEMPTS) {
        stopReconnect()
        dispatch({ type: 'DISCONNECT' })
        return
      }

      try {
        const device = await getConnectedDevice()
        if (device) {
          stopReconnect()
          await connectToDevice(device)
        }
      } catch {
        // Keep trying
      }
    }, RECONNECT_INTERVAL_MS)
  }, [dispatch, connectToDevice, stopReconnect])

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async (): Promise<void> => {
      try {
        const device = await getConnectedDevice()
        if (device) {
          dispatch({ type: 'CONNECT_START' })
          await connectToDevice(device)
        }
      } catch (err) {
        console.error('[HID DEBUG] Auto-connect failed:', err)
        dispatch({ type: 'DISCONNECT' })
      }
    }
    autoConnect()
  }, [dispatch, connectToDevice])

  // Listen for disconnects
  useEffect(() => {
    const handleDisconnect = (event: HIDConnectionEvent): void => {
      if (
        state.device &&
        (event.device === state.device ||
          (event.device.vendorId === USB_VID && event.device.productId === USB_PID))
      ) {
        dispatch({ type: 'DISCONNECT' })
        startReconnect()
      }
    }

    navigator.hid.addEventListener('disconnect', handleDisconnect)
    return () => {
      navigator.hid.removeEventListener('disconnect', handleDisconnect)
      stopReconnect()
    }
  }, [state.device, dispatch, startReconnect, stopReconnect])

  const connect = useCallback(async () => {
    dispatch({ type: 'CONNECT_START' })
    try {
      const device = await requestDevice()
      if (!device) {
        dispatch({ type: 'DISCONNECT' })
        return
      }
      await connectToDevice(device)
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'Connection failed'
      })
      dispatch({ type: 'DISCONNECT' })
    }
  }, [dispatch, connectToDevice])

  const disconnect = useCallback(async () => {
    stopReconnect()
    if (state.device) {
      try {
        await sendCommand(state.device, CMD_STOP_REALTIME).catch(() => {})
        await closeDevice(state.device)
      } catch {
        // Best effort
      }
    }
    dispatch({ type: 'DISCONNECT' })
  }, [state.device, dispatch, stopReconnect])

  // Expose suppressReconnect for firmware update
  useEffect(() => {
    (window as unknown as { __suppressReconnect: (v: boolean) => void }).__suppressReconnect = (
      v: boolean
    ) => {
      suppressReconnectRef.current = v
    }
  }, [])

  return { connect, disconnect }
}
