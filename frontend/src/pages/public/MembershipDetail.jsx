import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Loader from '../../components/common/Loader'
import Seo from '../../components/common/Seo'
import WhatsAppButton from '../../components/common/WhatsAppButton'
import { sharedMemberPerks } from '../../data/membershipPerks'
import { getMembershipBySlug } from '../../services/servicesApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { buildMembershipJsonLd } from '../../utils/structuredData'
import { membershipWhatsAppMessage } from '../../utils/whatsapp'
import NotFound from './NotFound'

export default function MembershipDetail() {
  const { slug } = useParams()
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setLoading(true)
    setMissing(false)
    getMembershipBySlug(slug)
      .then((data) => setMembership(data.membership))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading && !membership) return <Loader label="Opening membership details" />
  if (missing || !membership) return <NotFound />

  return <>
    <Seo
      title={membership.seoTitle || `${membership.name} Membership | Allay House`}
      description={membership.seoDescription || membership.description || membership.tagline}
      path={`/memberships/${membership.slug}`}
      image={membership.imageUrl}
      type="product"
      jsonLd={buildMembershipJsonLd(membership)}
    />
    <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Memberships', path: '/memberships' }, { label: membership.name, path: `/memberships/${membership.slug}` }]} />
    <section className="service-detail section">
      <div className={`service-detail__image ${membership.imageUrl ? 'has-image' : ''}`}>
        {membership.imageUrl ? <img src={membership.imageUrl} alt={`${membership.name} membership at Allay House`} loading="eager" fetchPriority="high" decoding="async" /> : <div className="service-detail__art" aria-hidden="true"><Sparkles size={22} /><span>Membership</span><strong>{membership.name}</strong><i>Allay House</i></div>}
      </div>
      <div className="service-detail__content">
        <Link className="text-link" to="/memberships"><ArrowLeft size={15} /> All memberships</Link>
        <span className="eyebrow">{membership.tagline}</span>
        <h1>{membership.name}</h1>
        <p>{membership.description}</p>
        <div className="service-detail__meta"><strong>{formatCurrency(membership.monthlyPrice)} / month</strong></div>

        <h2 className="membership-detail__subheading">What’s included</h2>
        <ul className="membership-card__benefits membership-card__benefits--full">
          {membership.benefits.map((benefit) => <li key={benefit}><Check size={14} />{benefit}</li>)}
        </ul>

        <h2 className="membership-detail__subheading">Included on every plan</h2>
        <ul className="membership-card__benefits membership-card__benefits--full">
          {sharedMemberPerks.map((perk) => <li key={perk}><Check size={14} />{perk}</li>)}
        </ul>

        {membership.terms && <p className="membership-detail__terms">{membership.terms}</p>}

        <WhatsAppButton message={membershipWhatsAppMessage(membership)}>Join {membership.name} on WhatsApp</WhatsAppButton>
      </div>
    </section>
  </>
}
