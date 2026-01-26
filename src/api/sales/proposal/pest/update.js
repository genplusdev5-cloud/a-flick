import api from '@/utils/axiosInstance'

export const updateProposalPest = (id, data) => {
  return api.patch(`/proposal_pest-update/${id}/`, data)
}
