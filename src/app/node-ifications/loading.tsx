import { SkeletonBlock } from '@/components/motion/SkeletonBlock'

const PAGE_STYLE = {
  position: 'relative' as const,
  zIndex: 1,
  width: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
  padding: 'clamp(20px,4vw,40px) clamp(20px,4vw,40px) 64px',
}

const CARD = {
  background: 'var(--card)',
  borderRadius: '26px',
  border: '1px solid var(--bd)',
  boxShadow: '0 22px 46px -32px var(--shadow)',
  padding: '24px',
}

export default function NodeificationsLoading() {
  return (
    <main style={PAGE_STYLE}>
      {/* Hero stat blocks */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--pnl)',
              borderRadius: '20px',
              padding: '20px 24px',
              flex: '1 1 180px',
              minWidth: 0,
            }}
          >
            <SkeletonBlock width={80} height={13} radius={5} style={{ marginBottom: '8px' }} />
            <SkeletonBlock width={60} height={36} radius={8} />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[100, 130, 90].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={36} radius={999} />
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Announcements column */}
        <div style={{ ...CARD, flex: '1.7 1 360px', minWidth: 0 }}>
          <SkeletonBlock height={22} radius={8} style={{ width: '50%', marginBottom: '16px' }} />
          {/* Featured card */}
          <div
            style={{
              background: 'var(--trk)',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '12px',
            }}
          >
            <SkeletonBlock width={40} height={40} radius={12} style={{ marginBottom: '12px' }} />
            <SkeletonBlock height={20} radius={8} style={{ width: '70%', marginBottom: '8px' }} />
            <SkeletonBlock height={14} radius={6} style={{ marginBottom: '6px' }} />
            <SkeletonBlock height={14} radius={6} style={{ width: '60%' }} />
          </div>
          {/* List rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--bd)' }}>
              <SkeletonBlock width={36} height={36} radius={10} />
              <div style={{ flex: 1 }}>
                <SkeletonBlock height={14} radius={6} style={{ width: '65%', marginBottom: '6px' }} />
                <SkeletonBlock height={12} radius={5} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Reminders column */}
        <div style={{ ...CARD, flex: '1 1 300px', minWidth: 0 }}>
          <SkeletonBlock height={22} radius={8} style={{ width: '45%', marginBottom: '16px' }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: i === 1 ? 'none' : '1px solid var(--bd)' }}>
              <SkeletonBlock width={22} height={22} radius={6} />
              <div style={{ flex: 1 }}>
                <SkeletonBlock height={14} radius={6} style={{ width: '75%', marginBottom: '6px' }} />
                <SkeletonBlock height={12} radius={5} style={{ width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
