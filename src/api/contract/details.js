import api from '@/utils/axiosInstance'

export const getContractDetails = async uuid => {
  try {
    const res = await api.get(`contract-details/?uuid=${uuid}`)

    return res.data?.data || null // backend returns object
  } catch (error) {
    console.error('❌ getContractDetails API Error:', error)
    return null
  }
}
