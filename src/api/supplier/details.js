import api from '@/utils/axiosInstance'

export const getSupplierDetails = async id => {
  return api.get(`supplier-details/?id=${id}`)
}
