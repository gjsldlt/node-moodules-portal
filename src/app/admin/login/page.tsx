import { LoginForm } from './LoginForm'

export const metadata = {
  title: 'Admin Login — Node Moodus',
}

export default function AdminLoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: '26px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 22px 46px -32px var(--shadow)',
        }}
      >
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: '1.75rem',
            letterSpacing: '-0.02em',
            color: 'var(--tx)',
            marginBottom: '6px',
            marginTop: 0,
          }}
        >
          Admin access
        </h1>
        <p style={{ color: 'var(--txs)', marginBottom: '28px', marginTop: 0, fontSize: '0.9rem' }}>
          Node Moodus internal panel
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
