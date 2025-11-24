import api from '@/utils/axiosInstance'

export const getContractDetails = async uuid => {
  try {
    const res = await api.get(`contract-list/?uuid=${uuid}`)
    const results = res.data?.data?.results || []
    return Array.isArray(results) && results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('❌ getContractDetails error:', error)
    return null
  }
}
