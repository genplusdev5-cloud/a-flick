import api from '@/utils/axiosInstance'

export const getChecklistList = async pestId => {
  const res = await api.get(`checklist-list/?pest_id=${pestId}&page_size=1000`)
  return res.data
}
