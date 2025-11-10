import api from '@/utils/axiosInstance'

export const addCustomer = async payload => {
  const res = await api.post(`customer-add/`, payload)
  return res.data
}
