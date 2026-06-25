'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { getAvatar } from '@/lib/identity'
import { useNickname } from '@/hooks/useNickname'
import { Sun, Moon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Node-ifications', href: '/node-ifications' },
  { label: 'Moood', href: '/moood' },
  { label: 'Shaw-rawt', href: '/shawrawt' },
  { label: 'Games', href: '/games' },
]

export function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { nickname, triggerSwitch } = useNickname()

  const avatar = nickname ? getAvatar(nickname) : null

  // A route is active if it's an exact match (/) or a prefix match for sub-routes
  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
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
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 40px)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          height: '64px',
        }}
      >
        {/* Logo mark + wordmark */}
        <Link
          href="/"
          aria-label="Node Moodus home"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}
        >
          {/* 4-circle logo mark in a 38×38 container */}
          <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
            {/* Green — top-left, static */}
            <div style={{
              position: 'absolute', top: '0', left: '0',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'var(--green)',
            }} />
            {/* Teal — top-right, bobs */}
            <div style={{
              position: 'absolute', top: '0', right: '0',
              width: '15px', height: '15px', borderRadius: '50%',
              background: 'var(--teal)',
              animation: 'tpBob 3s ease-in-out infinite',
            }} />
            {/* Orange — bottom-center, bobs with offset */}
            <div style={{
              position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
              width: '16px', height: '16px', borderRadius: '50%',
              background: 'var(--orange)',
              animation: 'tpBob 3.4s ease-in-out 0.4s infinite',
            }} />
            {/* Red — bottom-right, static */}
            <div style={{
              position: 'absolute', bottom: '0', right: '0',
              width: '12px', height: '12px', borderRadius: '50%',
              background: 'var(--red)',
            }} />
          </div>

          <span style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '-0.02em',
            color: 'var(--tx)',
            lineHeight: 1,
          }}>
            Node Moodus
          </span>
        </Link>

        {/* Nav pills — scrollable on mobile */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            flex: 1,
            scrollbarWidth: 'none',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 500,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  minHeight: '36px',
                  transition: 'background 0.15s, color 0.15s',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
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
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar chip */}
          {avatar && nickname && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--trk)',
              border: '1px solid var(--bd)',
              borderRadius: '999px',
              padding: '2px 10px 2px 2px',
            }}>
              {/* Avatar circle */}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: avatar.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }} aria-hidden="true">
                {avatar.emoji}
              </div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--tx)',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {nickname}
              </span>
              {/* Switch user button */}
              <button
                onClick={triggerSwitch}
                aria-label="Switch user"
                title="Switch user"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--txm)',
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: '2px',
                  minWidth: '24px',
                  minHeight: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ⇄
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
