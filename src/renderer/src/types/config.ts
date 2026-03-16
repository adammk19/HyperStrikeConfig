export interface DeviceConfig {
  rapidTrigger: boolean
  continuousRapidTrigger: boolean
  rapidTriggerSensitivity: number // firmware scale: 25 = 0.1mm, 575 = 2.3mm
  actuationPoints: number[] // per-button, firmware scale: 25 = 0.1mm, 1000 = 4.0mm
  minRawValues: number[] // per-button calibration min
  maxRawValues: number[] // per-button calibration max
}

// Firmware value scale helpers
export const FIRMWARE_SCALE = 250 // 1mm = 250 units
export const MIN_ACTUATION_MM = 0.1
export const MAX_ACTUATION_MM = 4.0
export const MIN_ACTUATION_FW = Math.round(MIN_ACTUATION_MM * FIRMWARE_SCALE) // 25
export const MAX_ACTUATION_FW = Math.round(MAX_ACTUATION_MM * FIRMWARE_SCALE) // 1000
export const MIN_RT_SENSITIVITY_MM = 0.1
export const MAX_RT_SENSITIVITY_MM = 2.3
export const MIN_RT_SENSITIVITY_FW = Math.round(MIN_RT_SENSITIVITY_MM * FIRMWARE_SCALE) // 25
export const MAX_RT_SENSITIVITY_FW = Math.round(MAX_RT_SENSITIVITY_MM * FIRMWARE_SCALE) // 575

export function firmwareToMm(value: number): number {
  return value / FIRMWARE_SCALE
}

export function mmToFirmware(mm: number): number {
  return Math.round(mm * FIRMWARE_SCALE)
}

export function createDefaultConfig(buttonCount: number): DeviceConfig {
  return {
    rapidTrigger: false,
    continuousRapidTrigger: false,
    rapidTriggerSensitivity: mmToFirmware(0.5), // 0.5mm default
    actuationPoints: new Array(buttonCount).fill(mmToFirmware(2.0)), // 2.0mm default
    minRawValues: new Array(buttonCount).fill(0),
    maxRawValues: new Array(buttonCount).fill(1000)
  }
}
