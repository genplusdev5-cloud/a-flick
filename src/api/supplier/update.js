import api from '@/utils/axiosInstance'

export const updateSupplier = async payload => {
  return api.put(`supplier-update/?id=${payload.id}`, payload)
}
