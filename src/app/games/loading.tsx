import { SkeletonBlock } from '@/components/motion/SkeletonBlock'

const PAGE_STYLE = {
  position: 'relative' as const,
  zIndex: 1,
  width: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
  padding: 'clamp(20px,4vw,40px) clamp(20px,4vw,40px) 64px',
}

export default function GamesLoading() {
  return (
    <main style={PAGE_STYLE}>
      {/* Hero */}
      <div style={{ marginBottom: '28px' }}>
        <SkeletonBlock width={60} height={13} radius={6} style={{ marginBottom: '10px' }} />
        <SkeletonBlock width={200} height={40} radius={10} style={{ marginBottom: '8px' }} />
        <SkeletonBlock width={220} height={15} radius={6} />
      </div>

      {/* Game cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '20px',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              borderRadius: '26px',
              border: '1px solid var(--bd)',
              boxShadow: '0 22px 46px -32px var(--shadow)',
              padding: '24px',
            }}
          >
            <SkeletonBlock width={52} height={52} radius={16} style={{ marginBottom: '16px' }} />
            <SkeletonBlock height={20} radius={8} style={{ width: '70%', marginBottom: '8px' }} />
            <SkeletonBlock height={13} radius={5} style={{ marginBottom: '5px' }} />
            <SkeletonBlock height={13} radius={5} style={{ width: '80%', marginBottom: '20px' }} />
            <SkeletonBlock height={36} radius={999} />
          </div>
        ))}
      </div>
    </main>
  )
}
