import api from '@/utils/axiosInstance'

export const listSalesAgreement = params => {
  return api.get('/sales_agreement-list/', { params })
}
