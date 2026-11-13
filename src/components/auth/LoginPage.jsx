import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';

export default function LoginPage({
  loginForm,
  setLoginForm,
  loginLoading,
  loginError,
  handleLogin
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(true);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box',
      background: 'radial-gradient(ellipse at 50% 15%, #2e1065 0%, #1e1b4b 45%, #0f172a 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* AMBIENT GLOWING ORBS (MATCHING THE PURPLE / INDIGO PALETTE) */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '15%',
        width: '520px',
        height: '520px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.20) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      {/* SUBTLE GEOMETRIC ACCENT LINES */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '840px',
        height: '840px',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '620px',
        height: '620px',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        pointerEvents: 'none'
      }} />

      {/* MAIN CENTERED LOGIN CONTAINER */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>

        {/* OFFICIAL RATHINAM ACCREDITATION & UNIVERSITY BANNER (WHITE GLOW CONTAINER) */}
        <div style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '14px 20px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <img
            src={`${import.meta.env.BASE_URL}rathinam_accreditation_banner.png`}
            alt="Rathinam Global University - NAAC A++ Accredited - 1st in Tamil Nadu"
            style={{
              width: '100%',
              maxWidth: '380px',
              height: 'auto',
              maxHeight: '44px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* LOGIN FORM CARD */}
        <div style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box'
        }}>

          {/* TOP STATUS PILL */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            fontSize: '11.5px',
            fontWeight: '700',
            marginBottom: '14px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
            <span>Campus Operations & Reporting</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 22px 0' }}>
            Sign in with your institutional credentials to continue.
          </p>

          {loginError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '12.5px',
              fontWeight: '600',
              marginBottom: '18px'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email or Username */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="admin"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  required
                />
                <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact the campus IT administrator at admin@rathinam.in to reset your password.')}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4f46e5',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
              <input
                type="checkbox"
                id="keepSigned"
                checked={keepSigned}
                onChange={(e) => setKeepSigned(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#4f46e5', cursor: 'pointer' }}
              />
              <label htmlFor="keepSigned" style={{ fontSize: '12.5px', color: '#475569', cursor: 'pointer' }}>
                Keep me signed in on this device
              </label>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4338ca'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4f46e5'}
            >
              <span>{loginLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* FOOTER ACCREDITATION NOTE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.65)',
          marginTop: '4px'
        }}>
          <ShieldCheck size={14} color="#a5b4fc" />
          <span>Rathinam Group of Institutions • NAAC Grade A++ Accredited</span>
        </div>
      </div>

    </div>
  );
}
