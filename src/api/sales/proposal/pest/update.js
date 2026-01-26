import api from '@/utils/axiosInstance'

export const updateProposalPest = (id, data) => {
  return api.put(`/proposal_pest-update/?id=${id}`, data)
}
