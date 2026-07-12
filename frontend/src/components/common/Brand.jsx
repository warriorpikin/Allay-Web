import BrandLogo from './BrandLogo'

export default function Brand({ light = false }) {
  return <BrandLogo variant={light ? 'white' : 'brown'} className="brand" />
}
