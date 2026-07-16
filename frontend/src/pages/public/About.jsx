import Breadcrumbs from '../../components/common/Breadcrumbs'
import PageHero from '../../components/common/PageHero'
import SectionHeader from '../../components/common/SectionHeader'
import Seo from '../../components/common/Seo'
import { imagePaths } from '../../utils/imagePaths'

export default function About() {
  return <>
    <Seo title="About Allay House | Beauty, Wellness & Movement" description="Allay House is a Lagos sanctuary bringing beauty treatments, spa rituals, and restorative movement into one considered experience." path="/about" image={imagePaths.about.hero} />
    <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'About', path: '/about' }]} />
    <PageHero eyebrow="Our philosophy" title="One house. Many ways to feel whole." subtitle="Allay House brings beauty and wellness into one considered experience." variant="editorial" image={imagePaths.about.hero} imageAlt="Allay House interior" imageCategory="The feeling of Allay" /><section className="prose section"><SectionHeader title="Considered care for the whole self." subtitle="Allay began with a simple idea: self-care should not feel rushed, fragmented, or performative. Our house is being shaped as a place where expert treatments and restorative movement meet warm hospitality." centered /></section></>
}
