import api from '@/utils/axiosInstance'

export const getNonPrescheduleList = async (filters = {}) => {
  // Send filters if needed
  const res = await api.post('non-preschedule/', filters)
  return res.data // { status, message, data: [...] }
}
