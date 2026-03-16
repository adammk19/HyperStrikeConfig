import { useCallback, useEffect, useRef } from 'react'
import { useDeviceState, useDeviceDispatch } from '../context/DeviceContext'
import { CMD_START_REALTIME, CMD_STOP_REALTIME } from '../types/hid-protocol'
import { sendCommandNoResponse, onRealtimeData } from '../services/hid-connection'

const WATCHDOG_TIMEOUT_MS = 3000

export function useRealtimeData(): {
  positions: React.RefObject<number[]>
  pressedMask: React.RefObject<number>
  hasFirmwareMask: React.RefObject<boolean>
  startStreaming: () => Promise<void>
  stopStreaming: () => Promise<void>
  isStreaming: React.RefObject<boolean>
} {
  const { device, deviceInfo, connectionState } = useDeviceState()
  const dispatch = useDeviceDispatch()
  const positions = useRef<number[]>([])
  const pressedMask = useRef<number>(0)
  const hasFirmwareMask = useRef<boolean>(false)
  const isStreaming = useRef(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const lastDataTime = useRef<number>(0)
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize positions array when device info changes
  useEffect(() => {
    if (deviceInfo) {
      positions.current = new Array(deviceInfo.buttonCount).fill(0)
    }
  }, [deviceInfo])

  const stopWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  const startStreaming = useCallback(async () => {
    if (!device || !deviceInfo || isStreaming.current) return

    // Register data handler
    unsubscribeRef.current = onRealtimeData(device, (newPositions, _buttonCount, mask) => {
      positions.current = newPositions
      pressedMask.current = mask
      if (mask !== 0) hasFirmwareMask.current = true
      lastDataTime.current = Date.now()
    })

    // Send start command
    await sendCommandNoResponse(device, CMD_START_REALTIME)
    isStreaming.current = true
    lastDataTime.current = Date.now()

    // Start watchdog to detect silent disconnects
    stopWatchdog()
    watchdogRef.current = setInterval(() => {
      if (isStreaming.current && lastDataTime.current > 0) {
        const elapsed = Date.now() - lastDataTime.current
        if (elapsed > WATCHDOG_TIMEOUT_MS) {
          stopWatchdog()
          isStreaming.current = false
          if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
          }
          dispatch({ type: 'DISCONNECT' })
        }
      }
    }, 1000)
  }, [device, deviceInfo, dispatch, stopWatchdog])

  const stopStreaming = useCallback(async () => {
    if (!device || !isStreaming.current) return

    stopWatchdog()

    try {
      await sendCommandNoResponse(device, CMD_STOP_REALTIME)
    } catch {
      // Best effort
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    isStreaming.current = false
  }, [device, stopWatchdog])

  // Auto-start streaming when connected, stop on disconnect
  useEffect(() => {
    if (connectionState === 'connected' && device && deviceInfo) {
      startStreaming()
    }

    return () => {
      stopWatchdog()
      try {
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
          unsubscribeRef.current = null
        }
      } catch {
        // Device already disconnected
      }
      isStreaming.current = false
    }
  }, [connectionState, device, deviceInfo, startStreaming, stopWatchdog])

  return { positions, pressedMask, hasFirmwareMask, startStreaming, stopStreaming, isStreaming }
}
