import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore'

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

// ── Skill card on profile page ──
function ProfileSkillCard({ skill, user, bookmarks, onToggleBookmark }) {
  const color = categoryColor(skill.category)
  const isBookmarked = bookmarks.includes(skill.id)
  const waLink = `https://wa.me/234${skill.whatsapp?.replace(/^0/, '')}`

  return (
    <div style={{
      background: '#0A0F1E', border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: 20, padding: 24, transition: 'all 0.2s ease',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <span style={{ fontSize: 11, background: `${color}15`, color, padding: '4px 12px', borderRadius: 50, fontWeight: 700 }}>{skill.category}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>👁 {skill.views || 0}</span>
          {user && (
            <button onClick={() => onToggleBookmark(skill.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: isBookmarked ? 1 : 0.25, transition: 'opacity 0.2s', padding: 0 }}>
              🔖
            </button>
          )}
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{skill.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{skill.description}</p>
      </div>

      {/* Details row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skill.experience && (
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '4px 12px', color: 'rgba(255,255,255,0.45)' }}>
            🎓 {skill.experience}
          </span>
        )}
        {skill.tools && (
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '4px 12px', color: 'rgba(255,255,255,0.45)' }}>
            🔧 {skill.tools}
          </span>
        )}
        {skill.city && (
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '4px 12px', color: 'rgba(255,255,255,0.45)' }}>
            📍 {skill.city}
          </span>
        )}
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#FFD700', fontSize: 14 }}>{'★'.repeat(Math.round(skill.rating || 0))}{'☆'.repeat(5 - Math.round(skill.rating || 0))}</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {skill.rating > 0 ? skill.rating.toFixed(1) : 'No rating yet'} · {skill.reviews || 0} review{skill.reviews !== 1 ? 's' : ''}
        </span>
      </div>

      {/* WhatsApp CTA */}
      <a href={waLink} target="_blank" rel="noreferrer"
        style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 50, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', marginTop: 4 }}>
        💬 Connect on WhatsApp
      </a>
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

  const [profile, setProfile]   = useState(null)
  const [skills, setSkills]     = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Load profile + skills
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Load user profile
      const profileSnap = await getDoc(doc(db, 'users', userId))
      if (!profileSnap.exists()) { setNotFound(true); setLoading(false); return }
      setProfile(profileSnap.data())

      // Load their skill listings
      const q = query(collection(db, 'skills'), where('uid', '==', userId))
      const snap = await getDocs(q)
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [userId])

  // Load current user bookmarks
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      setBookmarks(snap.data()?.bookmarks || [])
    })
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
        @media (max-width: 640px) {
          .profile-header-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .profile-socials { justify-content: center !important; }
          .profile-stats { justify-content: center !important; }
          .profile-skills-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 24px', background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🪙</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Skill<span style={{ color: '#00D4FF' }}>Mint</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 18px', borderRadius: 50, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>← Back</button>
          {user ? (
            <Link to="/dashboard" style={{ padding: '9px 20px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          ) : (
            <Link to="/signup" style={{ padding: '9px 20px', borderRadius: 50, background: '#00D4FF', color: '#05080F', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Get Started</Link>
          )}
        </div>
      </nav>

      {/* ── Profile header ── */}
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

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + verified */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{profile.name}</h1>
                {profile.phoneVerified && (
                  <span style={{ fontSize: 12, background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', padding: '4px 12px', borderRadius: 50, fontWeight: 700, flexShrink: 0 }}>✅ Verified</span>
                )}
                {user?.email === ADMIN_EMAIL && (
                  <span style={{ fontSize: 11, background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)', padding: '3px 10px', borderRadius: 50, fontWeight: 700 }}>👑 Admin View</span>
                )}
              </div>

              {/* Location + gender + experience */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14, color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                {profile.state && <span>📍 {profile.state}</span>}
                {profile.gender && <span>· {profile.gender}</span>}
                {profile.experience && <span>· 🎓 {profile.experience}</span>}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.75, marginBottom: 16, maxWidth: 560 }}>{profile.bio}</p>
              )}

              {/* Tools + Previous work */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {profile.tools && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>🔧 Tools:</span> {profile.tools}
                  </p>
                )}
                {profile.previousWork && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>🏢 Previously:</span> {profile.previousWork}
                  </p>
                )}
              </div>

              {/* Social links */}
              {(profile.linkedin || profile.instagram || profile.portfolio) && (
                <div className="profile-socials" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {profile.linkedin  && <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#00D4FF', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)' }}>💼 LinkedIn</a>}
                  {profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#FF6B9D', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(255,107,157,0.2)', background: 'rgba(255,107,157,0.06)' }}>📸 Instagram</a>}
                  {profile.portfolio && <a href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#7B61FF', textDecoration: 'none', padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(123,97,255,0.2)', background: 'rgba(123,97,255,0.06)' }}>🌐 Portfolio</a>}
                </div>
              )}

              {/* Stats row */}
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

      {/* ── Skills listings ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>Skills Offered</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>{skills.length} listing{skills.length !== 1 ? 's' : ''}</p>
          </div>
          {/* WhatsApp CTA if only one skill */}
          {profile.whatsapp && (
            <a href={`https://wa.me/234${profile.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
              style={{ padding: '11px 24px', borderRadius: 50, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
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
              <ProfileSkillCard key={s.id} skill={s} user={user} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}