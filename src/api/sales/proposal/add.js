import api from '@/utils/axiosInstance'

export const addProposal = async payload => {
  const res = await api.post('/proposal-add/', payload)
  return res.data
}
