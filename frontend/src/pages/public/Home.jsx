import { ArrowRight, CalendarDays, ChevronRight, Clock3, Flower2, Leaf, MoveUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import SectionHeader from '../../components/common/SectionHeader'

const divisions = [
  { name: 'Allay Spa', note: 'Massage · Facials · Sauna', tone: 'stone', icon: Leaf },
  { name: 'Allay Pilates', note: 'Movement · Strength · Balance', tone: 'beige', icon: Sparkles },
  { name: 'Nail & Lash Studios', note: 'Nails · Brows · Lashes', tone: 'taupe', icon: Flower2 },
  { name: 'Allay Salon', note: 'Hair · Braiding · Headspa', tone: 'cream', icon: MoveUpRight },
]

export default function Home() {
  return <>
    <section className="hero">
      <img src="/images/allay-house-hero.png" alt="Warm, arched Allay House wellness interior" />
      <div className="hero__veil" />
      <div className="hero__content reveal"><span className="eyebrow">Beauty · Wellness · Movement</span><h1>A softer place to<br />return to yourself.</h1><p>Welcome to Allay House—considered treatments, restorative movement, and everyday rituals under one calm roof.</p><div className="hero__actions"><Button to="/book">Book an appointment <ArrowRight size={17} /></Button><Link className="text-link" to="/waitlist">Join our private waitlist <ChevronRight size={16} /></Link></div></div>
      <div className="hero__note"><Flower2 size={18} /><span>Opening soon<br /><strong>in Lagos</strong></span></div>
    </section>

    <section className="manifesto section"><SectionHeader eyebrow="The house of Allay" title={<>Everything you need to feel<br /><em>beautifully restored.</em></>} subtitle="From skin and body rituals to thoughtful movement and finishing touches, every Allay experience is designed to soften the pace of your day." centered /></section>

    <section className="divisions section"><div className="section-heading"><SectionHeader eyebrow="Explore the house" title="Care, in every form." /><Link className="text-link" to="/services">View all services <ArrowRight size={16} /></Link></div><div className="division-grid">{divisions.map(({ name, note, tone, icon: Icon }, index) => <Link to="/services" className={`division-card division-card--${tone}`} key={name}><span>0{index + 1}</span><Icon size={27} strokeWidth={1.2} /><div><h3>{name}</h3><p>{note}</p></div><ArrowRight className="division-card__arrow" size={18} /></Link>)}</div></section>

    <section className="ritual section"><div className="ritual__arch"><img src="/images/allay-house-hero.png" alt="Allay House treatment room detail" /></div><div className="ritual__copy"><SectionHeader eyebrow="Your time, held gently" title="Make a ritual of feeling well." subtitle="We believe care works best when it feels unhurried. Choose a treatment, find a time that suits you, and let us take care of the rest." /><Button to="/about" variant="outline">Discover our philosophy <ArrowRight size={16} /></Button></div></section>

    <section className="visit section"><div><span className="eyebrow eyebrow--light">Plan your visit</span><h2>Your pause is waiting.</h2></div><div className="visit__detail"><Clock3 /><p><strong>Monday–Saturday</strong><br />9:00am–7:00pm</p></div><div className="visit__detail"><CalendarDays /><p><strong>Pre-launch access</strong><br />Join for private opening offers.</p></div><Button to="/waitlist" variant="light">Join the waitlist <ArrowRight size={16} /></Button></section>
  </>
}

