import api from '@/utils/axiosInstance'

export const getTransferFilters = async () => {
  const res = await api.get('purchase/') // Or whatever endpoint provides company/supplier
  return res.data
}
