import api from '@/utils/axiosInstance'

export const getProposalItemDetails = async id => {
  const res = await api.get('/proposal_item-details/', {
    params: { id }
  })
  return res.data
}
