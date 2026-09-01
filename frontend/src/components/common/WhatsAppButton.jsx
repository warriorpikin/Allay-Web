import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { clientWhatsAppHandoff, prepareWhatsAppHandoff } from '../../utils/whatsapp'
import Button from './Button'

export default function WhatsAppButton({ message, children = 'Continue on WhatsApp', ...props }) {
  const [opening, setOpening] = useState(false)

  const openWhatsApp = async () => {
    setOpening(true)
    try {
      const handoff = clientWhatsAppHandoff(message)
      const result = await prepareWhatsAppHandoff(handoff)
      if (result.copied) toast.success('Membership message copied. Paste it into the Allay House chat if needed.')
      window.location.assign(handoff.url)
    } catch (error) {
      toast.error(error.message || 'Could not open WhatsApp. Please try again.')
      setOpening(false)
    }
  }

  return <Button type="button" loading={opening} onClick={openWhatsApp} {...props}><MessageCircle size={16} /> {children}</Button>
}
