import api from '@/utils/axiosInstance'

export const deleteSalesAgreement = data => {
  return api.patch('/sales_agreement-delete/', data)
}
