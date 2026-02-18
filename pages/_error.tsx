import { NextPageContext } from 'next'

/**
 * Custom Pages Router error page.
 * Overrides Sentry's auto-generated _error page that incorrectly
 * imports <Html> from next/document during prerendering.
 *
 * This file is only used for Pages Router /404 and /500 fallbacks.
 * App Router uses app/not-found.tsx and app/error.tsx instead.
 */
function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{statusCode || 'Error'}</h1>
      <p style={{ fontSize: '1.25rem', color: '#666' }}>
        {statusCode === 404
          ? 'This page could not be found.'
          : 'An internal server error occurred.'}
      </p>
      <a href="/" style={{ color: '#3B82F6', textDecoration: 'underline', marginTop: '2rem', display: 'inline-block' }}>
        Go Home
      </a>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
