import api from '@/utils/axiosInstance'

export const getProposalDetails = async id => {
  const res = await api.get('/proposal-details/', {
    params: { id }
  })
  return res.data
}
