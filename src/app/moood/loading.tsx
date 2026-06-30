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

export default function MooodLoading() {
  return (
    <main style={PAGE_STYLE}>
      {/* Hero */}
      <div style={{ marginBottom: '28px' }}>
        <SkeletonBlock width={90} height={13} radius={6} style={{ marginBottom: '10px' }} />
        <SkeletonBlock width={280} height={40} radius={10} style={{ marginBottom: '8px' }} />
        <SkeletonBlock width={160} height={15} radius={6} />
      </div>

      {/* Personal check-in row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
        {/* MoodCheckin card */}
        <div style={{ ...CARD, flex: '1 1 320px', minWidth: 0 }}>
          <SkeletonBlock height={20} radius={8} style={{ width: '55%', marginBottom: '20px' }} />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginBottom: '20px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} width={52} height={52} radius="50%" />
            ))}
          </div>
          <SkeletonBlock height={44} radius={12} />
        </div>

        {/* WordOfDay card */}
        <div style={{ ...CARD, flex: '1 1 260px', minWidth: 0 }}>
          <SkeletonBlock height={20} radius={8} style={{ width: '60%', marginBottom: '12px' }} />
          <SkeletonBlock height={14} radius={6} style={{ width: '80%', marginBottom: '20px' }} />
          <SkeletonBlock height={44} radius={12} style={{ marginBottom: '10px' }} />
          <SkeletonBlock height={36} radius={999} style={{ width: '40%' }} />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[90, 70, 110, 80].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={34} radius={999} />
        ))}
      </div>

      {/* Graph + Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
        <div style={{ ...CARD, flex: '2 1 340px', minWidth: 0 }}>
          <SkeletonBlock height={20} radius={8} style={{ width: '45%', marginBottom: '16px' }} />
          <SkeletonBlock height={200} radius={14} />
        </div>
        <div style={{ ...CARD, flex: '1 1 220px', minWidth: 0 }}>
          <SkeletonBlock height={20} radius={8} style={{ width: '55%', marginBottom: '16px' }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <SkeletonBlock width={72} height={72} radius={16} />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <SkeletonBlock width={22} height={22} radius={6} />
              <SkeletonBlock height={10} radius={4} style={{ flex: 1 }} />
              <SkeletonBlock width={28} height={10} radius={4} />
            </div>
          ))}
        </div>
      </div>

      {/* Word cloud */}
      <div style={{ ...CARD }}>
        <SkeletonBlock height={20} radius={8} style={{ width: '35%', marginBottom: '16px' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[60, 90, 70, 110, 55, 80, 95, 65, 75, 85].map((w, i) => (
            <SkeletonBlock key={i} width={w} height={28} radius={999} />
          ))}
        </div>
      </div>
    </main>
  )
}
