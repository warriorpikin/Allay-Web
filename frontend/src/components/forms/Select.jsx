import FormGroup from './FormGroup'

export default function Select({ label, error, helper, id, required, options = [], placeholder = 'Select an option', ...props }) {
  return <FormGroup label={label} htmlFor={id} error={error} helper={helper} required={required}><select id={id} required={required} aria-invalid={Boolean(error)} {...props}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormGroup>
}

