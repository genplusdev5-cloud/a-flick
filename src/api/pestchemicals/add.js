import api from '@/utils/axiosInstance'

export const addPestChemical = async payload => {
  const res = await api.post('pestchemicals-add/', payload)
  return res.data
}
