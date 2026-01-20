import api from '@/utils/axiosInstance'

export const getUnitList = async pestId => {
  const res = await api.get(`unit-list/?pest_id=${pestId}&page_size=100`)
  return res.data
}
