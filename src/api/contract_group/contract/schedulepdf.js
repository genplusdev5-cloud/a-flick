import api from '@/utils/axiosInstance'

export const getSchedulePDF = async contractId => {
  try {
    const res = await api.get(`schedule-pdf/?contract_id=${contractId}`)
    return res.data?.data || null
  } catch (error) {
    console.error('Schedule PDF error:', error)
    return null
  }
}
