import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { itemById } from '../data/menu'
import { useTable } from '../hooks/useTable'
import { formatPrice } from '../lib/format'
import { lockScroll } from '../lib/smoothScroll'
import { Close } from './ui/Icons'
import { ease } from './ui/Reveal'

/** Fragt beim Hinzufügen die Pflichtauswahl ab – z. B. Reis oder Pommes, Still oder Spritzig. */
export function ChoiceDialog() {
  const { pendingChoice, add, cancelChoice } = useTable()
  const item = pendingChoice ? itemById.get(pendingChoice) : undefined

  useEffect(() => {
    lockScroll('choice', !!item)
    if (!item) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancelChoice()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, cancelChoice])

  return (
    <AnimatePresence>
      {item?.choice && (
        <>
          <motion.div className="sheet-backdrop sheet-backdrop--top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelChoice} />
          <motion.div
            className="choice"
            role="dialog"
            aria-modal="true"
            aria-label={`${item.choice.label} wählen`}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
          >
            <header className="choice__head">
              <div>
                <span className="choice__label">{item.choice.label} wählen</span>
                <h3>{item.name}</h3>
                <p className="muted">{formatPrice(item.price)}</p>
              </div>
              <button className="icon-btn icon-btn--ghost" onClick={cancelChoice} aria-label="Abbrechen">
                <Close width={18} height={18} />
              </button>
            </header>
            <div className="choice__grid">
              {item.choice.values.map((value, i) => (
                <motion.button
                  key={value}
                  className="choice__option"
                  onClick={() => add(item.id, value)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: 0.08 + i * 0.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {value}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
