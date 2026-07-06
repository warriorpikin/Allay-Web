export default function FormGroup({ label, htmlFor, error, helper, required, children }) {
  return <div className={`form-group ${error ? 'form-group--error' : ''}`}>
    {label && <label htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
    {children}
    {error ? <small className="form-group__error">{error}</small> : helper && <small>{helper}</small>}
  </div>
}

