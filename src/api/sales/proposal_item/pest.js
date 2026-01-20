import api from '@/utils/axiosInstance'

export const getPestList = async () => {
  const res = await api.get('proposal_item/')
  return res.data
}
