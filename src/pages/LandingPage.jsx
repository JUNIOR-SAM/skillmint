import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const categories = ['Education', 'Tech', 'Creative', 'Trade', 'Health', 'Business']

const sampleSkills = [
  { name: 'Chioma Adeyemi', skill: 'Math & Physics Tutor', location: 'Surulere, Lagos', category: 'Education', rating: 4.9, reviews: 12, initial: 'C', color: '#00D4FF' },
  { name: 'Emeka Okafor', skill: 'React & Web Developer', location: 'Wuse, Abuja', category: 'Tech', rating: 5.0, reviews: 8, initial: 'E', color: '#7B61FF' },
  { name: 'Fatima Bello', skill: 'Graphic Designer', location: 'Kano', category: 'Creative', rating: 4.8, reviews: 21, initial: 'F', color: '#FF6B6B' },
  { name: 'Tunde Adewale', skill: 'Phone & Laptop Repair', location: 'Ikeja, Lagos', category: 'Trade', rating: 4.7, reviews: 34, initial: 'T', color: '#FFB347' },
  { name: 'Ngozi Eze', skill: 'Makeup Artist', location: 'Enugu', category: 'Creative', rating: 4.9, reviews: 19, initial: 'N', color: '#FF6B9D' },
  { name: 'Dayo Ogunleye', skill: 'English & Essay Coach', location: 'Ibadan', category: 'Education', rating: 5.0, reviews: 6, initial: 'D', color: '#00D4FF' },
]

const steps = [
  { num: '01', icon: '✍️', title: 'Create your free account', desc: 'Sign up with your email in under 60 seconds. No card, no stress.' },
  { num: '02', icon: '📋', title: 'List your skill', desc: 'Tell people what you can do, where you are, and how to reach you on WhatsApp.' },
  { num: '03', icon: '💬', title: 'Get contacted directly', desc: 'People find your listing and reach you straight on WhatsApp. No middleman.' },
]

