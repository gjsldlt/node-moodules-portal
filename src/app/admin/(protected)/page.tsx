import Link from 'next/link'
import { Users } from 'lucide-react'

export const metadata = { title: 'Admin — Node Moodus' }

export default function AdminPage() {
  return (
    <>
      <style>{`
        .admin-nav-card:hover { border-color: var(--teal) !important; }
      `}</style>
      <main style={{ flex: 1, padding: 'clamp(20px, 4vw, 40px)' }}>
        <h1 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 800,
          color: 'var(--tx)',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}>
          Admin panel
        </h1>
        <p style={{ color: 'var(--txm)', fontSize: '0.875rem', margin: '0 0 32px' }}>
          Node Moodus internal tooling
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          <Link
            href="/admin/users"
            className="admin-nav-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '20px',
              background: 'var(--card)',
              borderRadius: '18px',
              border: '1px solid var(--bd)',
              textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--trk)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--teal)',
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--tx)', marginBottom: '2px' }}>
                Nickname records
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--txm)' }}>
                Create · edit · delete users
              </div>
            </div>
          </Link>
        </div>
      </main>
    </>
  )
}
