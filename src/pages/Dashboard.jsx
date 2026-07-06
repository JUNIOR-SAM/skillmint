import { useState, useEffect, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Link, useNavigate } from 'react-router-dom'
import { signOut, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import {
  collection, query, where, getDocs, doc, getDoc,
  addDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'

const NAV = [
  { id: 'profile',   icon: '👤', label: 'My Profile'   },
  { id: 'skills',    icon: '🛠️', label: 'My Skills'    },
  { id: 'post',      icon: '➕', label: 'Post a Skill'  },
  { id: 'bookmarks', icon: '🔖', label: 'Bookmarks'    },
  { id: 'stats',     icon: '📊', label: 'Stats'        },
]

const CATEGORIES = ['Education','Tech','Creative','Trade','Health','Business']

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau',
  'Rivers','Sokoto','Taraba','Yobe','Zamfara'
]

const EXPERIENCE_YEARS = ['Less than 1 year','1 year','2 years','3 years','4 years','5 years','6-10 years','10+ years']

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, ...style }}>
      {children}
    </div>
  )
}

function SectionHead({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{title}</h2>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>{subtitle}</p>}
    </div>
  )
}

function Field({ label, type = 'text', placeholder, value, onChange, multiline, rows = 3 }) {
  const [focused, setFocused] = useState(false)
  const shared = { background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: '100%', fontFamily: 'inherit' }
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ background: '#05080F', borderRadius: 12, padding: '0 16px', border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none', transition: 'all 0.2s ease' }}>
        {multiline
          ? <textarea rows={rows} placeholder={placeholder} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...shared, padding: '13px 0', resize: 'vertical' }} />
          : <input type={type} placeholder={placeholder} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...shared, padding: '13px 0' }} />
        }
      </div>
    </div>
  )
}

function Dropdown({ label, value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ background: '#05080F', borderRadius: 12, padding: '0 16px', border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none', transition: 'all 0.2s ease' }}>
        <select value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ background: 'none', border: 'none', outline: 'none', color: value ? '#fff' : 'rgba(255,255,255,0.25)', fontSize: 14, width: '100%', padding: '13px 0', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="" style={{ background: '#0A0F1E', color: 'rgba(255,255,255,0.4)' }}>{placeholder || 'Select…'}</option>
          {options.map(o => <option key={o} value={o} style={{ background: '#0A0F1E', color: '#fff' }}>{o}</option>)}
        </select>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-block', border: '2px solid rgba(5,8,15,0.25)', borderTop: '2px solid #05080F', animation: 'spin 0.7s linear infinite' }} />
    </>
  )
}

// ════════════════════════════════════════
//  CROP MODAL
// ════════════════════════════════════════
function CropModal({ imageSrc, onConfirm, onCancel }) {
  const imgRef = useRef(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    const c = centerCrop(makeAspectCrop({ unit: '%', width: 80 }, 1, width, height), width, height)
    setCrop(c)
  }, [])

  const handleConfirm = () => {
    if (!completedCrop || !imgRef.current) return
    const canvas = document.createElement('canvas')
    const image  = imgRef.current
    const scaleX = image.naturalWidth  / image.width
    const scaleY = image.naturalHeight / image.height
    const size   = 300
    canvas.width  = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, size, size
    )
    onConfirm(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#0A0F1E', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 480 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900 }}>✂️ Crop Your Photo</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Drag to reposition. Keep your face centered for best results.</p>
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, background: '#05080F', display: 'flex', justifyContent: 'center' }}>
          <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop style={{ maxHeight: 360 }}>
            <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} style={{ maxWidth: '100%', maxHeight: 360, display: 'block' }} alt="crop" />
          </ReactCrop>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px 0', borderRadius: 50, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={handleConfirm} style={{ flex: 2, padding: '12px 0', borderRadius: 50, border: 'none', background: '#00D4FF', color: '#05080F', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>✅ Use This Photo</button>
        </div>
      </div>
    </div>
  )
}

