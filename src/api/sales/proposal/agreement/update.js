import api from '@/utils/axiosInstance'

export const updateSalesAgreement = (id, data) => {
  return api.put(`/sales_agreement-update/?id=${id}`, data)
}
