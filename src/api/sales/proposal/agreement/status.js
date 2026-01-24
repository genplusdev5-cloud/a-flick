import api from '@/utils/axiosInstance'

export const updateSalesAgreementStatus = (id, data) => {
  return api.put(`sales_agreement-status/?id=${id}`, data)
}
