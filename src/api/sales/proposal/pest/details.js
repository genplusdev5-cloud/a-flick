import api from '@/utils/axiosInstance'

export const proposalPestDetails = id => {
  return api.get('/proposal_pest-details/', {
    params: { id }
  })
}
