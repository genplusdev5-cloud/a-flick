import api from '@/utils/axiosInstance'

export const updateUnit = async payload => {
  const res = await api.put(`unit-update/?id=${payload.id}`, payload)
  return res.data
}
