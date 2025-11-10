import api from '@/utils/axiosInstance'

export const getCustomerList = async () => {
  const res = await api.get(`customer-list/?page_size=200`)
  return res.data
}
