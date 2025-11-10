import api from '@/utils/axiosInstance'

export const addFinding = async payload => {
  const res = await api.post('findings-add/', payload)
  return res.data
}

