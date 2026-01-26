import api from '@/utils/axiosInstance'

export const deleteProposalPest = data => {
  const id = typeof data === 'object' ? data.id : data
  return api.patch('/proposal_pest-delete/', {}, { params: { id } })
}
