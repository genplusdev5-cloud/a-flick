import api from '@/utils/axiosInstance'

// GET by ID
export const getMaterialRequestById = async id => {
  const res = await api.get(`tm_material_request-details/?id=${id}`)
  return res.data
}

// UPDATE by ID
export const updateMaterialRequest = async payload => {
  const res = await api.put(`tm_material_request-update/?id=${payload.id}`, payload)
  return res.data
}
