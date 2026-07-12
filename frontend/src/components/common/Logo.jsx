import BrandLogo from './BrandLogo'

export default function Logo({ dark = false, to = '/', className = '' }) {
  return <BrandLogo variant={dark ? 'white' : 'brown'} to={to} className={`logo ${className}`.trim()} />
}
