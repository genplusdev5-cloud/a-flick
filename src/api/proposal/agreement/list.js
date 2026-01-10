import api from '@/utils/axiosInstance'

export const listProposalPest = proposalId => {
  return api.get('/proposal_pest-list/', {
    params: { proposal_id: proposalId }
  })
}
