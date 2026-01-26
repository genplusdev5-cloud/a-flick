import api from '@/utils/axiosInstance'

export const deleteSalesAgreement = data => {
  const id = typeof data === 'object' ? data.id : data
  return api.patch('/sales_agreement-delete/', {}, { params: { id } })
}
