import PageHero from '../../components/common/PageHero'
import SectionHeader from '../../components/common/SectionHeader'
import { imagePaths } from '../../utils/imagePaths'

export default function About() {
  return <><PageHero eyebrow="Our philosophy" title="One house. Many ways to feel whole." subtitle="Allay House brings beauty and wellness into one considered experience." variant="editorial" image={imagePaths.about.hero} imageAlt="Allay House interior" imageCategory="The feeling of Allay" /><section className="prose section"><SectionHeader title="Considered care for the whole self." subtitle="Allay began with a simple idea: self-care should not feel rushed, fragmented, or performative. Our house is being shaped as a place where expert treatments and restorative movement meet warm hospitality." centered /></section></>
}
