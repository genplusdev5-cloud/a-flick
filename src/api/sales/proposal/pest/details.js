import api from '@/utils/axiosInstance'

export const salesAgreementDetails = id => {
  return api.get('/sales_agreement-details/', {
    params: { id }
  })
}
