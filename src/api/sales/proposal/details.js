import api from '@/utils/axiosInstance'

export const getProposalDetails = async id => {
  try {
    console.log('📡 Fetching Proposal Details for ID:', id)

    // Helper to extract result from various response formats
    const extractData = res => {
      const body = res?.data || res
      if (!body) return null

      // Case 1: Direct object (good for single details)
      if (typeof body === 'object' && !Array.isArray(body) && body.id && !body.results && !body.data) return body

      // Case 2: Standard project wrapper variants
      const results = body?.data?.results || body?.results || (Array.isArray(body?.data) ? body.data : null) || []
      if (Array.isArray(results) && results.length > 0) return results[0]

      // Case 3: Raw array
      if (Array.isArray(body) && body.length > 0) return body[0]

      return null
    }

    // Attempt 1: Standard detail endpoint (Matches other master records)
    try {
      console.log('🔍 Attempt 1: Standard pattern /proposal-details/')
      const res1 = await api.get(`/proposal-details/`, { params: { id } })
      const data1 = extractData(res1)
      if (data1) {
        console.log('✅ Found via Standard Pattern')
        return data1
      }
    } catch (e) {
      console.warn('⚠️ Standard pattern failed or not implemented')
    }

    // Attempt 2: List endpoint with 'id'
    console.log('🔍 Attempt 2: List pattern with id param')
    const res2 = await api.get('/proposal-list/', { params: { id } })
    const data2 = extractData(res2)
    if (data2) {
      console.log('✅ Found via List (id param)')
      return data2
    }

    // Attempt 3: List endpoint with 'proposal_id'
    console.log('🔍 Attempt 3: List pattern with proposal_id param')
    const res3 = await api.get('/proposal-list/', { params: { proposal_id: id } })
    const data3 = extractData(res3)
    if (data3) {
      console.log('✅ Found via List (proposal_id param)')
      return data3
    }

    // Attempt 4: List endpoint with 'search'
    console.log('🔍 Attempt 4: List pattern with search param')
    const res4 = await api.get('/proposal-list/', { params: { search: id } })
    const data4 = extractData(res4)
    if (data4) {
      console.log('✅ Found via List (search param)')
      return data4
    }

    console.error('❌ Proposal not found after all 4 attempts')
    return null
  } catch (error) {
    console.error('❌ getProposalDetails ERROR:', error)
    throw error
  }
}
