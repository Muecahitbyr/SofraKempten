const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export const formatPrice = (value: number) => euro.format(value)

/** "18,00" ohne Währungszeichen – für große, typografische Preisdarstellung */
export const formatAmount = (value: number) =>
  value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
