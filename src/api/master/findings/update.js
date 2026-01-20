import api from '@/utils/axiosInstance'

export const updateFinding = async payload => {
  const res = await api.put(`findings-update/?id=${payload.id}`, payload)
  return res.data
}
