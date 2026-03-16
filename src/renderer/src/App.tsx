import { useCallback, useState } from 'react'
import { ConfigPanel } from './components/config/ConfigPanel'
import { ConnectPrompt } from './components/connection/ConnectPrompt'
import { ReconnectBanner } from './components/connection/ReconnectBanner'
import { ControllerView } from './components/controller/ControllerView'
import { AppShell } from './components/layout/AppShell'
import { Header } from './components/layout/Header'
import { StatusBar } from './components/layout/StatusBar'
import { DeviceProvider, useDeviceState } from './context/DeviceContext'

function AppContent(): React.JSX.Element {
  const { connectionState } = useDeviceState()
  const [selectedButtons, setSelectedButtons] = useState<Set<number>>(new Set())
  const [requestedTab, setRequestedTab] = useState<'config' | 'firmware' | null>(null)

  const handleFirmwareClick = useCallback(() => {
    setRequestedTab('firmware')
  }, [])

  const handleTabChanged = useCallback(() => {
    setRequestedTab(null)
  }, [])

  return (
    <AppShell>
      <Header onFirmwareClick={handleFirmwareClick} />

      {connectionState === 'reconnecting' && <ReconnectBanner />}

      {connectionState !== 'connected' ? (
        <ConnectPrompt />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <ControllerView onSelectionChange={setSelectedButtons} />
          <ConfigPanel
            selectedButtons={selectedButtons}
            requestedTab={requestedTab}
            onTabChanged={handleTabChanged}
          />
        </div>
      )}

      <StatusBar />
    </AppShell>
  )
}

function App(): React.JSX.Element {
  return (
    <DeviceProvider>
      <AppContent />
    </DeviceProvider>
  )
}

export default App
