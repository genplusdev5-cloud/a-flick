import api from '@/utils/axiosInstance'

export const listSalesAgreement = () => {
  return api.get('/sales_agreement-list/')
}

