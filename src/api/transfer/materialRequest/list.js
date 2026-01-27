import api from '@/utils/axiosInstance'

export const getTmMaterialRequestList = async (params = {}) => {
  const res = await api.get('tm_material_request-list/', { params })
  return res.data
}
