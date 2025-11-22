import api from '@/utils/axiosInstance'

export const getTmMaterialRequestList = async () => {
  const res = await api.get('tm_material_request-list/')
  return res.data
}
