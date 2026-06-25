// Server Component — pure CSS animation, no JavaScript, no "use client"
export default function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Orb 1: green, top-left */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-80px',
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, var(--green), transparent)',
          opacity: 0.34,
          filter: 'blur(8px)',
          animation: 'tpFloat 19s ease-in-out infinite normal',
        }}
      />
      {/* Orb 2: sky, top-right */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          right: '-140px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, var(--sky), transparent)',
          opacity: 0.32,
          filter: 'blur(8px)',
          animation: 'tpFloat 23s ease-in-out infinite reverse',
        }}
      />
      {/* Orb 3: yellow, bottom-center */}
      <div
        style={{
          position: 'absolute',
          bottom: '-160px',
          left: '34%',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, var(--yellow), transparent)',
          opacity: 0.26,
          filter: 'blur(8px)',
          animation: 'tpFloat 27s ease-in-out infinite normal',
        }}
      />
    </div>
  )
}
