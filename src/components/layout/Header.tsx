'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { getAvatar } from '@/lib/identity'
import { useNickname } from '@/hooks/useNickname'
import { Sun, Moon, Menu, X, Zap, ScrollText } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  emoji: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',            href: '/',                emoji: '🏠' },
  { label: 'Node-ifications', href: '/node-ifications', emoji: '📣' },
  { label: 'Moood',           href: '/moood',            emoji: '😌' },
  { label: 'Shaw-rawt',       href: '/shawrawt',         emoji: '🤩' },
  { label: 'Games',           href: '/games',            emoji: '🎮' },
]

export function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme, cycleSecretTheme } = useTheme()
  const { nickname, triggerSwitch } = useNickname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compactAvatar, setCompactAvatar] = useState(false)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 425px)')
    function check() { setCompactAvatar(mq.matches) }
    check()
    mq.addEventListener('change', check)
    return () => mq.removeEventListener('change', check)
  }, [])

  const avatar = nickname ? getAvatar(nickname) : null

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <>
      <header
        style={{
          background: 'var(--hdr)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--bd)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="tp-header-inner"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 clamp(20px, 4vw, 40px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '64px',
          }}
        >
          {/* Hamburger — visible only on mobile via CSS */}
          <button
            className="tp-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--bd)',
              background: 'var(--trk)',
              color: 'var(--txs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            aria-label="Node Moodus home"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}
          >
            <div className="tp-logo-mark" style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--green)' }} />
              <div style={{ position: 'absolute', top: '0', right: '0', width: '15px', height: '15px', borderRadius: '50%', background: 'var(--teal)', animation: 'tpBob 3s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--orange)', animation: 'tpBob 3.4s ease-in-out 0.4s infinite' }} />
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--red)' }} />
            </div>
            <span className="tp-logo-text" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--tx)', lineHeight: 1 }}>
              Node Moodus
            </span>
          </Link>

          {/* Desktop nav — hidden ≤768px via CSS */}
          <nav
            className="tp-header-nav"
            aria-label="Main navigation"
            style={{ display: 'flex', gap: '4px', flex: 1, padding: '6px 0' }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={active ? 'tp-nav-active' : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '6px 14px', borderRadius: '999px',
                    fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                    whiteSpace: 'nowrap', textDecoration: 'none', minHeight: '36px',
                    transition: 'background 0.15s, color 0.15s, box-shadow 0.3s',
                    background: active ? 'var(--tx)' : 'transparent',
                    color: active ? 'var(--bg)' : 'var(--txs)',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right controls */}
          <div className="tp-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
            <button
              onClick={toggleTheme}
              onContextMenu={(e) => { e.preventDefault(); cycleSecretTheme() }}
              aria-label={
                theme === 'cyberpunk' ? 'Cyberpunk mode — click to exit, right-click for LOTR' :
                theme === 'lotr'      ? 'LOTR mode — click to exit, right-click to cycle' :
                `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
              }
              title={theme === 'dark' || theme === 'light' ? 'Right-click for a surprise' : undefined}
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                border:
                  theme === 'cyberpunk' ? '1px solid #00fff5' :
                  theme === 'lotr'      ? '1px solid #c9a84c' :
                  '1px solid var(--bd)',
                background:
                  theme === 'cyberpunk' ? 'rgba(0,255,245,.12)' :
                  theme === 'lotr'      ? 'rgba(201,168,76,.12)' :
                  'var(--trk)',
                color:
                  theme === 'cyberpunk' ? '#00fff5' :
                  theme === 'lotr'      ? '#c9a84c' :
                  'var(--txs)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                boxShadow:
                  theme === 'cyberpunk' ? '0 0 12px rgba(0,255,245,.4), 0 0 28px rgba(0,255,245,.15)' :
                  theme === 'lotr'      ? '0 0 12px rgba(201,168,76,.45), 0 0 28px rgba(201,168,76,.18)' :
                  'none',
                transition: 'all 0.3s ease',
              }}
            >
              {theme === 'cyberpunk' ? <Zap size={16} /> :
               theme === 'lotr'      ? <ScrollText size={16} /> :
               theme === 'dark'      ? <Sun size={16} /> :
                                       <Moon size={16} />}
            </button>

            {avatar && nickname && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--trk)', border: '1px solid var(--bd)', borderRadius: '999px', padding: compactAvatar ? '2px' : '2px 10px 2px 2px' }}>
                <div
                  onClick={triggerSwitch}
                  role="button"
                  tabIndex={0}
                  aria-label="Switch user"
                  onKeyDown={(e) => e.key === 'Enter' && triggerSwitch()}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: avatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, cursor: 'pointer' }}
                >
                  {avatar.emoji}
                </div>
                {!compactAvatar && (
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--tx)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nickname}
                  </span>
                )}
                {!compactAvatar && (
                  <button onClick={triggerSwitch} aria-label="Switch user" title="Switch user" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txm)', fontSize: '16px', lineHeight: 1, padding: '2px', minWidth: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ⇄
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Nav drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(6,6,9,.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            />

            {/* Panel */}
            <motion.div
              key="drawer-panel"
              initial={shouldReduce ? { opacity: 0 } : { x: -300, opacity: 0 }}
              animate={shouldReduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={shouldReduce ? { opacity: 0 } : { x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 70,
                width: '280px',
                background: 'var(--card)',
                borderRight: '1px solid var(--bd)',
                boxShadow: '20px 0 60px -20px var(--shadow)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Drawer header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bd)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '15px', borderRadius: '50%', background: 'var(--green)' }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '13px', height: '13px', borderRadius: '50%', background: 'var(--teal)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '13px', height: '13px', borderRadius: '50%', background: 'var(--orange)' }} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: 'var(--red)' }} />
                  </div>
                  <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em', color: 'var(--tx)' }}>
                    Node Moodus
                  </span>
                </div>
                <button
                  onClick={closeDrawer}
                  aria-label="Close navigation"
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--bd)', background: 'var(--trk)', color: 'var(--txm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Nav items */}
              <nav aria-label="Drawer navigation" style={{ padding: '12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeDrawer}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '14px',
                        textDecoration: 'none', minHeight: '48px',
                        transition: 'background 0.15s',
                        background: active ? 'var(--tx)' : 'transparent',
                        color: active ? 'var(--bg)' : 'var(--txs)',
                        fontWeight: active ? 700 : 500,
                        fontSize: '15px',
                      }}
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Drawer footer — user */}
              {avatar && nickname && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--bd)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {avatar.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nickname}</div>
                      <button onClick={() => { triggerSwitch(); closeDrawer() }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', color: 'var(--txm)', fontFamily: 'inherit' }}>
                        Switch user ⇄
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
