import api from '@/utils/axiosInstance'

export const deleteCustomer = async id => {
  const res = await api.patch(`customer-delete/?id=${id}`)
  return res.data
}

export const deleteCustomerContact = async id => {
  const res = await api.patch(`customer-contact-delete/?id=${id}`)
  return res.data
}
