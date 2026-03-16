import type { DeviceConfig } from '../types/config'

/**
 * Serialize a DeviceConfig to binary format for sending to the device.
 *
 * Binary layout (little-endian):
 * Offset 0:   rapidTrigger (uint8, 0 or 1)
 * Offset 1:   continuousRapidTrigger (uint8, 0 or 1)
 * Offset 2-5: rapidTriggerSensitivity (int32 LE)
 * Offset 6+:  actuationPoints[N] (int32 LE each)
 * Then:       minRawValues[N] (int32 LE each)
 * Then:       maxRawValues[N] (int32 LE each)
 */
export function serializeConfig(config: DeviceConfig, buttonCount: number): Uint8Array {
  const totalBytes = 2 + 4 + buttonCount * 4 * 3
  const buffer = new ArrayBuffer(totalBytes)
  const view = new DataView(buffer)
  let offset = 0

  // Booleans
  view.setUint8(offset, config.rapidTrigger ? 1 : 0)
  offset += 1
  view.setUint8(offset, config.continuousRapidTrigger ? 1 : 0)
  offset += 1

  // Rapid trigger sensitivity
  view.setInt32(offset, config.rapidTriggerSensitivity, true)
  offset += 4

  // Actuation points
  for (let i = 0; i < buttonCount; i++) {
    view.setInt32(offset, config.actuationPoints[i] ?? 0, true)
    offset += 4
  }

  // Min raw values
  for (let i = 0; i < buttonCount; i++) {
    view.setInt32(offset, config.minRawValues[i] ?? 0, true)
    offset += 4
  }

  // Max raw values
  for (let i = 0; i < buttonCount; i++) {
    view.setInt32(offset, config.maxRawValues[i] ?? 0, true)
    offset += 4
  }

  return new Uint8Array(buffer)
}

/**
 * Deserialize binary config data received from the device into a DeviceConfig.
 */
export function deserializeConfig(data: Uint8Array, buttonCount: number): DeviceConfig {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 0

  const rapidTrigger = view.getUint8(offset) !== 0
  offset += 1
  const continuousRapidTrigger = view.getUint8(offset) !== 0
  offset += 1

  const rapidTriggerSensitivity = view.getInt32(offset, true)
  offset += 4

  const actuationPoints: number[] = []
  for (let i = 0; i < buttonCount; i++) {
    actuationPoints.push(view.getInt32(offset, true))
    offset += 4
  }

  const minRawValues: number[] = []
  for (let i = 0; i < buttonCount; i++) {
    minRawValues.push(view.getInt32(offset, true))
    offset += 4
  }

  const maxRawValues: number[] = []
  for (let i = 0; i < buttonCount; i++) {
    maxRawValues.push(view.getInt32(offset, true))
    offset += 4
  }

  return {
    rapidTrigger,
    continuousRapidTrigger,
    rapidTriggerSensitivity,
    actuationPoints,
    minRawValues,
    maxRawValues
  }
}
