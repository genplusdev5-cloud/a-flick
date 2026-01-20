import api from '@/utils/axiosInstance'

export const addSupplier = async payload => {
  return api.post('supplier-add/', payload)
}