// ── Profile completeness calculator ──
function calcCompleteness(form) {
  const fields = ['photoBase64','name','whatsapp','state','gender','experience','previousWork','tools','bio','linkedin','instagram','portfolio']
  const filled = fields.filter(f => form[f] && form[f].toString().trim())
  return { score: Math.round((filled.length / fields.length) * 100), filled: filled.length, total: fields.length }
}

// ════════════════════════════════════════
//  SECTION: My Profile (upgraded)
// ════════════════════════════════════════
function ProfileSection({ user, profile, setProfile }) {
  const fileRef = useRef()
  const [form, setForm] = useState({
    name: '', bio: '', whatsapp: '', state: '',
    gender: '', experience: '', previousWork: '', tools: '',
    photoBase64: '', linkedin: '', instagram: '', portfolio: '',
    phoneVerified: false,
  })
  const [photoPreview, setPhotoPreview]   = useState('')
  const [cropSrc, setCropSrc]             = useState(null)
  const [photoError, setPhotoError]       = useState('')
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [formError, setFormError]         = useState('')
  const [phoneStep, setPhoneStep]         = useState('idle') // idle | sending | verify | done
  const [otp, setOtp]                     = useState('')
  const [otpSent, setOtpSent]             = useState('')
  const [otpError, setOtpError]           = useState('')
  const confirmationRef                    = useRef(null)

  useEffect(() => {
    if (profile) {
      setForm({
        name:          profile.name          || '',
        bio:           profile.bio           || '',
        whatsapp:      profile.whatsapp      || '',
        state:         profile.state         || '',
        gender:        profile.gender        || '',
        experience:    profile.experience    || '',
        previousWork:  profile.previousWork  || '',
        tools:         profile.tools         || '',
        photoBase64:   profile.photoBase64   || '',
        linkedin:      profile.linkedin      || '',
        instagram:     profile.instagram     || '',
        portfolio:     profile.portfolio     || '',
        phoneVerified: profile.phoneVerified || false,
      })
      if (profile.photoBase64) setPhotoPreview(profile.photoBase64)
      // Restore verified state on reload
      if (profile.phoneVerified) setPhoneStep('done')
    }
  }, [profile])

  const set = (f) => (e) => {
    const val = e.target.value
    // If user changes whatsapp number, reset verification
    if (f === 'whatsapp' && val !== form.whatsapp && form.phoneVerified) {
      setForm(p => ({ ...p, [f]: val, phoneVerified: false }))
      setPhoneStep('idle')
      setOtp('')
      setOtpError('')
    } else {
      setForm(p => ({ ...p, [f]: val }))
    }
    setFormError('')
  }

  // ── Photo file pick ──
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) { setPhotoError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image too large. Max 5MB.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = (base64) => {
    setCropSrc(null)
    setPhotoPreview(base64)
    setForm(p => ({ ...p, photoBase64: base64 }))
  }

  // ── Real Firebase Phone Auth OTP ──
  const sendOtp = async () => {
    if (!form.whatsapp || form.whatsapp.length < 10) { setOtpError('Enter a valid WhatsApp number first.'); return }
    setOtpError('')
    setPhoneStep('sending')

    // Format to international (+234XXXXXXXXXX)
    let phone = form.whatsapp.trim().replace(/\s+/g, '')
    if (phone.startsWith('0')) phone = '+234' + phone.slice(1)
    else if (!phone.startsWith('+')) phone = '+234' + phone

    try {
      // Always destroy old verifier before creating new one
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear() } catch(_) {}
        window.recaptchaVerifier = null
      }

      // Clear the container so reCAPTCHA can re-render
      const container = document.getElementById('recaptcha-container')
      if (container) container.innerHTML = ''

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          window.recaptchaVerifier = null
        }
      })

      await window.recaptchaVerifier.render()
      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
      confirmationRef.current = confirmation
      setPhoneStep('verify')
    } catch(e) {
      console.error('OTP error:', e.code, e.message)
      try { if (window.recaptchaVerifier) window.recaptchaVerifier.clear() } catch(_) {}
      window.recaptchaVerifier = null
      setOtpError(
        e.code === 'auth/invalid-phone-number' ? 'Invalid number. Use format: 08012345678' :
        e.code === 'auth/too-many-requests'    ? 'Too many attempts. Wait a few minutes and try again.' :
        e.code === 'auth/operation-not-allowed'? 'Phone auth not enabled. Contact support.' :
        e.code === 'auth/quota-exceeded'       ? 'Daily SMS limit reached. Try again tomorrow.' :
        'Failed to send OTP. Please try again.'
      )
      setPhoneStep('idle')
    }
  }

  const verifyOtp = async () => {
    if (!otp || !confirmationRef.current) return
    setOtpError('')
    try {
      await confirmationRef.current.confirm(otp)
      // Save to Firestore immediately so it persists on reload
      await updateDoc(doc(db, 'users', user.uid), { phoneVerified: true })
      setForm(p => ({ ...p, phoneVerified: true }))
      setPhoneStep('done')
    } catch(e) {
      setOtpError(e.code === 'auth/invalid-verification-code'
        ? 'Wrong code. Please check and try again.'
        : 'Verification failed. Try sending a new code.')
    }
  }

  const completeness = calcCompleteness(form)
  const hasPhoto = !!photoPreview

  const save = async () => {
    setFormError('')
    if (!form.photoBase64) { setFormError('Please upload a clear headshot photo before saving.'); return }
    if (!form.name.trim())  { setFormError('Please enter your full name.'); return }
    if (!form.state)        { setFormError('Please select your state.'); return }
    if (!form.whatsapp.trim()) { setFormError('Please enter your WhatsApp number.'); return }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...form })
      setProfile(p => ({ ...p, ...form }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div>
      <SectionHead title="My Profile" subtitle="Complete your profile to get discovered faster." />

      {/* ── Completeness bar ── */}
      <div style={{ marginBottom: 20, background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Profile Completeness</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: completeness.score >= 80 ? '#4CAF50' : completeness.score >= 50 ? '#FFB347' : '#FF6B6B' }}>{completeness.score}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completeness.score}%`, borderRadius: 3, background: completeness.score >= 80 ? '#4CAF50' : completeness.score >= 50 ? '#FFB347' : '#FF6B6B', transition: 'width 0.5s ease' }} />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '8px 0 0' }}>
          {completeness.score >= 80 ? '🏆 Great profile! You"ll rank higher on Explore.' : `Fill in ${completeness.total - completeness.filled} more fields to boost your visibility.`}
        </p>
      </div>

      <Card>
        {/* ── Photo upload ── */}
        <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>PROFILE PHOTO <span style={{ color: '#FF6B6B' }}>*required</span></p>
          {!hasPhoto && (
            <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              📸 <strong style={{ color: '#00D4FF' }}>Use a clear headshot</strong> — face visible, good lighting, no filters. This builds trust with clients. <span style={{ color: 'rgba(255,255,255,0.3)' }}>(Max 5MB · will be cropped to square)</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ width: 90, height: 90, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', position: 'relative', border: `2px dashed ${hasPhoto ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.15)'}`, overflow: 'hidden', background: hasPhoto ? 'transparent' : 'rgba(255,255,255,0.02)', transition: 'border 0.2s' }}>
              {photoPreview
                ? <img src={photoPreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 24 }}>📷</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.3, padding: '0 4px' }}>Click to upload</span>
                  </div>}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ fontSize: 20 }}>✏️</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <div>
              <button onClick={() => fileRef.current?.click()} style={{ padding: '9px 20px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
                {hasPhoto ? '🔄 Change Photo' : '📷 Upload Photo'}
              </button>
              {hasPhoto && <p style={{ color: '#4CAF50', fontSize: 12, margin: 0 }}>✅ Photo ready</p>}
              {photoError && <p style={{ color: '#FF6B6B', fontSize: 12, margin: 0 }}>{photoError}</p>}
            </div>
          </div>
        </div>

        {/* ── Basic info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="Full Name *" placeholder="e.g. Chioma Adeyemi" value={form.name} onChange={set('name')} />
          <Field label="WhatsApp Number *" placeholder="e.g. 08012345678" value={form.whatsapp} onChange={set('whatsapp')} />
        </div>

        {/* ── Phone verify ── */}
        <div style={{ marginBottom: 16, padding: '14px 16px', background: form.phoneVerified ? 'rgba(76,175,80,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${form.phoneVerified ? 'rgba(76,175,80,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12 }}>
          {form.phoneVerified ? (
            <p style={{ margin: 0, fontSize: 13, color: '#4CAF50', fontWeight: 700 }}>✅ Phone number verified — clients trust you more!</p>
          ) : (phoneStep === 'idle' || phoneStep === 'sending') ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>🔒 Verify your WhatsApp number to get a verified badge</p>
                <button onClick={sendOtp} disabled={phoneStep === 'sending'} style={{ padding: '7px 16px', borderRadius: 50, border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.08)', color: '#00D4FF', fontSize: 12, fontWeight: 700, cursor: phoneStep === 'sending' ? 'not-allowed' : 'pointer', opacity: phoneStep === 'sending' ? 0.6 : 1 }}>
                  {phoneStep === 'sending' ? '⏳ Sending…' : 'Send OTP'}
                </button>
              </div>
              <div id="recaptcha-container"></div>
            </div>
          ) : phoneStep === 'verify' ? (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Enter the 6-digit SMS code sent to your number:</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit code" maxLength={6}
                  style={{ flex: 1, background: '#05080F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
                <button onClick={verifyOtp} style={{ padding: '9px 18px', borderRadius: 50, border: 'none', background: '#00D4FF', color: '#05080F', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Verify</button>
              </div>
              {otpError && <p style={{ color: '#FF6B6B', fontSize: 12, margin: '0 0 6px' }}>{otpError}</p>}
              <button onClick={() => { setPhoneStep('idle'); setOtp(''); setOtpError(''); window.recaptchaVerifier = null }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                Resend code
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Dropdown label="State *" value={form.state} onChange={set('state')} options={NIGERIAN_STATES} placeholder="Select your state…" />
          <Dropdown label="Gender" value={form.gender} onChange={set('gender')} options={['Male','Female','Prefer not to say']} placeholder="Select gender…" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Dropdown label="Years of Experience" value={form.experience} onChange={set('experience')} options={EXPERIENCE_YEARS} placeholder="Select experience…" />
          <Field label="Tools / Software You Use" placeholder="e.g. Figma, Photoshop, Excel…" value={form.tools} onChange={set('tools')} />
        </div>
        <Field label="Where You've Worked Before" placeholder="e.g. Freelance, ABC Agency, Self-employed…" value={form.previousWork} onChange={set('previousWork')} />
        <Field label="Bio" placeholder="Tell people what you do, what makes you great, and who you help…" value={form.bio} onChange={set('bio')} multiline rows={4} />

        {/* ── Social links ── */}
        <div style={{ marginBottom: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>SOCIAL LINKS <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>— helps clients verify you</span></p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <Field label="💼 LinkedIn URL" placeholder="linkedin.com/in/yourname" value={form.linkedin} onChange={set('linkedin')} />
            <Field label="📸 Instagram Handle" placeholder="@yourhandle" value={form.instagram} onChange={set('instagram')} />
          </div>
          <Field label="🌐 Portfolio / Website" placeholder="yourwebsite.com" value={form.portfolio} onChange={set('portfolio')} />
        </div>

        {formError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>⚠️ {formError}</div>
        )}
        <button onClick={save} disabled={saving} style={{ padding: '13px 36px', borderRadius: 50, border: 'none', background: saving ? 'rgba(0,212,255,0.5)' : '#00D4FF', color: '#05080F', fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving ? <><Spinner /> Saving…</> : saved ? '✅ Profile Saved!' : 'Save Profile'}
        </button>
      </Card>

      {/* Crop modal */}
      {cropSrc && <CropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}
    </div>
  )
}

// ════════════════════════════════════════
//  SECTION: My Skills
// ════════════════════════════════════════
function SkillsSection({ user, onPost }) {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced]   = useState(false)

  const load = async () => {
    setLoading(true)
    const q = query(collection(db, 'skills'), where('uid', '==', user.uid))
    const snap = await getDocs(q)
    setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const remove = async (id) => {
    if (!window.confirm('Delete this skill listing?')) return
    setDeleting(id)
    await deleteDoc(doc(db, 'skills', id))
    setSkills(s => s.filter(x => x.id !== id))
    setDeleting(null)
  }

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60 }}>Loading your skills…</div>

  const syncProfileToSkills = async () => {
    setSyncing(true)
    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid))
      if (!profileSnap.exists()) return
      const p = profileSnap.data()
      const fieldsToSync = {
        photoBase64:   p.photoBase64   || '',
        gender:        p.gender        || '',
        experience:    p.experience    || '',
        tools:         p.tools         || '',
        previousWork:  p.previousWork  || '',
        linkedin:      p.linkedin      || '',
        instagram:     p.instagram     || '',
        portfolio:     p.portfolio     || '',
        phoneVerified: p.phoneVerified || false,
        name:          p.name          || '',
      }
      const q = query(collection(db, 'skills'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'skills', d.id), fieldsToSync)))
      setSynced(true)
      setTimeout(() => setSynced(false), 3000)
      load() // refresh list
    } catch(e) { console.error(e) }
    setSyncing(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <SectionHead title="My Skills" subtitle={`${skills.length} listing${skills.length !== 1 ? 's' : ''} published`} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={syncProfileToSkills} disabled={syncing}
            title="Update all your skill cards with your latest profile photo, experience and tools"
            style={{ padding: '10px 20px', borderRadius: 50, border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.08)', color: '#00D4FF', fontWeight: 700, fontSize: 13, cursor: syncing ? 'not-allowed' : 'pointer' }}>
            {synced ? '✅ Synced!' : syncing ? '⏳ Syncing…' : '🔄 Sync Profile'}
          </button>
          <button onClick={onPost} style={{ padding: '10px 24px', borderRadius: 50, border: 'none', background: '#00D4FF', color: '#05080F', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>+ Post New</button>
        </div>
      </div>
      {skills.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 28px' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🛠️</p>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No skills listed yet</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>Post your first skill and start getting discovered.</p>
          <button onClick={onPost} style={{ padding: '12px 28px', borderRadius: 50, border: 'none', background: '#00D4FF', color: '#05080F', fontWeight: 800, cursor: 'pointer' }}>Post a Skill →</button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {skills.map(s => (
            <Card key={s.id} style={{ padding: 20, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', padding: '3px 10px', borderRadius: 50 }}>{s.category}</span>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, paddingRight: 60 }}>{s.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 10 }}>📍 {s.city}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{s.description?.slice(0, 90)}{s.description?.length > 90 ? '…' : ''}</p>
              <button onClick={() => remove(s.id)} disabled={deleting === s.id} style={{ width: '100%', padding: '8px 0', borderRadius: 50, border: '1px solid rgba(255,80,80,0.3)', background: 'rgba(255,80,80,0.06)', color: '#FF6B6B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {deleting === s.id ? 'Deleting…' : 'Delete Listing'}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
//  SECTION: Post a Skill
// ════════════════════════════════════════
function PostSkillSection({ user, profile, onSuccess }) {
  const [form, setForm] = useState({ title: '', category: '', description: '', whatsapp: '', city: '', skillTools: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, whatsapp: profile.whatsapp || '', city: profile.state || '' }))
  }, [profile])

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setError('') }

  const submit = async () => {
    if (!form.title || !form.category || !form.description || !form.whatsapp || !form.city) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      await addDoc(collection(db, 'skills'), {
        ...form,
        uid: user.uid,
        name: profile?.name || user.displayName || '',
        email: user.email,
        photoBase64:   profile?.photoBase64   || '',
        gender:        profile?.gender        || '',
        experience:    profile?.experience    || '',
        tools:         profile?.tools         || '',
        previousWork:  profile?.previousWork  || '',
        linkedin:      profile?.linkedin      || '',
        instagram:     profile?.instagram     || '',
        portfolio:     profile?.portfolio     || '',
        phoneVerified: profile?.phoneVerified || false,
        rating: 0, reviews: 0, views: 0,
        createdAt: serverTimestamp(),
      })
      setForm({ title: '', category: '', description: '', whatsapp: profile?.whatsapp || '', city: profile?.state || '' })
      onSuccess()
    } catch(e) { setError('Failed to post. Try again.') }
    setLoading(false)
  }

  return (
    <div>
      <SectionHead title="Post a Skill" subtitle="Your listing goes live on Explore instantly." />
      <Card style={{ maxWidth: 640 }}>
        <Field label="Skill Title" placeholder="e.g. Math & Physics Tutor" value={form.title} onChange={set('title')} />
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{ padding: '8px 18px', borderRadius: 50, border: `1px solid ${form.category === c ? '#00D4FF' : 'rgba(255,255,255,0.1)'}`, background: form.category === c ? 'rgba(0,212,255,0.12)' : 'transparent', color: form.category === c ? '#00D4FF' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{c}</button>
            ))}
          </div>
        </div>
        <Field label="Description" placeholder="Describe what you offer, your experience, and pricing..." value={form.description} onChange={set('description')} multiline rows={4} />
        <Field label="Tools Used for This Skill" placeholder="e.g. VS Code, React (specific to this skill only)" value={form.skillTools} onChange={set('skillTools')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Field label="WhatsApp Number" placeholder="08012345678" value={form.whatsapp} onChange={set('whatsapp')} />
          <Dropdown label="State" value={form.city} onChange={set('city')} options={NIGERIAN_STATES} placeholder="Select state…" />
        </div>
        {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '14px 0', borderRadius: 50, border: 'none', background: loading ? 'rgba(0,212,255,0.5)' : '#00D4FF', color: '#05080F', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><Spinner /> Publishing…</> : 'Publish Skill →'}
        </button>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════
//  SECTION: Bookmarks (upgraded)
// ════════════════════════════════════════
function BookmarksSection({ user }) {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      const bIds = snap.data()?.bookmarks || []
      if (bIds.length === 0) { setLoading(false); return }
      const skills = await Promise.all(bIds.map(id => getDoc(doc(db, 'skills', id))))
      setBookmarks(skills.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() })))
      setLoading(false)
    }
    load()
  }, [user])

  const remove = async (skillId) => {
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    const updated = (snap.data()?.bookmarks || []).filter(id => id !== skillId)
    await updateDoc(ref, { bookmarks: updated })
    setBookmarks(b => b.filter(x => x.id !== skillId))
  }

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60 }}>Loading bookmarks…</div>

  return (
    <div>
      <SectionHead title="Bookmarks" subtitle={`${bookmarks.length} saved listing${bookmarks.length !== 1 ? 's' : ''}`} />
      {bookmarks.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 28px' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🔖</p>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No bookmarks yet</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>Browse skills on Explore and tap the bookmark icon to save them here.</p>
          <Link to="/explore" style={{ padding: '12px 28px', borderRadius: 50, border: 'none', background: '#00D4FF', color: '#05080F', fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>Browse Skills →</Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {bookmarks.map(s => (
            <Card key={s.id} style={{ padding: 20 }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.photoBase64
                    ? <img src={s.photoBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#00D4FF', fontWeight: 900, fontSize: 16 }}>{(s.name || '?')[0].toUpperCase()}</span>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>📍 {s.city}</p>
                </div>
                <button onClick={() => remove(s.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>✕</button>
              </div>
              <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{s.title}</p>
              <span style={{ fontSize: 11, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', padding: '3px 10px', borderRadius: 50, display: 'inline-block', marginBottom: 14 }}>{s.category}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>⭐ {s.rating > 0 ? s.rating.toFixed(1) : 'New'} · {s.reviews || 0} reviews</span>
                {s.experience && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>· {s.experience}</span>}
              </div>
              <a href={`https://wa.me/234${s.whatsapp?.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
                style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 50, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                💬 Connect on WhatsApp
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
//  SECTION: Stats
// ════════════════════════════════════════
function StatsSection({ user }) {
  const [stats, setStats] = useState({ totalSkills: 0, totalViews: 0, totalReviews: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'skills'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      const skills = snap.docs.map(d => d.data())
      const totalViews   = skills.reduce((a, s) => a + (s.views || 0), 0)
      const totalReviews = skills.reduce((a, s) => a + (s.reviews || 0), 0)
      const ratings      = skills.filter(s => s.rating > 0).map(s => s.rating)
      const avgRating    = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0
      setStats({ totalSkills: skills.length, totalViews, totalReviews, avgRating })
      setLoading(false)
    }
    load()
  }, [user])

  const tiles = [
    { icon: '🛠️', label: 'Skills Listed',  value: stats.totalSkills  },
    { icon: '👁️', label: 'Total Views',    value: stats.totalViews   },
    { icon: '⭐', label: 'Avg Rating',     value: stats.avgRating || '—' },
    { icon: '💬', label: 'Total Reviews',  value: stats.totalReviews },
  ]

  return (
    <div>
      <SectionHead title="Stats" subtitle="How your listings are performing." />
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60 }}>Loading stats…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {tiles.map((t, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: '28px 20px' }}>
              <p style={{ fontSize: 34, margin: '0 0 8px' }}>{t.icon}</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#00D4FF', margin: '0 0 6px', letterSpacing: '-1px' }}>{t.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>{t.label}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
//  MAIN DASHBOARD
// ════════════════════════════════════════
export default function Dashboard() {
  const [user, authLoading] = useAuthState(auth)
  const [active, setActive]         = useState('profile')
  const [profile, setProfile]       = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [photoPopup, setPhotoPopup]     = useState(false)
  const [logoutModal, setLogoutModal]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => { if (!authLoading && !user) navigate('/login') }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    setProfileLoading(true)
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data())
      setProfileLoading(false)
    })
  }, [user])

  const handleLogout = async () => { await signOut(auth); navigate('/') }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#05080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
    </div>
  )
  if (!user) return null

  const initials = (profile?.name || user.displayName || user.email || '?')[0].toUpperCase()
  const photoBase64 = profile?.photoBase64 || ''

  return (
    <div style={{ minHeight: '100vh', background: '#05080F', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex' }}>
      <style>{`
        * { box-sizing: border-box; }
        textarea { font-family: inherit; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #05080F inset !important; -webkit-text-fill-color: #fff !important; }
        select option { background: #0A0F1E; color: #fff; }
        .nav-item:hover { background: rgba(255,255,255,0.04) !important; color: #fff !important; }
        .nav-item.active { background: rgba(0,212,255,0.1) !important; color: #00D4FF !important; }
        @media (max-width: 768px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            position: fixed !important;
            z-index: 300;
            height: 100vh;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            display: flex !important;
            flex-direction: column !important;
          }
          .dashboard-sidebar.open { transform: translateX(0) !important; }
          .dashboard-main { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
          .dash-content { padding: 20px 16px !important; }
        }
        @media (min-width: 769px) { .mobile-topbar { display: none !important; } }
      `}</style>

      {/* ── Sidebar ── */}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 240, background: '#080C18', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🪙</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Skill<span style={{ color: '#00D4FF' }}>Mint</span></span>
          </Link>
        </div>

        {/* User pill */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => photoBase64 && setPhotoPopup(true)} style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: photoBase64 ? 'pointer' : 'default' }}>
            {photoBase64
              ? <img src={photoBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#00D4FF', fontWeight: 900, fontSize: 16 }}>{initials}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name || user.displayName || 'Welcome'}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto', minHeight: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setActive(n.id); setSidebarOpen(false) }}
              className={`nav-item${active === n.id ? ' active' : ''}`}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: active === n.id ? '#00D4FF' : 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 2, textAlign: 'left', transition: 'all 0.15s ease', borderLeft: active === n.id ? '3px solid #00D4FF' : '3px solid transparent' }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom" style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
          <Link to="/explore" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 4 }}>🔍 Browse Explore</Link>
          <button onClick={() => { setSidebarOpen(false); setLogoutModal(true) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(255,80,80,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>🚪 Log Out</button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 250 }} />}

      {/* ── Photo popup ── */}
      {photoPopup && (
        <div onClick={() => setPhotoPopup(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'relative', maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPhotoPopup(false)} style={{ position: 'absolute', top: -16, right: -16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, fontWeight: 700 }}>✕</button>
            <img src={photoBase64} alt="Profile" style={{ width: '100%', borderRadius: 20, display: 'block', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', border: '2px solid rgba(0,212,255,0.2)' }} />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 14 }}>{profile?.name || ''}</p>
          </div>
        </div>
      )}

      {/* ── Logout confirm modal ── */}
      {logoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0A0F1E', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 24, padding: '36px 32px', width: '100%', maxWidth: 380, textAlign: 'center', animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🚪</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>Log Out?</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Are you sure you want to log out of SkillMint?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setLogoutModal(false)} style={{ flex: 1, padding: '13px 0', borderRadius: 50, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '13px 0', borderRadius: 50, border: 'none', background: 'rgba(255,80,80,0.15)', color: '#FF6B6B', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: '1px solid rgba(255,80,80,0.3)' }}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="dashboard-main" style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-topbar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#080C18', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 90 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>☰</button>
          <span style={{ fontWeight: 900, fontSize: 16 }}>Skill<span style={{ color: '#00D4FF' }}>Mint</span></span>
          <div onClick={() => photoBase64 && setPhotoPopup(true)} style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: photoBase64 ? 'pointer' : 'default' }}>
            {photoBase64 ? <img src={photoBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#00D4FF', fontWeight: 900, fontSize: 13 }}>{initials}</span>}
          </div>
        </div>

        <div className="dash-content" style={{ padding: '40px 36px', maxWidth: 900, width: '100%' }}>
          {profileLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.2)', borderTop: '3px solid #00D4FF', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading your profile…</p>
            </div>
          ) : null}
          {!profileLoading && active === 'profile'   && <ProfileSection   user={user} profile={profile} setProfile={setProfile} />}
          {!profileLoading && active === 'skills'    && <SkillsSection    user={user} onPost={() => setActive('post')} />}
          {!profileLoading && active === 'post'      && <PostSkillSection user={user} profile={profile} onSuccess={() => setActive('skills')} />}
          {!profileLoading && active === 'bookmarks' && <BookmarksSection user={user} />}
          {!profileLoading && active === 'stats'     && <StatsSection     user={user} />}
        </div>
      </main>
    </div>
  )
}