import api from '@/utils/axiosInstance'

export const getCustomerOrigin = async () => {
  const res = await api.get('customer-origin/')
  return res.data
}
