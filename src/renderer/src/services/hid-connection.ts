import {
  USB_VID,
  USB_PID,
  USAGE_PAGE,
  USAGE,
  REPORT_ID_COMMAND,
  COMMAND_TIMEOUT_MS,
  MULTI_PACKET_TIMEOUT_MS,
  type ParsedResponse
} from '../types/hid-protocol'
import { buildCommand, buildMultiPacketCommand, parseResponse, reassembleMultiPacket } from './hid-protocol'

type ResponseResolver = {
  resolve: (response: ParsedResponse) => void
  reject: (error: Error) => void
  responseId: number
  timer: ReturnType<typeof setTimeout>
}

type MultiPacketCollector = {
  packets: Map<number, Uint8Array>
  totalPackets: number
  resolve: (data: Uint8Array) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

// Pending response resolvers indexed by expected response command ID
let pendingResolvers: ResponseResolver[] = []
let multiPacketCollectors: Map<number, MultiPacketCollector> = new Map()
let inputReportListener: ((ev: HIDInputReportEvent) => void) | null = null
let activeListenerDevice: HIDDevice | null = null

function handleInputReport(event: HIDInputReportEvent): void {
  console.log('[HID DEBUG] inputreport event:', {
    reportId: event.reportId,
    byteLength: event.data.byteLength,
    firstBytes: Array.from(new Uint8Array(event.data.buffer, event.data.byteOffset, Math.min(8, event.data.byteLength)))
  })
  const data = event.data
  const responseId = data.getUint8(0)

  // Check if this is a multi-packet collection in progress
  const collector = multiPacketCollectors.get(responseId)
  if (collector) {
    const parsed = parseResponse(data)
    collector.packets.set(parsed.sequence, parsed.payload)

    if (collector.packets.size === collector.totalPackets) {
      clearTimeout(collector.timer)
      multiPacketCollectors.delete(responseId)
      const assembled = reassembleMultiPacket(collector.packets, collector.totalPackets)
      if (assembled) {
        collector.resolve(assembled)
      } else {
        collector.reject(new Error('Failed to reassemble multi-packet response'))
      }
    }
    return
  }

  // Check for single-packet pending resolvers
  const idx = pendingResolvers.findIndex((r) => r.responseId === responseId)
  if (idx !== -1) {
    const resolver = pendingResolvers[idx]
    pendingResolvers.splice(idx, 1)
    clearTimeout(resolver.timer)

    const parsed = parseResponse(data)

    // If multi-packet, start a collector
    if (parsed.totalPackets > 1) {
      const packets = new Map<number, Uint8Array>()
      packets.set(parsed.sequence, parsed.payload)

      const multiCollector: MultiPacketCollector = {
        packets,
        totalPackets: parsed.totalPackets,
        resolve: (assembled) => resolver.resolve({ ...parsed, payload: assembled }),
        reject: resolver.reject,
        timer: setTimeout(() => {
          multiPacketCollectors.delete(responseId)
          resolver.reject(new Error(`Multi-packet response timeout for command 0x${responseId.toString(16)}`))
        }, MULTI_PACKET_TIMEOUT_MS)
      }
      multiPacketCollectors.set(responseId, multiCollector)
    } else {
      resolver.resolve(parsed)
    }
  }
}

function attachListener(device: HIDDevice): void {
  // If listener is already on this exact device, nothing to do
  if (inputReportListener && activeListenerDevice === device) return

  // Move listener from old device to new one (e.g., auto-connect vs manual connect
  // may return different HIDDevice objects for the same physical device)
  if (inputReportListener && activeListenerDevice) {
    activeListenerDevice.removeEventListener('inputreport', inputReportListener)
  }

  inputReportListener = handleInputReport
  device.addEventListener('inputreport', inputReportListener)
  activeListenerDevice = device
}

function detachListener(device: HIDDevice): void {
  if (inputReportListener) {
    device.removeEventListener('inputreport', inputReportListener)
    inputReportListener = null
    activeListenerDevice = null
  }
  // Clean up pending resolvers
  for (const r of pendingResolvers) {
    clearTimeout(r.timer)
    r.reject(new Error('Device disconnected'))
  }
  pendingResolvers = []
  for (const [, c] of multiPacketCollectors) {
    clearTimeout(c.timer)
    c.reject(new Error('Device disconnected'))
  }
  multiPacketCollectors = new Map()
}

/**
 * Request a HID device via user gesture (device picker).
 */
export async function requestDevice(): Promise<HIDDevice | null> {
  const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: USB_VID, productId: USB_PID, usagePage: USAGE_PAGE, usage: USAGE }]
  })
  return devices[0] ?? null
}

