import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const provider = new GoogleAuthProvider()

/* ── Animated background oxrbs ── */
/* ── Floating bubble balls ── */
const BUBBLES = [
  { size: 200,  left: '8%',  top: '75%', color: 'rgba(0,212,255,0.18)',   border: 'rgba(0,212,255,0.45)',   dur: 14, delay: 0 },
  { size: 200,  left: '18%', top: '60%', color: 'rgba(123,97,255,0.15)', border: 'rgba(123,97,255,0.4)',   dur: 10, delay: 1.5 },
  { size: 130, left: '75%', top: '80%', color: 'rgba(0,212,255,0.12)',   border: 'rgba(0,212,255,0.3)',    dur: 18, delay: 0.5 },
  { size: 40,  left: '85%', top: '55%', color: 'rgba(123,97,255,0.2)',  border: 'rgba(123,97,255,0.5)',   dur: 8,  delay: 3   },
  { size: 70,  left: '50%', top: '85%', color: 'rgba(0,212,255,0.14)',   border: 'rgba(0,212,255,0.35)',   dur: 12, delay: 2   },
  { size: 48,  left: '35%', top: '70%', color: 'rgba(255,107,157,0.12)', border: 'rgba(255,107,157,0.35)', dur: 9,  delay: 4   },
  { size: 100, left: '62%', top: '65%', color: 'rgba(123,97,255,0.10)', border: 'rgba(123,97,255,0.28)',  dur: 16, delay: 1   },
  { size: 32,  left: '28%', top: '88%', color: 'rgba(0,212,255,0.2)',    border: 'rgba(0,212,255,0.5)',    dur: 7,  delay: 2.5 },
]

