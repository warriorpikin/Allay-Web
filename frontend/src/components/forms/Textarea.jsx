import FormGroup from './FormGroup'

export default function Textarea({ label, error, helper, id, required, rows = 4, ...props }) {
  return <FormGroup label={label} htmlFor={id} error={error} helper={helper} required={required}><textarea id={id} required={required} rows={rows} aria-invalid={Boolean(error)} {...props} /></FormGroup>
}

