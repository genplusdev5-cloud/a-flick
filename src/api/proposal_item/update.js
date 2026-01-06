import api from '@/utils/axiosInstance'

export const updateProposalItem = async (id, payload) => {
  const res = await api.put('/proposal_item-update/', payload, {
    params: { id }
  })
  return res.data
}
