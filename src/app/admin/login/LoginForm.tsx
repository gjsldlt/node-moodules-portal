'use client'

import { useActionState } from 'react'
import { loginAdmin } from './actions'

export function LoginForm() {
  const [error, action, isPending] = useActionState(loginAdmin, null)

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label
          htmlFor="password"
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--txs)',
          }}
        >
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-describedby={error ? 'login-error' : undefined}
          disabled={isPending}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '14px',
            border: '1px solid var(--bd)',
            background: 'var(--trk)',
            color: 'var(--tx)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            outline: 'none',
            minHeight: '44px',
          }}
          placeholder="Enter password"
        />
      </div>

      {error && (
        <p
          id="login-error"
          role="alert"
          style={{ color: 'var(--red)', fontSize: '0.875rem', margin: 0 }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          background: 'var(--green)',
          color: 'var(--pnlt)',
          border: 'none',
          borderRadius: '999px',
          padding: '10px 28px',
          fontSize: '1rem',
          fontFamily: 'inherit',
          fontWeight: 600,
          cursor: isPending ? 'not-allowed' : 'pointer',
          minHeight: '44px',
          opacity: isPending ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
