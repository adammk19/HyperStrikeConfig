import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { ConnectionState, DeviceInfo } from '../types/device'
import type { DeviceConfig } from '../types/config'
import type { FirmwareUpdateStep } from '../types/firmware'

// State
export interface DeviceState {
  connectionState: ConnectionState
  device: HIDDevice | null
  deviceInfo: DeviceInfo | null
  config: DeviceConfig | null
  pendingConfig: DeviceConfig | null
  isDirty: boolean
  isCalibrating: boolean
  firmwareUpdateStep: FirmwareUpdateStep
  error: string | null
}

const initialState: DeviceState = {
  connectionState: 'disconnected',
  device: null,
  deviceInfo: null,
  config: null,
  pendingConfig: null,
  isDirty: false,
  isCalibrating: false,
  firmwareUpdateStep: 'idle',
  error: null
}

// Actions
export type DeviceAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; device: HIDDevice; info: DeviceInfo }
  | { type: 'DISCONNECT' }
  | { type: 'RECONNECT_START' }
  | { type: 'CONFIG_LOADED'; config: DeviceConfig }
  | { type: 'CONFIG_CHANGED'; config: DeviceConfig }
  | { type: 'CONFIG_SAVED' }
  | { type: 'CONFIG_RESET'; config: DeviceConfig }
  | { type: 'CALIBRATION_START' }
  | { type: 'CALIBRATION_STOP' }
  | { type: 'FIRMWARE_UPDATE_STEP'; step: FirmwareUpdateStep }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }

function deviceReducer(state: DeviceState, action: DeviceAction): DeviceState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, connectionState: 'connecting', error: null }
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        connectionState: 'connected',
        device: action.device,
        deviceInfo: action.info,
        error: null
      }
    case 'DISCONNECT':
      return {
        ...state,
        connectionState: 'disconnected',
        device: null,
        deviceInfo: null,
        config: null,
        pendingConfig: null,
        isDirty: false,
        isCalibrating: false,
        error: null
      }
    case 'RECONNECT_START':
      return { ...state, connectionState: 'reconnecting' }
    case 'CONFIG_LOADED':
      return {
        ...state,
        config: action.config,
        pendingConfig: { ...action.config },
        isDirty: false
      }
    case 'CONFIG_CHANGED':
      return {
        ...state,
        pendingConfig: action.config,
        isDirty: true
      }
    case 'CONFIG_SAVED':
      return {
        ...state,
        config: state.pendingConfig ? { ...state.pendingConfig } : state.config,
        isDirty: false
      }
    case 'CONFIG_RESET':
      return {
        ...state,
        config: action.config,
        pendingConfig: { ...action.config },
        isDirty: false
      }
    case 'CALIBRATION_START':
      return { ...state, isCalibrating: true }
    case 'CALIBRATION_STOP':
      return { ...state, isCalibrating: false }
    case 'FIRMWARE_UPDATE_STEP':
      return { ...state, firmwareUpdateStep: action.step }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

// Context
const DeviceStateContext = createContext<DeviceState | null>(null)
const DeviceDispatchContext = createContext<React.Dispatch<DeviceAction> | null>(null)

export function DeviceProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(deviceReducer, initialState)

  return (
    <DeviceStateContext.Provider value={state}>
      <DeviceDispatchContext.Provider value={dispatch}>{children}</DeviceDispatchContext.Provider>
    </DeviceStateContext.Provider>
  )
}

export function useDeviceState(): DeviceState {
  const state = useContext(DeviceStateContext)
  if (!state) throw new Error('useDeviceState must be used within DeviceProvider')
  return state
}

export function useDeviceDispatch(): React.Dispatch<DeviceAction> {
  const dispatch = useContext(DeviceDispatchContext)
  if (!dispatch) throw new Error('useDeviceDispatch must be used within DeviceProvider')
  return dispatch
}
