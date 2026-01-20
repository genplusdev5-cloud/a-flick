import api from '@/utils/axiosInstance'

export const updateMaterialRequest = async payload => {
  const res = await api.put(`tm_material_request-update/?id=${payload.id}`, payload)
  return res.data
}
