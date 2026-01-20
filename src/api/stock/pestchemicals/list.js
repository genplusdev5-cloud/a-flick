import api from '@/utils/axiosInstance'

export const getPestChemicalsList = async pestId => {
  const res = await api.get(`pestchemicals-list/?pest_id=${pestId}&page_size=100`)
  return res.data
}