const features = [
  { icon: '🔍', title: 'Search & Filter', desc: 'Find skills by category, city, or keyword. Exactly what you need, fast.' },
  { icon: '💬', title: 'WhatsApp Connect', desc: 'No inbox delays. One tap opens a chat with the skill provider directly.' },
  { icon: '⭐', title: 'Ratings & Reviews', desc: 'Build your reputation. Every review you earn ranks you higher.' },
  { icon: '🔖', title: 'Bookmarks', desc: 'Save listings you love and come back to them anytime from your dashboard.' },
  { icon: '📢', title: 'Share Listings', desc: 'Share any skill card on WhatsApp or Twitter with one tap.' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Top rated and most viewed skills get featured — more eyes, more clients.' },
]

const testimonials = [
  { quote: 'I got 3 students in my first week of listing my Math tutoring. SkillMint actually works.', name: 'Chioma A.', location: 'Lagos' },
  { quote: 'Found a web designer for my shop in 10 minutes. No stress, no scam. Straight to WhatsApp.', name: 'Emeka T.', location: 'Abuja' },
  { quote: 'SkillMint gave my hustle a face. Now people find ME instead of me chasing them.', name: 'Fatima B.', location: 'Kano' },
]

const providerSteps = [
  'Sign up with your email',
  'Go to Dashboard → "Post a Skill"',
  'Fill in your skill, category, description, WhatsApp number and city',
  'Hit publish — your card goes live on Explore instantly',
  'People find you and reach out directly on WhatsApp',
  'Collect reviews to climb the Leaderboard',
]

const seekerSteps = [
  'No account needed — just visit Explore',
  'Search or filter by what you need',
  'Click a skill card to see full details',
  'Hit "Connect on WhatsApp" to reach them instantly',
  'Create a free account to bookmark listings you love',
]

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(36px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const navLinks = [['#howitworks','How it works'],['#explore','Explore'],['#features','Features'],['#guide','Guide']]

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('provider')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [count, setCount] = useState({ skills: 0, users: 0, cities: 0 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on scroll
  useEffect(() => {
    if (menuOpen && scrolled) setMenuOpen(false)
  }, [scrolled])

  useEffect(() => {
    const targets = { skills: 120, users: 85, cities: 12 }
    const steps = 60
    let step = 0
    const timer = setInterval(() => {
      step++
      const ease = 1 - Math.pow(1 - step / steps, 3)
      setCount({
        skills: Math.round(targets.skills * ease),
        users: Math.round(targets.users * ease),
        cities: Math.round(targets.cities * ease),
      })
      if (step >= steps) clearInterval(timer)
    }, 2000 / steps)
    return () => clearInterval(timer)
  }, [])

  const S = {
    page: { background: '#05080F', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui,-apple-system,sans-serif', overflowX: 'hidden' },
    section: { padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 },
    inner: { maxWidth: 1100, margin: '0 auto' },
    label: { color: '#00D4FF', fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 },
    h2: { fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, textAlign: 'center', marginBottom: 12, letterSpacing: '-1px', margin: '0 0 12px' },
    sub: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 48, maxWidth: 500, margin: '0 auto 48px' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
    card: { background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 28 },
  }

  return (
    <div style={S.page}>

      {/* BACKGROUND ORBS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="orb1" style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', top: -250, left: -150 }} />
        <div className="orb2" style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,97,255,0.07) 0%, transparent 70%)', top: 300, right: -200 }} />
        <div className="orb3" style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)', bottom: 0, left: '35%' }} />
      </div>

      {/* ───────────── NAV ───────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled || menuOpen ? 'rgba(5,8,15,0.96)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || menuOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Top bar */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: scrolled ? '12px 24px' : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'padding 0.3s ease' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🪙</span>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>
              Skill<span style={{ color: '#00D4FF' }}>Mint</span>
            </span>
          </div>

          {/* Desktop links — hidden on mobile */}
          <div className="nav-desktop-links" style={{ display: 'flex', gap: 32, fontSize: 14 }}>
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="nav-link" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)' }}>{label}</a>
            ))}
          </div>

          {/* Desktop CTA — hidden on mobile */}
          <div className="nav-desktop-cta" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/login" className="nav-link" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '8px 16px' }}>Log in</Link>
            <Link to="/signup" className="btn-primary btn-glow" style={{ fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 50, background: '#00D4FF', color: '#05080F', textDecoration: 'none' }}>Get Started</Link>
          </div>

          {/* Hamburger — shown on mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#fff', flexDirection: 'column', gap: 5 }}
          >
            <span style={{ display: 'block', width: 24, height: 2, background: menuOpen ? '#00D4FF' : '#fff', borderRadius: 2, transition: 'all 0.25s ease', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 24, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s ease', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 24, height: 2, background: menuOpen ? '#00D4FF' : '#fff', borderRadius: 2, transition: 'all 0.25s ease', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div className="nav-mobile-menu" style={{
          overflow: 'hidden',
          maxHeight: menuOpen ? 320 : 0,
          transition: 'max-height 0.35s ease',
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}>
          <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                {label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 15, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '12px 0', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 50 }}>Log in</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, padding: '12px 0', borderRadius: 50, background: '#00D4FF', color: '#05080F', textDecoration: 'none' }}>Get Started</Link>
            </div>
          </div>
        </div>

        {/* Responsive styles injected via style tag */}
        <style>{`
          @media (max-width: 768px) {
            .nav-desktop-links { display: none !important; }
            .nav-desktop-cta { display: none !important; }
            .nav-hamburger { display: flex !important; }
          }
          @media (min-width: 769px) {
            .nav-mobile-menu { display: none !important; }
          }
        `}</style>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 160, paddingBottom: 80, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 50, padding: '6px 18px', fontSize: 13, color: '#00D4FF', marginBottom: 32 }}>
              <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D4FF', display: 'inline-block' }} />
              100% Free · Built for Nigerian Youth
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <h1 style={{ fontSize: 'clamp(48px, 9vw, 92px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', margin: '0 0 24px' }}>
              Your Skill Is<br />
              <span className="animate-shimmer">Your Currency</span>
            </h1>
          </FadeIn>

          <FadeIn delay={240}>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.75 }}>
              List what you know. Get discovered by people who need it.
              Connect instantly on WhatsApp. No middleman. Always free.
            </p>
          </FadeIn>

          <FadeIn delay={360}>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <Link to="/signup" className="btn-primary btn-glow" style={{ background: '#00D4FF', color: '#05080F', fontWeight: 800, padding: '12px 30px', borderRadius: 50, fontSize: 17, textDecoration: 'none', display: 'inline-block' }}>
                List Your Skill Free →
              </Link>
              <Link to="/explore" className="btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 35px', borderRadius: 50, fontSize: 17, textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>
                Browse Skills
              </Link>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No card needed · Setup in 2 minutes · Always free</p>
          </FadeIn>

          {/* Floating skill preview cards */}
          <FadeIn delay={480}>
            <div className="hero-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 860, margin: '60px auto 0' }}>
              {sampleSkills.slice(0, 3).map((s, i) => (
                <div key={i} className={`skill-card animate-card${i}`} style={{ background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${s.color}18`, color: s.color, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, border: `1px solid ${s.color}25`, flexShrink: 0 }}>{s.initial}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.skill}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>📍 {s.location}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: '#00D4FF', fontWeight: 700, flexShrink: 0 }}>⭐{s.rating}</div>
                </div>
              ))}
            </div>
            <style>{`
              @media (max-width: 640px) {
                .hero-cards-grid {
                  grid-template-columns: 1fr !important;
                  max-width: 420px !important;
                }
              }
              @media (min-width: 641px) and (max-width: 860px) {
                .hero-cards-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                }
              }
            `}</style>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={560}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 560, margin: '48px auto 0', background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
              {[
                { val: `${count.skills}+`, label: 'Skills Listed' },
                { val: `${count.users}+`, label: 'Active Users' },
                { val: `${count.cities}`, label: 'Cities & States' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '24px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <p style={{ fontSize: 34, fontWeight: 900, color: '#00D4FF', margin: 0, letterSpacing: '-1px' }}>{s.val}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={S.section}>
        <div style={S.inner}>
          <FadeIn><p style={S.label}>The Problem</p></FadeIn>
          <FadeIn delay={80}><h2 style={S.h2}>Millions of skills.<br />Zero visibility.</h2></FadeIn>
          <FadeIn delay={140}><p style={S.sub}>Nigeria is full of talented people — but most are invisible to those who need them most.</p></FadeIn>
          <div style={S.grid3}>
            {[
              { icon: '😔', text: 'You have a skill but nobody knows you exist' },
              { icon: '📋', text: 'Job boards ignore self-taught and informal skills' },
              { icon: '😤', text: 'Finding trusted local help is a stressful nightmare' },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div style={{ background: 'rgba(255,80,80,0.04)', border: '1px solid rgba(255,80,80,0.12)', borderRadius: 20, padding: 28, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</span>
                  <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{p.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={300}><p style={{ textAlign: 'center', marginTop: 40, fontSize: 20, fontWeight: 700, color: '#00D4FF' }}>We built SkillMint to fix that. 🪙</p></FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="howitworks" style={S.section}>
        <div style={S.inner}>
          <FadeIn><p style={S.label}>How It Works</p></FadeIn>
          <FadeIn delay={80}><h2 style={{ ...S.h2, marginBottom: 48 }}>Up and running in 3 steps</h2></FadeIn>
          <div style={S.grid3}>
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="feature-card" style={{ ...S.card, position: 'relative', overflow: 'hidden', height: '100%' }}>
                  <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 52, fontWeight: 900, color: 'rgba(0,212,255,0.05)', lineHeight: 1, pointerEvents: 'none' }}>{s.num}</div>
                  <p style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</p>
                  <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: 14, margin: 0 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE */}
      <section id="explore" style={S.section}>
        <div style={S.inner}>
          <FadeIn><p style={S.label}>Explore Skills</p></FadeIn>
          <FadeIn delay={80}><h2 style={S.h2}>See what people are offering</h2></FadeIn>
          <FadeIn delay={120}><p style={S.sub}>Real skills, real people, ready to connect right now.</p></FadeIn>
          <FadeIn delay={160}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
              {categories.map(c => (
                <span key={c} className="category-pill" style={{ padding: '8px 20px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{c}</span>
              ))}
            </div>
          </FadeIn>
          <div style={S.grid3}>
            {sampleSkills.map((s, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div className="skill-card" style={{ ...S.card, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${s.color}15`, color: s.color, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${s.color}25` }}>{s.initial}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{s.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>📍 {s.location}</p>
                    </div>
                  </div>
                  <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{s.skill}</p>
                  <span style={{ fontSize: 11, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', padding: '3px 12px', borderRadius: 50 }}>{s.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>⭐ {s.rating} · {s.reviews} reviews</span>
                    <button className="connect-btn" style={{ fontSize: 12, background: '#00D4FF', color: '#05080F', fontWeight: 700, padding: '7px 16px', borderRadius: 50, border: 'none', cursor: 'pointer' }}>Connect →</button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={200}>
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <Link to="/explore" className="btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 32px', borderRadius: 50, fontSize: 14, textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>Browse All Skills →</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={S.section}>
        <div style={S.inner}>
          <FadeIn><p style={S.label}>Features</p></FadeIn>
          <FadeIn delay={80}><h2 style={S.h2}>Everything you need.<br />Nothing you don't.</h2></FadeIn>
          <FadeIn delay={120}><p style={{ ...S.sub, marginBottom: 48 }}>Built lean and purposeful — every feature solves a real problem.</p></FadeIn>
          <div style={S.grid3}>
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="feature-card" style={S.card}>
                  <p style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</p>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* GUIDE */}
      <section id="guide" style={S.section}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <FadeIn><p style={S.label}>Platform Guide</p></FadeIn>
          <FadeIn delay={80}><h2 style={S.h2}>New here? Here's your guide.</h2></FadeIn>
          <FadeIn delay={120}><p style={{ ...S.sub, marginBottom: 36 }}>Whether you're offering a skill or looking for one — we've got you.</p></FadeIn>
          <FadeIn delay={160}>
            <div style={{ display: 'flex', gap: 6, background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 50, padding: 5, width: 'fit-content', margin: '0 auto 32px' }}>
              {[['provider', 'I have a skill to offer'], ['seeker', 'I need a skill']].map(([tab, label]) => (
                <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{ padding: '10px 28px', borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: activeTab === tab ? '#00D4FF' : 'transparent', color: activeTab === tab ? '#05080F' : 'rgba(255,255,255,0.45)' }}>{label}</button>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div style={S.card}>
              {(activeTab === 'provider' ? providerSteps : seekerSteps).map((step, i) => (
                <div key={`${activeTab}-${i}`} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: i < 5 ? 22 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', color: '#00D4FF', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, border: '1px solid rgba(0,212,255,0.25)' }}>{i + 1}</div>
                  <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* LEADERBOARD */}
      <section style={S.section}>
        <div style={S.inner}>
          <FadeIn><p style={S.label}>Leaderboard</p></FadeIn>
          <FadeIn delay={80}><h2 style={S.h2}>🏆 Top Skills This Week</h2></FadeIn>
          <FadeIn delay={120}><p style={{ ...S.sub, marginBottom: 48 }}>Most viewed and highest rated — earning more visibility every day.</p></FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto' }}>
            {sampleSkills.slice(0, 3).map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="feature-card" style={{
                  ...S.card,
                  border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.22)' : i === 1 ? 'rgba(192,192,192,0.14)' : 'rgba(205,127,50,0.18)'}`,
                  boxShadow: i === 0 ? '0 0 40px rgba(255,215,0,0.05)' : 'none',
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 22 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${s.color}15`, color: s.color, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14, border: `1px solid ${s.color}25` }}>{s.initial}</div>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.skill}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 12 }}>📍 {s.location}</p>
                  <span style={{ color: '#00D4FF', fontWeight: 700, fontSize: 14 }}>⭐ {s.rating}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 8 }}>· {s.reviews} reviews</span>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={300}>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link to="/explore" className="btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 32px', borderRadius: 50, fontSize: 14, textDecoration: 'none', display: 'inline-block', background: 'transparent' }}>See Full Leaderboard →</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={S.section}>
        <div style={S.inner}>
          <FadeIn><p style={S.label}>Testimonials</p></FadeIn>
          <FadeIn delay={80}><h2 style={{ ...S.h2, marginBottom: 48 }}>What people are saying</h2></FadeIn>
          <div style={S.grid3}>
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="feature-card" style={S.card}>
                  <p style={{ color: '#00D4FF', fontSize: 40, marginBottom: 12, lineHeight: 1 }}>"</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, fontSize: 14, marginBottom: 24 }}>{t.quote}</p>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{t.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '4px 0 0' }}>📍 {t.location}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...S.section, padding: '100px 24px' }}>
        <FadeIn>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, marginBottom: 20, letterSpacing: '-1.5px' }}>Ready to be found?</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 18, marginBottom: 40, lineHeight: 1.75 }}>
              Join skilled Nigerians already on SkillMint.<br />It's free. Always.
            </p>
            <Link to="/signup" className="btn-primary btn-glow" style={{ display: 'inline-block', background: '#00D4FF', color: '#05080F', fontWeight: 900, padding: '10px 30px', borderRadius: 50, fontSize: 18, textDecoration: 'none' }}>
              List Your Skill Now — It's Free 🪙
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 20 }}>No card needed · Cancel anytime · Always free</p>
          </div>
        </FadeIn>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '36px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🪙</span>
            <span style={{ fontWeight: 900 }}>Skill<span style={{ color: '#00D4FF' }}>Mint</span></span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginLeft: 8 }}>— Your skill is your currency</span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
            {[['/', 'Home'], ['/explore', 'Explore'], ['/post', 'Post a Skill'], ['/login', 'Login']].map(([to, label]) => (
              <Link key={to} to={to} className="footer-link" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>

          {/* Credit */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, margin: 0 }}>Built by Samuel · SQI College of ICT · 2026</p>
        </div>

        {/* Mobile footer styles */}
        <style>{`
          @media (max-width: 640px) {
            footer > div {
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
            }
            footer > div > div:first-child {
              justify-content: center !important;
            }
            footer > div > div:nth-child(2) {
              justify-content: center !important;
            }
          }
        `}</style>
      </footer>

    </div>
  )
}