import api from '@/utils/axiosInstance'

export const getTmMaterialRequestList = async (page = 1) => {
  const res = await api.get(`tm_material_request-list/?page=${page}`)
  return res.data
}
