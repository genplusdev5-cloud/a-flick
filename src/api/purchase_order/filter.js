import api from '@/utils/axiosInstance'

export const getPurchaseFilters = async () => {
  const res = await api.get('purchase/')
  return res.data
}
