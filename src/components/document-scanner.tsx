export function DocumentScanner({ className = "", paused = false }: { className?: string; paused?: boolean }) {
  return <div className={`document-scanner ${className}`} data-paused={paused} aria-hidden="true"><div className="document-scanner-sweep"><i/></div></div>;
}
