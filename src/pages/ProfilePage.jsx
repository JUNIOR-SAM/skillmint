import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuthState } from 'react-firebase-hooks/auth'

const ADMIN_EMAIL = 'oyebodes19@gmail.com'
const COLOR_MAP = {
  Education: '#00D4FF', Tech: '#7B61FF', Creative: '#FF6B6B',
  Trade: '#FFB347', Health: '#4CAF50', Business: '#FF6B9D',
}
const categoryColor = (cat) => COLOR_MAP[cat] || '#00D4FF'

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'inline-block', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #00D4FF', animation: 'spin 0.7s linear infinite' }} />
    </>
  )
}

// ── Skill detail + review modal (shown when card is clicked on profile page) ──
function SkillModal({ skill, onClose, user, isOwnProfile, onReviewSubmit }) {
  const color = categoryColor(skill.category)
  const waLink = `https://wa.me/234${skill.whatsapp?.replace(/^0/, '')}`
  const backdropRef = useRef()

  const [starHover, setStarHover] = useState(0)
  const [starPick, setStarPick]   = useState(0)
  const [comment, setComment]     = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewed, setReviewed]   = useState(false)
  const [reviewFocus, setReviewFocus] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [])

  const submitReview = async () => {
    if (!starPick || !user) return
    setReviewing(true)
    try {
      const ref  = doc(db, 'skills', skill.id)
      const snap = await getDoc(ref)
      const data = snap.data()
      const oldR = data.reviews || 0
      const oldRating = data.rating || 0
      const newR = oldR + 1
      const newRating = ((oldRating * oldR) + starPick) / newR
      const rounded = Math.round(newRating * 10) / 10
      await updateDoc(ref, { rating: rounded, reviews: newR })
      const { addDoc, collection: col } = await import('firebase/firestore')
      await addDoc(col(db, 'reviews'), {
        skillId: skill.id, uid: user.uid,
        name: user.displayName || 'Anonymous',
        rating: starPick, comment, createdAt: new Date(),
      })
      onReviewSubmit(skill.id, rounded, newR)
      setReviewed(true)
    } catch(e) { console.error(e) }
    setReviewing(false)
  }

  return (
    <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      <div style={{ background: '#0A0F1E', border: `1px solid ${color}25`, borderRadius: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 0 80px ${color}15`, animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, background: `${color}15`, color, padding: '4px 12px', borderRadius: 50, fontWeight: 700 }}>{skill.category}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px 28px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.5px' }}>{skill.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, fontSize: 14, marginBottom: 16 }}>{skill.description}</p>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {skill.experience && <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '4px 12px', color: 'rgba(255,255,255,0.5)' }}>🎓 {skill.experience}</span>}
            {skill.skillTools && <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '4px 12px', color: 'rgba(255,255,255,0.5)' }}>🔧 {skill.skillTools}</span>}
            {skill.city && <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '4px 12px', color: 'rgba(255,255,255,0.5)' }}>📍 {skill.city}</span>}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div><p style={{ color, fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{skill.rating > 0 ? skill.rating.toFixed(1) : '—'}</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>Rating</p></div>
            <div><p style={{ color, fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{skill.reviews || 0}</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>Reviews</p></div>
            <div><p style={{ color, fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{skill.views || 0}</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>Views</p></div>
          </div>

          {/* WhatsApp */}
          <a href={waLink} target="_blank" rel="noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 50, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 20 }}>
            💬 Connect on WhatsApp
          </a>

          {/* Review section — only for OTHER users, not your own skill */}
          {user && !isOwnProfile && (
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                {reviewed ? '✅ Review submitted!' : '⭐ Leave a Review'}
              </p>
              {!reviewed ? (
                <>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n}
                        onMouseEnter={() => setStarHover(n)} onMouseLeave={() => setStarHover(0)}
                        onClick={() => setStarPick(n)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: 0, color: n <= (starHover || starPick) ? '#FFD700' : 'rgba(255,255,255,0.15)', transition: 'all 0.15s', transform: n <= (starHover || starPick) ? 'scale(1.2)' : 'scale(1)' }}>★</button>
                    ))}
                    {starPick > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, alignSelf: 'center', marginLeft: 6 }}>{['','Poor','Fair','Good','Great','Excellent'][starPick]}</span>}
                  </div>
                  <div style={{ marginBottom: 12, background: '#05080F', borderRadius: 12, padding: '0 14px', border: `1px solid ${reviewFocus ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`, transition: 'border 0.2s' }}>
                    <textarea rows={2} placeholder="Say something (optional)…" value={comment} onChange={e => setComment(e.target.value)} onFocus={() => setReviewFocus(true)} onBlur={() => setReviewFocus(false)}
                      style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '12px 0', resize: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <button onClick={submitReview} disabled={!starPick || reviewing}
                    style={{ width: '100%', padding: '11px 0', borderRadius: 50, border: 'none', background: starPick ? color : 'rgba(255,255,255,0.06)', color: starPick ? '#05080F' : 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 14, cursor: starPick ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                    {reviewing ? 'Submitting…' : 'Submit Review'}
                  </button>
                </>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Thanks! Your review helps others find great skills.</p>
              )}
            </div>
          )}

          {!user && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              <Link to="/signup" style={{ color: '#00D4FF', textDecoration: 'none', fontWeight: 700 }}>Sign up free</Link> to leave a review
            </p>
          )}

          {isOwnProfile && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>This is your skill — others can rate it.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skill card (clickable, opens modal) ──
function ProfileSkillCard({ skill, user, bookmarks, onToggleBookmark, onClick }) {
  const color = categoryColor(skill.category)
  const isBookmarked = bookmarks.includes(skill.id)

  return (
    <div onClick={onClick}
      style={{ background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, background: `${color}15`, color, padding: '4px 12px', borderRadius: 50, fontWeight: 700 }}>{skill.category}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>👁 {skill.views || 0}</span>
          {user && (
            <button onClick={e => { e.stopPropagation(); onToggleBookmark(skill.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: isBookmarked ? 1 : 0.25, transition: 'opacity 0.2s', padding: 0 }}>
              🔖
            </button>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>{skill.title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{skill.description?.slice(0,100)}{skill.description?.length > 100 ? '…' : ''}</p>

      {/* Tags — only experience and city, NOT profile tools (that's handled per-skill via skillTools) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skill.experience && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '3px 10px', color: 'rgba(255,255,255,0.4)' }}>🎓 {skill.experience}</span>}
        {skill.skillTools && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '3px 10px', color: 'rgba(255,255,255,0.4)' }}>🔧 {skill.skillTools}</span>}
        {skill.city && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '3px 10px', color: 'rgba(255,255,255,0.4)' }}>📍 {skill.city}</span>}
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#FFD700', fontSize: 13 }}>{'★'.repeat(Math.round(skill.rating || 0))}{'☆'.repeat(5 - Math.round(skill.rating || 0))}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{skill.rating > 0 ? skill.rating.toFixed(1) : 'No rating'} · {skill.reviews || 0} review{skill.reviews !== 1 ? 's' : ''}</span>
      </div>

      <p style={{ fontSize: 12, color: 'rgba(0,212,255,0.6)', margin: 0, fontWeight: 600 }}>Tap to view details & connect →</p>
    </div>
  )
}

// ════════════════════════════════════════
//  MAIN PROFILE PAGE
// ════════════════════════════════════════
export default function ProfilePage() {
  const { userId } = useParams()
  const navigate   = useNavigate()
  const [user]     = useAuthState(auth)

  const [profile, setProfile]       = useState(null)
  const [skills, setSkills]         = useState([])
  const [bookmarks, setBookmarks]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [selectedSkill, setSelectedSkill] = useState(null)

  const isOwnProfile = user?.uid === userId

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const profileSnap = await getDoc(doc(db, 'users', userId))
      if (!profileSnap.exists()) { setNotFound(true); setLoading(false); return }
      setProfile(profileSnap.data())
      const q = query(collection(db, 'skills'), where('uid', '==', userId))
      const snap = await getDocs(q)
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [userId])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => setBookmarks(snap.data()?.bookmarks || []))
  }, [user])

  const handleToggleBookmark = async (skillId) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    if (bookmarks.includes(skillId)) {
      await updateDoc(ref, { bookmarks: arrayRemove(skillId) })
      setBookmarks(b => b.filter(id => id !== skillId))
    } else {
      await updateDoc(ref, { bookmarks: arrayUnion(skillId) })
      setBookmarks(b => [...b, skillId])
    }
  }

  const handleOpenSkill = async (skill) => {
    setSelectedSkill(skill)
    // increment view
    try {
      await updateDoc(doc(db, 'skills', skill.id), { views: increment(1) })
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, views: (s.views || 0) + 1 } : s))
    } catch(_) {}
  }

  const handleReviewSubmit = (skillId, newRating, newReviews) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, rating: newRating, reviews: newReviews } : s))
    setSelectedSkill(prev => prev ? { ...prev, rating: newRating, reviews: newReviews } : prev)
  }

  const totalViews   = skills.reduce((a, s) => a + (s.views || 0), 0)
  const totalReviews = skills.reduce((a, s) => a + (s.reviews || 0), 0)
  const ratings      = skills.filter(s => s.rating > 0).map(s => s.rating)
  const avgRating    = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#05080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#05080F', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
      <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Profile not found</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>This user doesn't exist or has been removed.</p>
      <Link to="/explore" style={{ padding: '12px 28px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 800, textDecoration: 'none' }}>Back to Explore</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#05080F', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        textarea { font-family: inherit; }
        @media (max-width: 640px) {
          .profile-header-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .profile-bio-block { align-items: center !important; text-align: center !important; }
          .profile-bio-block p { text-align: center !important; }
          .profile-socials { justify-content: center !important; }
          .profile-stats { justify-content: center !important; }
          .profile-skills-grid { grid-template-columns: 1fr !important; }
          .profile-skills-header { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 24px', background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🪙</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Skill<span style={{ color: '#00D4FF' }}>Mint</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 18px', borderRadius: 50, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>← Back</button>
          {user
            ? <Link to="/dashboard" style={{ padding: '9px 20px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
            : <Link to="/signup" style={{ padding: '9px 20px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Get Started</Link>
          }
        </div>
      </nav>

      {/* Profile header */}
      <div style={{ paddingTop: 90, background: 'linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
          <div className="profile-header-inner" style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(0,212,255,0.15)' }}>
                {profile.photoBase64
                  ? <img src={profile.photoBase64} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#00D4FF', fontWeight: 900, fontSize: 44 }}>{(profile.name || '?')[0].toUpperCase()}</span>
                }
              </div>
            </div>

            {/* Bio block — centered on mobile */}
            <div className="profile-bio-block" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{profile.name}</h1>
                {profile.emailVerified && <span style={{ fontSize: 12, background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', padding: '4px 12px', borderRadius: 50, fontWeight: 700 }}>✅ Verified</span>}
                {user?.email === ADMIN_EMAIL && <span style={{ fontSize: 11, background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)', padding: '3px 10px', borderRadius: 50, fontWeight: 700 }}>👑 Admin View</span>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                {profile.state && <span>📍 {profile.state}</span>}
                {profile.gender && <span>· {profile.gender}</span>}
                {profile.experience && <span>· 🎓 {profile.experience}</span>}
              </div>

              {profile.bio && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.75, marginBottom: 14, maxWidth: 560, margin: '0 0 14px' }}>{profile.bio}</p>}

              {/* Profile-level tools (general tools the person knows overall) */}
              {profile.tools && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}><span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>🔧 Tools:</span> {profile.tools}</p>}
              {profile.previousWork && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' }}><span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>🏢 Previously:</span> {profile.previousWork}</p>}

              {/* Social links */}
              {(profile.linkedin || profile.instagram || profile.portfolio) && (
                <div className="profile-socials" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {profile.linkedin  && <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#00D4FF', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)' }}>💼 LinkedIn</a>}
                  {profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#FF6B9D', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(255,107,157,0.2)', background: 'rgba(255,107,157,0.06)' }}>📸 Instagram</a>}
                  {profile.portfolio && <a href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#7B61FF', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(123,97,255,0.2)', background: 'rgba(123,97,255,0.06)' }}>🌐 Portfolio</a>}
                </div>
              )}

              {/* Stats */}
              <div className="profile-stats" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Skills', value: skills.length },
                  { label: 'Total Views', value: totalViews },
                  { label: 'Reviews', value: totalReviews },
                  { label: 'Avg Rating', value: avgRating ? `⭐ ${avgRating}` : '—' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: '#00D4FF', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills section */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div className="profile-skills-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>Skills Offered</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>{skills.length} listing{skills.length !== 1 ? 's' : ''} · tap a card to view details</p>
          </div>
          {profile.whatsapp && (
            <a href={`https://wa.me/234${profile.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
              style={{ padding: '11px 24px', borderRadius: 50, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', flexShrink: 0 }}>
              💬 Message {profile.name?.split(' ')[0]}
            </a>
          )}
        </div>

        {skills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🛠️</p>
            <p>No skills listed yet.</p>
          </div>
        ) : (
          <div className="profile-skills-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {skills.map(s => (
              <ProfileSkillCard key={s.id} skill={s} user={user}
                bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark}
                onClick={() => handleOpenSkill(s)} />
            ))}
          </div>
        )}
      </div>

      {/* Skill detail modal */}
      {selectedSkill && (
        <SkillModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          user={user}
          isOwnProfile={isOwnProfile}
          onReviewSubmit={handleReviewSubmit}
        />
      )}
    </div>
  )
}