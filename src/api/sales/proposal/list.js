import api from '@/utils/axiosInstance'

export const getProposalList = async params => {
  const res = await api.get('/proposal-list/', { params })
  return res.data
}
