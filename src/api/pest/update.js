import api from '@/utils/axiosInstance'

export const updatePest = async payload => {
  const res = await api.put(`pest-update/?id=${payload.id}`, payload)
  return res.data
}
