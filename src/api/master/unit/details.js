import api from '@/utils/axiosInstance'
export const getActionDetails = async id => {
  const res = await api.get(`unit-details/?id=${id}`)
  return res.data
}
