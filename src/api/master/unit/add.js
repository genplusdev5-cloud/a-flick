import api from '@/utils/axiosInstance'

export const addUnit = async payload => {
  const res = await api.post('unit-add/', payload)
  return res.data
}
