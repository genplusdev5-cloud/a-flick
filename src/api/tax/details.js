import api from '@/utils/axiosInstance'


export const getTaxDetails = async (id) => {
  const { data } = await api.get(`tax-details/?id=${id}`)
  return data
}
