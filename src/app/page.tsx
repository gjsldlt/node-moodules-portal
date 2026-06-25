export default function HomePage() {
  return (
    <main
      style={{
        flex: 1,
        padding: 'clamp(20px, 4vw, 40px)',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(30px, 5vw, 46px)',
          lineHeight: 1.04,
          letterSpacing: '-0.025em',
          color: 'var(--tx)',
        }}
      >
        Home Dashboard
      </h1>
      <p style={{ color: 'var(--txs)', marginTop: '8px' }}>
        Full dashboard implemented in Iteration 2.
      </p>
    </main>
  )
}
