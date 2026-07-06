import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  collection, query, orderBy, getDocs, doc,
  updateDoc, increment, getDoc, arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuthState } from 'react-firebase-hooks/auth'

const CATEGORIES = ['All', 'Education', 'Tech', 'Creative', 'Trade', 'Health', 'Business']
const ADMIN_EMAIL = 'oyebodes19@gmail.com'

const COLOR_MAP = {
  Education: '#00D4FF', Tech: '#7B61FF', Creative: '#FF6B6B',
  Trade: '#FFB347', Health: '#4CAF50', Business: '#FF6B9D',
}

function categoryColor(cat) { return COLOR_MAP[cat] || '#00D4FF' }

// ── Nav ──
function Nav({ user }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '14px 24px',
      background: scrolled ? 'rgba(5,8,15,0.95)' : 'rgba(5,8,15,0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🪙</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Skill<span style={{ color: '#00D4FF' }}>Mint</span></span>
      </Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {user ? (
          <Link to="/dashboard" style={{ padding: '9px 20px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
        ) : (
          <>
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', padding: '9px 16px' }}>Log in</Link>
            <Link to="/signup" style={{ padding: '9px 20px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  )
}

// ── Skill Card ──
function SkillCard({ skill, onOpen, bookmarks, onToggleBookmark, user, onAdminDelete, onNavigate, currentUserId }) {
  const color = categoryColor(skill.category)
  const isBookmarked = bookmarks.includes(skill.id)
  return (
    <div
      onClick={() => { if (currentUserId && skill.uid === currentUserId) { onOpen(skill) } else { onNavigate(skill.uid) } }}
      style={{
        background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, padding: 20, cursor: 'pointer',
        transition: 'all 0.22s ease', position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${color}30`; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)` }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Bookmark button */}
      {user && (
        <button
          onClick={e => { e.stopPropagation(); onToggleBookmark(skill.id) }}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: isBookmarked ? 1 : 0.3, transition: 'opacity 0.2s' }}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >🔖</button>
      )}



      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: `${color}15`, border: `1px solid ${color}25`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {skill.photoBase64
            ? <img src={skill.photoBase64} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ color, fontWeight: 900, fontSize: 18 }}>{(skill.name||'?')[0].toUpperCase()}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.name}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>📍 {skill.city}</p>
        </div>
      </div>

      {/* Title */}
      <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{skill.title}</p>

      {/* Description preview */}
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, marginBottom: 14, height: 42, overflow: 'hidden' }}>
        {skill.description?.slice(0, 80)}{skill.description?.length > 80 ? '…' : ''}
      </p>

      {/* Category pill */}
      <span style={{ fontSize: 11, background: `${color}15`, color, padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>{skill.category}</span>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          ⭐ {skill.rating > 0 ? skill.rating.toFixed(1) : 'New'} · {skill.reviews || 0} reviews
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>👁 {skill.views || 0}</span>
      </div>

      {/* Admin delete — full width at bottom, clearly separated */}
      {user?.email === ADMIN_EMAIL && (
        <button
          onClick={e => { e.stopPropagation(); onAdminDelete(skill.id, skill.title) }}
          style={{ marginTop: 12, width: '100%', padding: '7px 0', borderRadius: 10, border: '1px solid rgba(255,80,80,0.25)', background: 'rgba(255,80,80,0.06)', color: '#FF6B6B', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
        >🗑 Admin Delete</button>
      )}
    </div>
  )
}

// ── Detail Modal ──
function SkillModal({ skill, onClose, user, bookmarks, onToggleBookmark, onReviewSubmit, onAdminDelete }) {
  const color = categoryColor(skill.category)
  const isBookmarked = bookmarks.includes(skill.id)
  const waLink = `https://wa.me/234${skill.whatsapp?.replace(/^0/, '')}`

  const [starHover, setStarHover] = useState(0)
  const [starPick, setStarPick]   = useState(0)
  const [comment, setComment]     = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewed, setReviewed]   = useState(false)
  const [reviewFocus, setReviewFocus] = useState(false)
  const isOwn = user?.uid === skill.uid

  const submitReview = async () => {
    if (!starPick) return
    setReviewing(true)
    try {
      const ref = doc(db, 'skills', skill.id)
      const snap = await getDoc(ref)
      const data = snap.data()
      const oldReviews = data.reviews || 0
      const oldRating  = data.rating  || 0
      const newReviews = oldReviews + 1
      const newRating  = ((oldRating * oldReviews) + starPick) / newReviews
      await updateDoc(ref, { rating: Math.round(newRating * 10) / 10, reviews: newReviews })
      const { addDoc: aDoc, collection: col } = await import('firebase/firestore')
      await aDoc(col(db, 'reviews'), {
        skillId: skill.id, uid: user.uid, name: user.displayName || 'Anonymous',
        rating: starPick, comment, createdAt: new Date(),
      })
      onReviewSubmit(skill.id, Math.round(newRating * 10) / 10, newReviews)
      setReviewed(true)
    } catch(e) { console.error(e) }
    setReviewing(false)
  }

  // Close on backdrop click
  const backdropRef = useRef()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [])

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: '#0A0F1E', border: `1px solid ${color}25`,
        borderRadius: 24, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: `0 0 80px ${color}15`,
        animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes modalPop {
            from { opacity: 0; transform: scale(0.92) translateY(20px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', overflow: 'hidden', background: `${color}18`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {skill.photoBase64
                ? <img src={skill.photoBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color, fontWeight: 900, fontSize: 22 }}>{(skill.name || '?')[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>{skill.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>📍 {skill.city}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {user?.email === ADMIN_EMAIL && (
              <button onClick={() => { onAdminDelete(skill.id, skill.title); onClose() }}
                style={{ padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(255,80,80,0.3)', background: 'rgba(255,80,80,0.1)', color: '#FF6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🗑 Delete
              </button>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, flex: 1 }}>{skill.title}</h2>
            <span style={{ fontSize: 11, background: `${color}15`, color, padding: '4px 12px', borderRadius: 50, fontWeight: 700, flexShrink: 0 }}>{skill.category}</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, fontSize: 14, marginBottom: 20 }}>{skill.description}</p>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {skill.phoneVerified && <span style={{ fontSize: 11, background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', padding: '4px 12px', borderRadius: 50, fontWeight: 700 }}>✅ Verified</span>}
            {skill.experience && <span style={{ fontSize: 11, background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)', padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>🎓 {skill.experience}</span>}
            {skill.gender && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 50 }}>{skill.gender}</span>}
          </div>

          {/* Extra profile details */}
          {(skill.tools || skill.previousWork) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 20, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              {skill.tools && <div><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Tools & Skills</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{skill.tools}</p></div>}
              {skill.previousWork && <div><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Previous Work</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{skill.previousWork}</p></div>}
            </div>
          )}

          {/* Social links */}
          {(skill.linkedin || skill.instagram || skill.portfolio) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {skill.linkedin  && <a href={skill.linkedin.startsWith('http') ? skill.linkedin : `https://${skill.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#00D4FF', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)' }}>💼 LinkedIn</a>}
              {skill.instagram && <a href={`https://instagram.com/${skill.instagram.replace('@','')}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#FF6B9D', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(255,107,157,0.2)', background: 'rgba(255,107,157,0.06)' }}>📸 Instagram</a>}
              {skill.portfolio && <a href={skill.portfolio.startsWith('http') ? skill.portfolio : `https://${skill.portfolio}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#7B61FF', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(123,97,255,0.2)', background: 'rgba(123,97,255,0.06)' }}>🌐 Portfolio</a>}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color, fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{skill.rating > 0 ? skill.rating.toFixed(1) : '—'}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Rating</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color, fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{skill.reviews || 0}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Reviews</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color, fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{skill.views || 0}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Views</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <a href={waLink} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 50, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
              💬 Connect on WhatsApp
            </a>
            {user && (
              <button
                onClick={() => onToggleBookmark(skill.id)}
                style={{ width: 48, height: 48, borderRadius: '50%', border: `1px solid ${isBookmarked ? color : 'rgba(255,255,255,0.12)'}`, background: isBookmarked ? `${color}15` : 'transparent', color: isBookmarked ? color : 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
                🔖
              </button>
            )}
          </div>

          {!user && (
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              <Link to="/signup" style={{ color: '#00D4FF', textDecoration: 'none', fontWeight: 700 }}>Sign up free</Link> to bookmark this skill
            </p>
          )}

          {/* ── Review section ── */}
          {user && !isOwn && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                {reviewed ? '✅ Review submitted!' : 'Leave a Review'}
              </p>
              {!reviewed ? (
                <>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n}
                        onMouseEnter={() => setStarHover(n)}
                        onMouseLeave={() => setStarHover(0)}
                        onClick={() => setStarPick(n)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: 0,
                          color: n <= (starHover || starPick) ? '#FFD700' : 'rgba(255,255,255,0.15)',
                          transition: 'color 0.15s, transform 0.15s',
                          transform: n <= (starHover || starPick) ? 'scale(1.2)' : 'scale(1)',
                        }}>★</button>
                    ))}
                    {starPick > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, alignSelf: 'center', marginLeft: 6 }}>{['','Poor','Fair','Good','Great','Excellent'][starPick]}</span>}
                  </div>
                  {/* Comment */}
                  <div style={{ marginBottom: 12, background: '#05080F', borderRadius: 12, padding: '0 14px', border: `1px solid ${reviewFocus ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`, transition: 'border 0.2s' }}>
                    <textarea rows={2} placeholder="Say something about this skill (optional)…"
                      value={comment} onChange={e => setComment(e.target.value)}
                      onFocus={() => setReviewFocus(true)} onBlur={() => setReviewFocus(false)}
                      style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '12px 0', resize: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <button onClick={submitReview} disabled={!starPick || reviewing}
                    style={{ width: '100%', padding: '11px 0', borderRadius: 50, border: 'none',
                      background: starPick ? color : 'rgba(255,255,255,0.06)',
                      color: starPick ? '#05080F' : 'rgba(255,255,255,0.3)',
                      fontWeight: 800, fontSize: 14, cursor: starPick ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                    {reviewing ? 'Submitting…' : 'Submit Review'}
                  </button>
                </>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Thanks for your feedback! It helps others find great skills.</p>
              )}
            </div>
          )}

          {user && isOwn && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
              This is your skill listing — others can rate it.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Leaderboard sidebar ──
function LeaderboardSidebar({ skills }) {
  const top = [...skills]
    .filter(s => s.rating > 0 || s.reviews > 0 || s.views > 0)
    .sort((a, b) => (b.rating * 10 + b.reviews * 2 + b.views * 0.1) - (a.rating * 10 + a.reviews * 2 + a.views * 0.1))
    .slice(0, 5)

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

  return (
    <aside style={{ width: 260, flexShrink: 0 }}>
      <div className="sidebar-inner" style={{ position: 'sticky', top: 100 }}>
        <div style={{ background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, marginBottom: 16, flex: 1, minWidth: 260, maxWidth: 400 }}>
          <p style={{ color: '#00D4FF', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>🏆 Leaderboard</p>
          {top.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No ratings yet. Be the first!</p>
          ) : top.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < top.length - 1 ? 14 : 0 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{medals[i]}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{s.name} · ⭐ {s.rating > 0 ? s.rating.toFixed(1) : 'New'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick CTA */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(123,97,255,0.08))', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 20, padding: 20, textAlign: 'center', flex: 1, minWidth: 260, maxWidth: 400 }}>
          <p style={{ fontSize: 22, marginBottom: 8 }}>🪙</p>
          <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>List your skill</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>Get discovered by people who need you.</p>
          <Link to="/signup" style={{ display: 'block', padding: '10px 0', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Get Started Free</Link>
        </div>
      </div>
    </aside>
  )
}

// ════════════════════════════════════════
//  MAIN EXPLORE PAGE
// ════════════════════════════════════════
export default function ExplorePage() {
  const navigate = useNavigate()
  const [user] = useAuthState(auth)
  const [skills, setSkills]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedSkill, setSelectedSkill]   = useState(null)
  const [bookmarks, setBookmarks] = useState([])

  // Load skills from Firestore
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  // Load user bookmarks
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      setBookmarks(snap.data()?.bookmarks || [])
    })
  }, [user])

  // Admin delete skill
  const handleAdminDelete = async (skillId, skillTitle) => {
    if (!window.confirm(`Delete "${skillTitle}"? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'skills', skillId))
      setSkills(prev => prev.filter(s => s.id !== skillId))
      if (selectedSkill?.id === skillId) setSelectedSkill(null)
    } catch(e) { alert('Failed to delete. Try again.') }
  }

  // Open modal + increment view count
  const handleOpen = async (skill) => {
    setSelectedSkill(skill)
    // increment view in Firestore silently
    try {
      await updateDoc(doc(db, 'skills', skill.id), { views: increment(1) })
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, views: (s.views || 0) + 1 } : s))
    } catch (_) {}
  }

  // Toggle bookmark
  const handleToggleBookmark = async (skillId) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const isBookmarked = bookmarks.includes(skillId)
    if (isBookmarked) {
      await updateDoc(ref, { bookmarks: arrayRemove(skillId) })
      setBookmarks(b => b.filter(id => id !== skillId))
    } else {
      await updateDoc(ref, { bookmarks: arrayUnion(skillId) })
      setBookmarks(b => [...b, skillId])
    }
  }

  // Update skill rating/reviews locally after review submitted
  const handleReviewSubmit = (skillId, newRating, newReviews) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, rating: newRating, reviews: newReviews } : s))
    setSelectedSkill(prev => prev ? { ...prev, rating: newRating, reviews: newReviews } : prev)
  }

  // Filter logic
  const filtered = skills.filter(s => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: '#05080F', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        .category-btn:hover { border-color: rgba(0,212,255,0.4) !important; color: rgba(255,255,255,0.8) !important; }
        .skill-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        @media (max-width: 900px) {
          .explore-layout { flex-direction: column !important; }
          .explore-sidebar { width: 100% !important; display: flex !important; gap: 16px !important; flex-wrap: wrap !important; justify-content: center !important; }
        }
        @media (max-width: 900px) {
          .sidebar-inner { position: static !important; display: flex; flex-direction: column; width: 100%; }
        }
        @media (max-width: 560px) {
          .skill-card-grid { grid-template-columns: 1fr !important; }
          .explore-search { flex-direction: column !important; }
        }
      `}</style>

      <Nav user={user} />

      {/* Hero bar */}
      <div style={{ paddingTop: 90, paddingBottom: 32, background: 'linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ color: '#00D4FF', fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>Explore Skills</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 6px' }}>Find the skill you need</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, margin: '0 0 28px' }}>{skills.length} skills listed · Connect instantly on WhatsApp</p>

          {/* Search + filter row */}
          <div className="explore-search" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search input */}
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.25)' }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search skills, names, cities…"
                style={{ width: '100%', background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '13px 20px 13px 44px', color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)} className="category-btn"
                  style={{ padding: '10px 18px', borderRadius: 50, border: `1px solid ${activeCategory === c ? '#00D4FF' : 'rgba(255,255,255,0.1)'}`, background: activeCategory === c ? 'rgba(0,212,255,0.12)' : 'transparent', color: activeCategory === c ? '#00D4FF' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: cards + sidebar */}
      <div className="explore-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Cards grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🔄</p>
              <p>Loading skills…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#fff' }}>No skills found</p>
              <p style={{ fontSize: 14 }}>Try a different search or category.</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 16 }}>
                Showing {filtered.length} skill{filtered.length !== 1 ? 's' : ''}
                {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
                {search ? ` for "${search}"` : ''}
              </p>
              <div className="skill-card-grid">
                {filtered.map(s => (
                  <SkillCard key={s.id} skill={s} onOpen={handleOpen}
                    bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} user={user} onAdminDelete={handleAdminDelete} onNavigate={(uid) => navigate(`/profile/${uid}`)} currentUserId={user?.uid} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <div className="explore-sidebar">
          <LeaderboardSidebar skills={skills} />
        </div>
      </div>

      {/* Detail modal */}
      {selectedSkill && (
        <SkillModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onReviewSubmit={handleReviewSubmit}
          onAdminDelete={handleAdminDelete}
          user={user}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
        />
      )}
    </div>
  )
}