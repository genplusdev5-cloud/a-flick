import api from '@/utils/axiosInstance'

export const getContractDetails = async id => {
  try {
    // Check if the id is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Use 'uuid' param for UUIDs (matches Postman), 'id' for integers
    const params = isUuid ? { uuid: id } : { id: id }

    console.log('📡 Fetching Contract Details via List (Attempt 1):', { id, isUuid, params })
    
    // Switch to contract-list/ as contract-details/ is returning 404
    let res = await api.get('contract-list/', { params })
    
    // Handle response structure: data.data.results or data.results
    let data = res.data
    let results = data?.data?.results || data?.results || []

    if (results.length > 0) {
      return results[0]
    }

    // FALLBACK: Try 'search' param if strict uuid/id param returned nothing
    console.log('⚠️ Attempt 1 Empty. Retrying with SEARCH param...')
    const searchParams = { search: id }
    res = await api.get('contract-list/', { params: searchParams })
    
    data = res.data
    results = data?.data?.results || data?.results || []
    
    if (results.length > 0) {
         console.log('✅ Found via SEARCH param')
         return results[0]
    }
    
    console.error('❌ Contract not found in LIST either')
    return null
  } catch (error) {
    console.error('❌ getContractDetails FAILED:', error.message)
    console.error('👉 URL:', error.config?.url)
    console.error('👉 Params:', error.config?.params)
    console.error('👉 Status:', error.response?.status)
    console.error('👉 Data:', error.response?.data)
    
    throw error // Re-throw so the caller can handle it
  }
}
