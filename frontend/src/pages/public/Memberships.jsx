import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../../components/common/Badge'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import Loader from '../../components/common/Loader'
import SectionHeader from '../../components/common/SectionHeader'
import Seo from '../../components/common/Seo'
import { sharedMemberPerks } from '../../data/membershipPerks'
import { getMemberships } from '../../services/servicesApi'
import { formatCurrency } from '../../utils/formatCurrency'

export default function Memberships() {
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getMemberships()
      .then((data) => setMemberships(data.memberships || []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  return <>
    <Seo
      title="Beauty and Wellness Memberships | Allay House"
      description="Join an Allay House membership for a monthly rhythm of head spa, massage, hammam, Pilates, and beauty rituals — with priority booking and member pricing."
      path="/memberships"
    />
    <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Memberships', path: '/memberships' }]} />
    <header className="page-intro">
      <SectionHeader eyebrow="Membership" title="Wellness, on a rhythm." subtitle="Three monthly memberships built for however often you want Allay House in your life." as="h1" />
    </header>

    <section className="section compact">
      {loading ? <Loader label="Loading memberships" /> : failed || !memberships.length ? (
        <EmptyState title="Memberships are being updated" message="Please check back shortly, or contact us to ask about membership plans." action={<Button to="/contact">Contact us</Button>} />
      ) : <div className="membership-grid">
        {memberships.map((membership) => <article key={membership.id} className="membership-card">
          <div className="membership-card__image"><ImagePlaceholder src={membership.imageUrl} alt={`${membership.name} membership at Allay House`} variant="card" width="640" height="420" /></div>
          <div className="membership-card__body">
            {membership.isFeatured && <Badge status="paid">Most popular</Badge>}
            <h3>{membership.name}</h3>
            <p className="membership-card__tagline">{membership.tagline}</p>
            <strong className="membership-card__price">{formatCurrency(membership.monthlyPrice)}<span> / month</span></strong>
            <ul className="membership-card__benefits">
              {membership.benefits.slice(0, 5).map((benefit) => <li key={benefit}><Check size={14} />{benefit}</li>)}
            </ul>
            {membership.benefits.length > 5 && <p className="membership-card__more">+{membership.benefits.length - 5} more benefits</p>}
            <div className="membership-card__actions">
              <Button to={`/memberships/${membership.slug}`} variant="outline">View details</Button>
              <Button to={`/contact?membership=${encodeURIComponent(membership.name)}`}>Enquire to join</Button>
            </div>
          </div>
        </article>)}
      </div>}
    </section>

    <section className="section compact membership-perks">
      <SectionHeader eyebrow="Every plan includes" title="Member perks, always on." />
      <ul className="membership-perks__list">
        {sharedMemberPerks.map((perk) => <li key={perk}><Check size={14} />{perk}</li>)}
      </ul>
    </section>
  </>
}
