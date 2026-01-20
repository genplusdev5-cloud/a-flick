import api from '@/utils/axiosInstance'

export const getPestCount = async payload => {
  const res = await api.post('pest-count/', payload)
  return res.data
}
