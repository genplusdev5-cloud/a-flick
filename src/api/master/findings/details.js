import api from '@/utils/axiosInstance'
export const getFindingDetails = async id => {
  const res = await api.get(`findings-details/?id=${id}`)
  return res.data
}
