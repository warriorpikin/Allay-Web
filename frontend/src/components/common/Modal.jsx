import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  return <AnimatePresence>{open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
    <motion.section className="modal" role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} onMouseDown={(event) => event.stopPropagation()}>
      <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><X /></button></header>
      {children}
    </motion.section>
  </motion.div>}</AnimatePresence>
}

