interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen bg-surface">
      {children}
    </div>
  )
}
