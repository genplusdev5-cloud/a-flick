import api from '@/utils/axiosInstance'

export const addMaterialRequest = async payload => {
  const res = await api.post('tm_material_request-add/', payload)
  return res.data
}
