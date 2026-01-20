import api from '@/utils/axiosInstance'

export const deleteProposalItem = async id => {
  const res = await api.patch('/proposal_item-delete/', null, {
    params: { id }
  })
  return res.data
}
