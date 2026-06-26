'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  minHeight?: number
}

type ToolbarAction = {
  label: string
  title: string
  wrap?: [string, string]
  block?: string
}

const TOOLBAR: ToolbarAction[] = [
  { label: 'B', title: 'Bold', wrap: ['**', '**'] },
  { label: 'I', title: 'Italic', wrap: ['*', '*'] },
  { label: 'H2', title: 'Heading', block: '## ' },
  { label: '`', title: 'Inline code', wrap: ['`', '`'] },
  { label: '—', title: 'Divider', block: '\n---\n' },
  { label: '•', title: 'Bullet list', block: '- ' },
  { label: '1.', title: 'Numbered list', block: '1. ' },
]

export function MarkdownEditor({ value, onChange, placeholder = 'Add details…', minHeight = 120 }: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function applyAction(action: ToolbarAction) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)

    let next = value
    let newCursor = start

    if (action.wrap) {
      const [open, close] = action.wrap
      next = value.slice(0, start) + open + selected + close + value.slice(end)
      newCursor = selected ? start + open.length + selected.length + close.length : start + open.length
    } else if (action.block) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      next = value.slice(0, lineStart) + action.block + value.slice(lineStart)
      newCursor = lineStart + action.block.length
    }

    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
    })
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    borderRadius: '999px',
    border: 'none',
    background: active ? 'var(--tx)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--txs)',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toolbar row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'var(--trk)',
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid var(--bd)',
          flexWrap: 'wrap',
        }}
      >
        {/* Write / Preview tabs */}
        <div style={{ display: 'flex', gap: '2px', marginRight: '8px' }}>
          <button type="button" onClick={() => setMode('write')} style={tabStyle(mode === 'write')}>
            ✏️ Write
          </button>
          <button type="button" onClick={() => setMode('preview')} style={tabStyle(mode === 'preview')}>
            👁 Preview
          </button>
        </div>

        {/* Format buttons — only shown in write mode */}
        {mode === 'write' && (
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <span style={{ width: '1px', height: '18px', background: 'var(--bd)', marginRight: '4px' }} />
            {TOOLBAR.map((action) => (
              <button
                key={action.title}
                type="button"
                title={action.title}
                onClick={() => applyAction(action)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--txs)',
                  fontWeight: action.label === 'B' ? 800 : action.label === 'I' ? 600 : 500,
                  fontStyle: action.label === 'I' ? 'italic' : 'normal',
                  fontSize: action.label === 'H2' || action.label === '1.' ? '11px' : '14px',
                  cursor: 'pointer',
                  fontFamily: action.label === '`' ? 'monospace' : 'inherit',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bd)'
                  e.currentTarget.style.color = 'var(--tx)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--txs)'
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor / Preview area */}
      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: `${minHeight}px`,
            padding: '12px 14px',
            border: '1.5px solid var(--bd)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            background: 'var(--bg)',
            color: 'var(--tx)',
            fontSize: '14px',
            fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          style={{
            minHeight: `${minHeight}px`,
            padding: '12px 14px',
            border: '1.5px solid var(--bd)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            background: 'var(--bg)',
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--txs)',
          }}
        >
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <span style={{ color: 'var(--txm)', fontStyle: 'italic' }}>Nothing to preview yet.</span>
          )}
        </div>
      )}
    </div>
  )
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '20px', margin: '16px 0 8px', color: 'var(--tx)' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '17px', margin: '14px 0 6px', color: 'var(--tx)' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontWeight: 700, fontSize: '15px', margin: '12px 0 4px', color: 'var(--tx)' }}>{children}</h3>
        ),
        p: ({ children }) => (
          <p style={{ margin: '6px 0', color: 'var(--txs)', lineHeight: 1.6 }}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 800, color: 'var(--tx)' }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic', color: 'var(--txs)' }}>{children}</em>
        ),
        code: ({ children }) => (
          <code style={{ fontFamily: 'monospace', background: 'var(--trk)', padding: '2px 6px', borderRadius: '5px', fontSize: '13px', color: 'var(--teal)' }}>{children}</code>
        ),
        pre: ({ children }) => (
          <pre style={{ background: 'var(--trk)', padding: '12px 14px', borderRadius: '10px', overflowX: 'auto', margin: '8px 0', fontSize: '13px' }}>{children}</pre>
        ),
        ul: ({ children }) => (
          <ul style={{ paddingLeft: '20px', margin: '6px 0', color: 'var(--txs)' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ paddingLeft: '20px', margin: '6px 0', color: 'var(--txs)' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ margin: '2px 0' }}>{children}</li>
        ),
        hr: () => (
          <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: '12px 0' }} />
        ),
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '3px solid var(--teal)', paddingLeft: '12px', margin: '8px 0', color: 'var(--txm)' }}>{children}</blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} style={{ color: 'var(--teal)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
