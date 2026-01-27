import api from '@/utils/axiosInstance'

export const getProposalDetails = async id => {
  try {
    // 404 Workaround: Use list endpoint to get details
    const res = await api.get('/proposal-list/', {
      params: { id }
    })

    // Handle different response structures (pagination wrapper vs direct array)
    const data = res.data
    const results = data.results || data.data || []

    if (Array.isArray(results) && results.length > 0) {
      return results[0]
    } else if (typeof results === 'object' && results !== null && !Array.isArray(results)) {
      // In case it returns single object (unlikely for list but possible)
      return results
    }

    return null
  } catch (error) {
    console.error('Error fetching proposal details:', error)
    throw error
  }
}
