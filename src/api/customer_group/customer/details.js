import api from '@/utils/axiosInstance'

export const getCustomerDetails = async id => {
  const res = await api.get(`customer-details/?id=${id}`)
  return res.data
}
