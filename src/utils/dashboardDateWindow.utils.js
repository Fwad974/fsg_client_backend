const resolveWindow = ({ from, to }) => {
  if (from && to) {
    return {
      from: new Date(from),
      to:   new Date(`${to}T23:59:59.999Z`)
    }
  }
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),     1,  0,  0,  0,   0))
  const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  return { from: start, to: end }
}

const isoDate = (d) => d.toISOString().slice(0, 10)

export { resolveWindow, isoDate }
