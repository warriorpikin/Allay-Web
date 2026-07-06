import { motion } from 'framer-motion'

export default function SectionHeader({ eyebrow, title, subtitle, centered = false, as = 'h2' }) {
  const Heading = as
  return <motion.div className={`section-header ${centered ? 'section-header--centered' : ''}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45 }}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <Heading>{title}</Heading>
    {subtitle && <p>{subtitle}</p>}
  </motion.div>
}

