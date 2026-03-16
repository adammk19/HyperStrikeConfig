export enum ControllerType {
  Mini = 0x01,
  Standard = 0x02,
  Pro = 0x03,
  FoundersEdition = 0x04
}

export interface DeviceInfo {
  controllerType: ControllerType
  buttonCount: number
  firmwareVersion: {
    major: number
    minor: number
    patch: number
  }
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export const CONTROLLER_NAMES: Record<ControllerType, string> = {
  [ControllerType.Mini]: 'HyperStrike Mini',
  [ControllerType.Standard]: 'HyperStrike Standard',
  [ControllerType.Pro]: 'HyperStrike Pro',
  [ControllerType.FoundersEdition]: "HyperStrike Founder's Edition"
}

export function formatFirmwareVersion(info: DeviceInfo): string {
  const { major, minor, patch } = info.firmwareVersion
  return `${major}.${minor}.${patch}`
}
