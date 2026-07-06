export default function Checkbox({ label, id, error, ...props }) {
  return <div className={`checkbox ${error ? 'form-group--error' : ''}`}><input id={id} type="checkbox" {...props} /><label htmlFor={id}>{label}</label>{error && <small className="form-group__error">{error}</small>}</div>
}

