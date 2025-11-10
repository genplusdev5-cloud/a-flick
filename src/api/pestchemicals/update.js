import api from '@/utils/axiosInstance'

export const updatePestChemical = async payload => {
  const res = await api.put(`pestchemicals-update/?id=${payload.id}`, payload)
  return res.data
}
