import api from '@/utils/axiosInstance'

export const getFindingList = async pestId => {
  const res = await api.get(`findings-list/?pest_id=${pestId}&page_size=100`)
  return res.data
}
