'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Something went wrong</h2>
          {error.digest && (
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Error ID: {error.digest}</p>
          )}
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'white',
              fontSize: '14px',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
