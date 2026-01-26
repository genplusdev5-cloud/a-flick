import api from '@/utils/axiosInstance'

export const addSalesAgreement = data => {
  return api.post('/sales_agreement-add/', data)
}
