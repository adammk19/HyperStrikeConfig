import {
  REPORT_SIZE,
  CMD_HEADER_SIZE,
  CMD_PAYLOAD_MAX,
  RESP_HEADER_SIZE,
  type ParsedResponse
} from '../types/hid-protocol'

/**
 * Build a single-packet HID output report.
 */
export function buildCommand(
  commandId: number,
  payload?: Uint8Array,
  seq: number = 0,
  total: number = 1
): Uint8Array {
  const report = new Uint8Array(REPORT_SIZE)
  report[0] = commandId
  report[1] = seq
  report[2] = total

  if (payload) {
    const copyLen = Math.min(payload.length, CMD_PAYLOAD_MAX)
    report.set(payload.subarray(0, copyLen), CMD_HEADER_SIZE)
  }

  return report
}

/**
 * Build multiple HID output reports for large payloads (e.g., SET_CONFIG).
 */
export function buildMultiPacketCommand(commandId: number, data: Uint8Array): Uint8Array[] {
  const totalPackets = Math.ceil(data.length / CMD_PAYLOAD_MAX)
  const packets: Uint8Array[] = []

  for (let i = 0; i < totalPackets; i++) {
    const start = i * CMD_PAYLOAD_MAX
    const end = Math.min(start + CMD_PAYLOAD_MAX, data.length)
    const chunk = data.subarray(start, end)
    packets.push(buildCommand(commandId, chunk, i, totalPackets))
  }

  return packets
}

/**
 * Parse an HID input report into a structured response.
 */
export function parseResponse(data: DataView): ParsedResponse {
  const responseId = data.getUint8(0)
  const status = data.getUint8(1)
  const sequence = data.getUint8(2)
  const totalPackets = data.getUint8(3)

  const payloadLength = data.byteLength - RESP_HEADER_SIZE
  const payload = new Uint8Array(payloadLength)
  for (let i = 0; i < payloadLength; i++) {
    payload[i] = data.getUint8(RESP_HEADER_SIZE + i)
  }

  return { responseId, status, sequence, totalPackets, payload }
}

/**
 * Reassemble a multi-packet response into a single payload buffer.
 */
export function reassembleMultiPacket(
  packets: Map<number, Uint8Array>,
  totalPackets: number
): Uint8Array | null {
  if (packets.size !== totalPackets) return null

  const totalLength = Array.from(packets.values()).reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (let i = 0; i < totalPackets; i++) {
    const packet = packets.get(i)
    if (!packet) return null
    result.set(packet, offset)
    offset += packet.length
  }

  return result
}