function AnimatedOrbs() {
  return (
    <>
      <style>{`
        @keyframes bubbleRise {
          0%   { transform: translateY(0px)    translateX(0px)  scale(1);    opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translateY(-40vh)  translateX(18px) scale(1.05); opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-90vh)  translateX(-10px) scale(0.9); opacity: 0; }
        }
        @keyframes bubbleSway {
          0%, 100% { margin-left: 0px; }
          50%       { margin-left: 22px; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {BUBBLES.map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.color,
            // border: `1.5px solid ${b.border}`,
            backdropFilter: 'blur(2px)',
            boxShadow: `inset 0 -4px 12px rgba(255,255,255,0.08), 0 0 20px ${b.border}`,
            animation: `bubbleRise ${b.dur}s ease-in-out ${b.delay}s infinite, bubbleSway ${b.dur * 0.9}s ease-in-out ${b.delay}s infinite`,
          }} />
        ))}
      </div>
    </>
  )
}

/* ── Sliding toggle ── */
function Toggle({ mode, onChange }) {
  const isLogin = mode === 'login'
  return (
    <div style={{
      position: 'relative', display: 'flex', background: '#05080F',
      borderRadius: 50, padding: 4, marginBottom: 28,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* sliding pill */}
      <div style={{
        position: 'absolute', top: 4, bottom: 4,
        width: 'calc(50% - 4px)',
        left: isLogin ? 'calc(50%)' : '4px',
        background: '#00D4FF', borderRadius: 50,
        transition: 'left 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 0 16px rgba(0,212,255,0.35)',
      }} />
      {[['signup', 'Create Account'], ['login', 'Log In']].map(([m, label]) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 50, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            background: 'transparent', position: 'relative', zIndex: 1,
            color: mode === m ? '#05080F' : 'rgba(255,255,255,0.4)',
            transition: 'color 0.3s ease',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [contentKey, setContentKey] = useState(0) // for fade animation on toggle

  const isLogin = mode === 'login'

  const switchMode = (m) => {
    if (m === mode) return
    setMode(m)
    setError('')
    setForm({ name: '', email: '', password: '' })
    setContentKey(k => k + 1)
  }

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const friendlyError = (code) => {
    const map = {
      'auth/email-already-in-use': 'That email is already registered. Try logging in.',
      'auth/invalid-email': "That email address doesn't look right.",
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account with that email. Sign up instead?',
      'auth/wrong-password': 'Wrong password. Try again.',
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    }
    return map[code] || 'Something went wrong. Please try again.'
  }

  const saveUserToFirestore = async (user, extraName) => {
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        name: extraName || user.displayName || '',
        email: user.email,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        skills: [],
        bookmarks: [],
      })
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    if (!isLogin && !form.name.trim()) { setError('Enter your full name.'); return }
    if (!isLogin && form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, form.email.trim(), form.password)
        await saveUserToFirestore(cred.user, '')
      } else {
        const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
        await updateProfile(cred.user, { displayName: form.name.trim() })
        await saveUserToFirestore(cred.user, form.name.trim())
      }
      navigate('/dashboard')
    } catch (e) {
      setError(friendlyError(e.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const cred = await signInWithPopup(auth, provider)
      await saveUserToFirestore(cred.user, '')
      navigate('/dashboard')
    } catch (e) {
      setError(friendlyError(e.code))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div style={{
      minHeight: '100vh', background: '#05080F', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px', fontFamily: 'system-ui,-apple-system,sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-content { animation: fadeSlideIn 0.3s ease forwards; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #05080F inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      <AnimatedOrbs />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>🪙</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              Skill<span style={{ color: '#00D4FF' }}>Mint</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 24, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>

          {/* Sliding toggle */}
          <Toggle mode={mode} onChange={switchMode} />

          {/* Animated content area */}
          <div key={contentKey} className="auth-content">

            {/* Heading */}
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              {isLogin ? 'Welcome back 👋' : 'Join SkillMint 🪙'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
              {isLogin ? 'Log in to manage your skill listings.' : "It's free. Always. Takes 60 seconds."}
            </p>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isLogin && (
                <Field label="Full Name" type="text" placeholder="e.g. Chioma Adeyemi"
                  value={form.name} onChange={set('name')} onKeyDown={handleKeyDown} />
              )}
              <Field label="Email Address" type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')} onKeyDown={handleKeyDown} />
              <Field
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder={isLogin ? 'Your password' : 'Min. 6 characters'}
                value={form.password} onChange={set('password')} onKeyDown={handleKeyDown}
                suffix={
                  <button onClick={() => setShowPass(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '0 4px' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                }
              />
            </div>

            {/* Forgot password */}
            {isLogin && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#FF6B6B', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 50, border: 'none',
                background: loading ? 'rgba(0,212,255,0.5)' : '#00D4FF',
                color: '#05080F', fontSize: 15, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading
                ? <><Spinner dark /> {isLogin ? 'Logging in…' : 'Creating account…'}</>
                : (isLogin ? 'Log In →' : 'Create My Account →')}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Google button — below email so it feels secondary */}
            <button
              onClick={handleGoogle} disabled={googleLoading}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s ease', opacity: googleLoading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            >
              {googleLoading ? <Spinner /> : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
              )}
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            {/* Switch mode */}
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', color: '#00D4FF', fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}
              >
                {isLogin ? 'Sign up free' : 'Log in'}
              </button>
            </p>

            {/* Terms */}
            {!isLogin && (
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </div>
        </div>

        {/* Back to home */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <Link to="/" style={{ color: 'rgb(255, 255, 255)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

/* ── Reusable field ── */
function Field({ label, type, placeholder, value, onChange, onKeyDown, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6, letterSpacing: 0.3 }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#05080F', borderRadius: 12, padding: '0 16px',
        border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}>
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={onChange} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, padding: '13px 0' }}
        />
        {suffix}
      </div>
    </div>
  )
}

/* ── Spinner ── */
function Spinner({ dark }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', display: 'inline-block',
        border: `2px solid ${dark ? 'rgba(5,8,15,0.25)' : 'rgba(255,255,255,0.2)'}`,
        borderTop: `2px solid ${dark ? '#05080F' : '#fff'}`,
        animation: 'spin 0.7s linear infinite',
      }} />
    </>
  )
}