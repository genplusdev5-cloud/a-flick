import api from '@/utils/axiosInstance'

export const getActionList = async pestId => {
  const res = await api.get(`action-list/?pest_id=${pestId}&page_size=100`)
  return res.data
}
