import { SkeletonBlock } from '@/components/motion/SkeletonBlock'

const PAGE_STYLE = {
  flex: 1,
  padding: 'clamp(20px, 4vw, 40px)',
  maxWidth: '1280px',
  margin: '0 auto',
  width: '100%',
}

const CARD = {
  background: 'var(--card)',
  borderRadius: '26px',
  border: '1px solid var(--bd)',
  boxShadow: '0 22px 46px -32px var(--shadow)',
  padding: '24px',
}

export default function HomeLoading() {
  return (
    <main style={PAGE_STYLE}>
      {/* Hero */}
      <div style={{ marginBottom: '32px' }}>
        <SkeletonBlock width={80} height={14} radius={6} style={{ marginBottom: '12px' }} />
        <SkeletonBlock width={320} height={42} radius={10} style={{ marginBottom: '8px' }} />
        <SkeletonBlock width={200} height={18} radius={6} />
      </div>

      {/* Two-column card row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ ...CARD, flex: '1.7 1 360px', minWidth: 0 }}>
          <SkeletonBlock height={22} radius={8} style={{ marginBottom: '16px', width: '50%' }} />
          <SkeletonBlock height={120} radius={16} style={{ marginBottom: '12px' }} />
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} height={48} radius={12} style={{ marginBottom: '8px' }} />
          ))}
        </div>
        <div style={{ ...CARD, flex: '1 1 300px', minWidth: 0 }}>
          <SkeletonBlock height={22} radius={8} style={{ marginBottom: '16px', width: '40%' }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <SkeletonBlock width={90} height={90} radius="50%" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <SkeletonBlock width={28} height={28} radius="50%" />
              <SkeletonBlock height={14} radius={6} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
