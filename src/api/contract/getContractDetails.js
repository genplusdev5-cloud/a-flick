import api from '@/utils/axiosInstance'

export const getContractDetails = async contractId => {
  try {
    const res = await api.get(`contract-details/?id=${contractId}`)

    const contract = res.data?.data || null

    return contract
  } catch (error) {
    console.error('❌ getContractDetails API Error:', error)
    return null
  }
}