/**
 * Get a previously-paired device without user gesture.
 */
export async function getConnectedDevice(): Promise<HIDDevice | null> {
  const devices = await navigator.hid.getDevices()
  return (
    devices.find((d) => d.vendorId === USB_VID && d.productId === USB_PID) ?? null
  )
}

/**
 * Open a HID device and attach the input report listener.
 */
export async function openDevice(device: HIDDevice): Promise<void> {
  if (!device.opened) {
    try {
      await device.open()
    } catch (err) {
      // If another connection attempt already opened it, that's fine
      if (err instanceof DOMException && err.name === 'InvalidStateError' && device.opened) {
        // Device was opened by a concurrent attempt — continue
      } else {
        throw err
      }
    }
  }
  attachListener(device)
}

/**
 * Close a HID device and clean up listeners.
 */
export async function closeDevice(device: HIDDevice): Promise<void> {
  detachListener(device)
  if (device.opened) {
    await device.close()
  }
}

/**
 * Send a simple command and wait for the response.
 */
export async function sendCommand(
  device: HIDDevice,
  commandId: number,
  payload?: Uint8Array
): Promise<ParsedResponse> {
  const report = buildCommand(commandId, payload)
  console.log('[HID DEBUG] sendCommand:', {
    commandId: '0x' + commandId.toString(16),
    reportSize: report.length,
    deviceOpened: device.opened,
    deviceProductName: device.productName
  })
  const responsePromise = waitForResponse(commandId)
  try {
    await device.sendReport(REPORT_ID_COMMAND, report as unknown as BufferSource)
    console.log('[HID DEBUG] sendReport completed successfully')
  } catch (err) {
    console.error('[HID DEBUG] sendReport FAILED:', err)
    throw err
  }
  return responsePromise
}

/**
 * Send a multi-packet command (e.g., SET_CONFIG) and wait for acknowledgment.
 */
export async function sendMultiPacketCommand(
  device: HIDDevice,
  commandId: number,
  data: Uint8Array
): Promise<ParsedResponse> {
  const packets = buildMultiPacketCommand(commandId, data)
  const responsePromise = waitForResponse(commandId)

  for (const packet of packets) {
    await device.sendReport(REPORT_ID_COMMAND, packet as unknown as BufferSource)
    // Small delay between packets to avoid overwhelming the device
    await new Promise((resolve) => setTimeout(resolve, 5))
  }

  return responsePromise
}

/**
 * Send a command that doesn't expect a response (fire-and-forget).
 */
export async function sendCommandNoResponse(
  device: HIDDevice,
  commandId: number,
  payload?: Uint8Array
): Promise<void> {
  const report = buildCommand(commandId, payload)
  await device.sendReport(REPORT_ID_COMMAND, report as unknown as BufferSource)
}

function waitForResponse(responseId: number): Promise<ParsedResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = pendingResolvers.findIndex((r) => r.timer === timer)
      if (idx !== -1) pendingResolvers.splice(idx, 1)
      reject(new Error(`Command timeout waiting for response 0x${responseId.toString(16)}`))
    }, COMMAND_TIMEOUT_MS)

    pendingResolvers.push({ resolve, reject, responseId, timer })
  })
}

/**
 * Register a callback for real-time analog data reports.
 * Returns an unsubscribe function.
 */
export function onRealtimeData(
  device: HIDDevice,
  callback: (buttonPositions: number[], buttonCount: number, pressedMask: number) => void
): () => void {
  const handler = (event: HIDInputReportEvent): void => {
    if (event.reportId !== 2) return // Report ID 2 for realtime data
    const data = event.data
    if (data.getUint8(0) !== 0x10) return // Check realtime marker

    const buttonCount = data.getUint8(1)
    const positions: number[] = []
    for (let i = 0; i < buttonCount; i++) {
      positions.push(data.getInt16(2 + i * 2, true))
    }

    // Parse pressed-state bitmask if present (firmware v2.1+)
    const bitmaskOffset = 2 + buttonCount * 2
    const pressedMask =
      data.byteLength > bitmaskOffset + 1 ? data.getUint16(bitmaskOffset, true) : 0
    callback(positions, buttonCount, pressedMask)
  }

  device.addEventListener('inputreport', handler)
  return () => device.removeEventListener('inputreport', handler)
}
