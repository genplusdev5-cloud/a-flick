import api from '@/utils/axiosInstance'

export const addPest = async payload => {
  const res = await api.post('pest-add/', payload)
  return res.data
}
