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
  marginBottom: '16px',
}

export default function ShawrawtLoading() {
  return (
    <main style={PAGE_STYLE}>
      {/* Hero */}
      <div style={{ marginBottom: '28px' }}>
        <SkeletonBlock width={70} height={13} radius={6} style={{ marginBottom: '10px' }} />
        <SkeletonBlock width={240} height={40} radius={10} style={{ marginBottom: '8px' }} />
        <SkeletonBlock width={180} height={15} radius={6} />
      </div>

      {/* Compose button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <SkeletonBlock width={160} height={40} radius={999} />
      </div>

      {/* Shoutout card feed */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <SkeletonBlock width={42} height={42} radius="50%" />
            <div style={{ flex: 1 }}>
              <SkeletonBlock height={15} radius={6} style={{ width: '55%', marginBottom: '6px' }} />
              <SkeletonBlock height={12} radius={5} style={{ width: '35%' }} />
            </div>
            <SkeletonBlock width={80} height={26} radius={999} />
          </div>
          <SkeletonBlock height={14} radius={6} style={{ marginBottom: '6px' }} />
          <SkeletonBlock height={14} radius={6} style={{ width: '70%', marginBottom: '14px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map((j) => (
              <SkeletonBlock key={j} width={44} height={28} radius={999} />
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
