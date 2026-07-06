import Button from './Button'
import ImagePlaceholder from './ImagePlaceholder'
import SectionHeader from './SectionHeader'

export default function PageHero({ eyebrow, title, subtitle, primaryCta, secondaryCta, tags = [], variant = 'split', image, imageAlt = '', imageCategory }) {
  return <section className={`page-hero page-hero--${variant}`}>
    <div className="page-hero__content"><SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} centered={variant === 'centered'} as="h1" />{tags.length > 0 && <div className="page-hero__tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}{(primaryCta || secondaryCta) && <div className="page-hero__actions">{primaryCta && <Button to={primaryCta.to}>{primaryCta.label}</Button>}{secondaryCta && <Button to={secondaryCta.to} variant="outline">{secondaryCta.label}</Button>}</div>}</div>
    {variant !== 'centered' && <div className="page-hero__visual"><ImagePlaceholder src={image} alt={imageAlt} category={imageCategory} variant={variant === 'editorial' ? 'editorial' : 'arch'} /></div>}
  </section>
}

