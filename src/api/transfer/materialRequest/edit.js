import api from '@/utils/axiosInstance'
import { objectToFormData } from '@/utils/formUtils'

// GET by ID
export const getMaterialRequestById = async id => {
  const res = await api.get(`tm_material_request-details/?id=${id}`)
  return res.data
}

// UPDATE by ID
export const updateMaterialRequest = async payload => {
  try {
    const formData = objectToFormData(payload)
    const res = await api.put(`tm_material_request-update/?id=${payload.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  } catch (error) {
    console.error('Update Material Request API error:', error.response?.data || error.message)
    throw error
  }
}
