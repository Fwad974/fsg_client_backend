export const extractIds = (items) => {
  if (!items || !Array.isArray(items)) return []
  return items.map(item => item.id)
}
