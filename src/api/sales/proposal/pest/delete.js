import api from '@/utils/axiosInstance'

export const deleteProposalPest = data => {
  return api.patch('/proposal_pest-delete/', data)
}
