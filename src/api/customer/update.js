import api from '@/utils/axiosInstance'

export const updateCustomer = async payload => {
  const res = await api.put(`customer-update/?id=${payload.id}`, payload)
  return res.data
}
