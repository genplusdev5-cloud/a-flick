import api from '@/utils/axiosInstance'

export const addAction = async payload => {
  const res = await api.post('action-add/', payload)
  return res.data
}
