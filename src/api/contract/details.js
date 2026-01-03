import api from '@/utils/axiosInstance'

export const getContractDetails = async id => {
  try {
    // Now accepts numeric ID (decoded from Base64)
    const url = `contract-details/?uuid=${id}`
    console.log('📡 API Request URL:', url, 'ID Value:', id, 'ID Type:', typeof id)
    
    const res = await api.get(url)

    return res.data?.data || null // backend returns object
  } catch (error) {
    console.error('❌ getContractDetails API Error:', error)
    throw error // Re-throw to allow error handling in component
  }
}
