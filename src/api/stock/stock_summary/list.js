import api from '@/utils/axiosInstance'

export const getStockSummary = params => {
  return api.get('stock_summary/', { params })
}
