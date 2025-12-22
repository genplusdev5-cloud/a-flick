/**
 * Custom sorting function for TanStack Table to handle date strings.
 * Compares dates using timestamps to ensure correct chronological order.
 */
export const dateSortingFn = (rowA, rowB, columnId) => {
  const a = rowA.getValue(columnId)
  const b = rowB.getValue(columnId)

  if (!a && !b) return 0
  if (!a) return -1
  if (!b) return 1

  const dateA = new Date(a).getTime()
  const dateB = new Date(b).getTime()

  // Handle invalid dates
  if (isNaN(dateA) && isNaN(dateB)) return 0
  if (isNaN(dateA)) return -1
  if (isNaN(dateB)) return 1

  return dateA < dateB ? -1 : dateA > dateB ? 1 : 0
}

/**
 * Persists row order to localStorage.
 */
export const saveRowOrder = (key, ids) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`row-order-${key}`, JSON.stringify(ids))
  }
}

/**
 * Loads row order from localStorage.
 */
export const loadRowOrder = key => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(`row-order-${key}`)
    return data ? JSON.parse(data) : null
  }
  return null
}
