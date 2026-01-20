import api from '@/utils/axiosInstance'

export const updateAction = async payload => {
  const res = await api.put(`action-update/?id=${payload.id}`, payload)
  return res.data
}
