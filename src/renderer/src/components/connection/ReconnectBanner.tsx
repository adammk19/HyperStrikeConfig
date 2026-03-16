export function ReconnectBanner(): React.JSX.Element {
  return (
    <div className="bg-warning/10 border-b border-warning/30 px-6 py-2 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
      <span className="text-sm text-warning">
        Controller disconnected. Attempting to reconnect...
      </span>
    </div>
  )
}
