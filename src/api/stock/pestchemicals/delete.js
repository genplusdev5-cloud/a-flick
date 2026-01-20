import api from '@/utils/axiosInstance'

export const deletePestChemical = async id => {
  const res = await api.patch(`pestchemicals-delete/?id=${id}`)
  return res.data
}
