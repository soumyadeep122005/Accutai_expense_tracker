import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { error, success } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        // Validate domain
        if (!email.trim().toLowerCase().endsWith('@accutai.com')) {
          throw new Error('Registration is strictly restricted to @accutai.com corporate accounts.');
        }
        await register(username.trim(), email.trim().toLowerCase(), password);
        success('Account created and signed in successfully!');
      } else {
        await login(email.trim(), password);
        success('Welcome back to Accutai Finance Portal!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const res = await api.getGoogleAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      error(err.message || 'Failed to initiate Google authentication');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '2rem 1rem',
      backgroundImage: 'radial-gradient(circle at top right, #eff6ff 0%, #f8fafc 60%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #dbeafe',
        boxShadow: '0 20px 40px -8px rgba(30, 64, 175, 0.12), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        padding: '2.5rem',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/accutaiLOGO Small.png"
            alt="Accutai Brand"
            style={{ height: '48px', margin: '0 auto 1rem', display: 'block', objectFit: 'contain' }}
            onError={(e) => { e.target.src = '/alogo1.png'; }}
          />
          <h1 style={{ fontSize: '1.65rem', color: '#0f172a', fontWeight: 800 }}>
            Accutai Finance Portal
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
            Shared Corporate Finance & Expense Ledger
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#f1f5f9',
          padding: '0.3rem',
          borderRadius: '12px',
          marginBottom: '1.75rem',
          gap: '0.25rem'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMessage(''); }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              backgroundColor: !isRegister ? '#ffffff' : 'transparent',
              color: !isRegister ? '#1d4ed8' : '#64748b',
              boxShadow: !isRegister ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMessage(''); }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              backgroundColor: isRegister ? '#ffffff' : 'transparent',
              color: isRegister ? '#1d4ed8' : '#64748b',
              boxShadow: isRegister ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* Form */}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name / Username</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. soumya"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{isRegister ? 'Accutai Corporate Email' : 'Email or Username'}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={isRegister ? 'email' : 'text'}
                required
                placeholder={isRegister ? 'username@accutai.com' : 'demo@accutai.com or username'}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {isRegister && (
              <span style={{ fontSize: '0.74rem', color: '#2563eb', marginTop: '3px' }}>
                Must be an @accutai.com company domain
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '12px' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Access Shared Ledger')}</span>
            <ArrowRight size={17} />
          </button>
        </form>

        {/* Google SSO Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.25rem 0',
          color: '#94a3b8',
          fontSize: '0.8rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span>or continue with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn btn-outline"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
