import api from '@/utils/axiosInstance'

export const getPurchaseFilters = async (params = {}) => {
  const res = await api.get('purchase/', { params })
  return res.data
}
