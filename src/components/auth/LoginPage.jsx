import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({
  loginForm,
  setLoginForm,
  loginLoading,
  loginError,
  handleLogin,
  handleQuickRoleSelect
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(true);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      
      {/* LEFT HERO / BRAND SECTION (ROYAL PURPLE GRADIENT WITH AMBIENT GLOW) */}
      <div style={{
        flex: 1.15,
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1e1b4b 0%, #2e1065 25%, #3730a3 60%, #4f46e5 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '52px 64px',
        boxSizing: 'border-box',
        color: '#ffffff'
      }}>
        {/* Ambient Glowing Orbs in Background */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.22) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '20%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />

        {/* Decorative concentric translucent rings matching the visual design */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
          width: '760px',
          height: '760px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          pointerEvents: 'none'
        }} />

        {/* TOP BRANDING: OFFICIAL RATHINAM LOGO */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '6px 12px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={`${import.meta.env.BASE_URL}rathinam_logo.png`}
              alt="Rathinam Group"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
              Rathinam Group
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '11.5px', color: 'rgba(199, 210, 254, 0.7)' }}>
          © Rathinam Group • FY 2026-2027
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN FLOATING CARD LOGIN */}
      <div style={{
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        boxSizing: 'border-box',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '44px 38px',
          boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.03)',
          boxSizing: 'border-box'
        }}>
          {/* Top Pill Badge */}
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
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
            <span>Secure sign in</span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>
            Sign in to continue to your operations workspace.
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
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Email or Username
              </label>
              <input
                type="text"
                placeholder="admin or name@rathinam.in"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #c7d2fe',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>
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
                    padding: '11px 44px 11px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
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
                    fontSize: '12px',
                    fontWeight: '600',
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
            >
              <span>{loginLoading ? 'Signing In...' : 'Sign in'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
