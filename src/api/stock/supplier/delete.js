import api from '@/utils/axiosInstance'

export const deleteSupplier = async id => {
  return api.patch(`supplier-delete/?id=${id}`)
}
