import api from '@/utils/axiosInstance'

export const getPestDetails = async id => {
  const res = await api.get(`pest-details/?id=${id}`)
  return res.data
}
