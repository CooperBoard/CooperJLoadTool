'use client';
import { useState, useEffect } from 'react';

const ACCESS_CODE = 'cooper2026';
const STORAGE_KEY = 'jload-access';

export default function AccessGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check URL param (for Hub iframe bypass)
    const params = new URLSearchParams(window.location.search);
    if (params.get('key') === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAuthorized(true);
      setChecking(false);
      return;
    }
    // Check localStorage
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setAuthorized(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAuthorized(true);
      setError('');
    } else {
      setError('Invalid access code');
    }
  };

  if (checking) return null;
  if (authorized) return children;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2634 0%, #2B3E50 50%, #1a2634 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '40px',
        width: '360px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px', background: '#E31937', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '24px', fontWeight: '800', color: '#fff',
          boxShadow: '0 4px 16px rgba(227,25,55,0.4)',
        }}>C</div>
        <h1 style={{ color: '#fff', fontSize: '20px', margin: '0 0 4px', fontWeight: '600' }}>Manual J Load Calculator</h1>
        <p style={{ color: '#D4AF37', fontSize: '11px', margin: '0 0 24px' }}>Cooper Mechanical Services</p>
        <input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setError(''); }}
          placeholder="Enter access code"
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
            color: '#fff', fontSize: '14px', textAlign: 'center',
            boxSizing: 'border-box', marginBottom: '12px', outline: 'none',
          }}
        />
        {error && <div style={{ color: '#E31937', fontSize: '12px', marginBottom: '12px', fontWeight: '600' }}>{error}</div>}
        <button type="submit" style={{
          width: '100%', padding: '12px', background: 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)',
          border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px',
          fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 16px rgba(227,25,55,0.4)',
        }}>Access Calculator</button>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', marginTop: '20px' }}>
          Contact Cooper Mechanical for access
        </p>
      </form>
    </div>
  );
}
