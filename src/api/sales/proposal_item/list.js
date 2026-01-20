import api from '@/utils/axiosInstance'

export const getProposalItemList = async params => {
  const res = await api.get('/proposal_item-list/', { params })
  return res.data
}
