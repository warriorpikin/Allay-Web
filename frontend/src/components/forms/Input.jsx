import FormGroup from './FormGroup'

export default function Input({ label, error, helper, id, required, ...props }) {
  return <FormGroup label={label} htmlFor={id} error={error} helper={helper} required={required}><input id={id} required={required} aria-invalid={Boolean(error)} {...props} /></FormGroup>
}

