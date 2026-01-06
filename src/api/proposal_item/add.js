import api from '@/utils/axiosInstance'

export const addProposalItem = async payload => {
  const res = await api.post('/proposal_item-add/', payload)
  return res.data
}
