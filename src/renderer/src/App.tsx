import { useState } from 'react'
import { DeviceProvider, useDeviceState } from './context/DeviceContext'
import { AppShell } from './components/layout/AppShell'
import { Header } from './components/layout/Header'
import { StatusBar } from './components/layout/StatusBar'
import { ConnectPrompt } from './components/connection/ConnectPrompt'
import { ReconnectBanner } from './components/connection/ReconnectBanner'
import { ControllerView } from './components/controller/ControllerView'
import { ConfigPanel } from './components/config/ConfigPanel'

function AppContent(): React.JSX.Element {
  const { connectionState } = useDeviceState()
  const [selectedButtons, setSelectedButtons] = useState<Set<number>>(new Set())

  return (
    <AppShell>
      <Header />

      {connectionState === 'reconnecting' && <ReconnectBanner />}

      {connectionState !== 'connected' ? (
        <ConnectPrompt />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <ControllerView onSelectionChange={setSelectedButtons} />
          <ConfigPanel selectedButtons={selectedButtons} />
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
