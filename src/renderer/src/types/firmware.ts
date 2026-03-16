export interface FirmwareReleaseInfo {
  version: string
  downloadUrl: string
  releaseNotes: string
  publishedAt: string
}

export type FirmwareUpdateStep =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'rebooting'
  | 'waiting-for-boot-drive'
  | 'copying'
  | 'waiting-for-reconnect'
  | 'complete'
  | 'error'

export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const va = partsA[i] ?? 0
    const vb = partsB[i] ?? 0
    if (va !== vb) return va - vb
  }
  return 0
}
