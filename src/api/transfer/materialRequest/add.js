import api from '@/utils/axiosInstance'
import { objectToFormData } from '@/utils/formUtils'

export const addMaterialRequest = async payload => {
  try {
    const formData = objectToFormData(payload)
    const res = await api.post('tm_material_request-add/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  } catch (error) {
    console.error('Add Material Request API error:', error.response?.data || error.message)
    throw error
  }
}
