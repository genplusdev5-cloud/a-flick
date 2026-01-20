import api from '@/utils/axiosInstance'

export const addProposalPest = data => {
  return api.post('/proposal_pest-add/', data)
}
