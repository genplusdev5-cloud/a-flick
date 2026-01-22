import api from '@/utils/axiosInstance'
import { objectToFormData } from '@/utils/formUtils'

export const addMaterialReceive = async data => {
  try {
    const formData = objectToFormData(data)
    const res = await api.post('tm_material_receive-add/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  } catch (error) {
    console.error('Add material receive error:', error?.response?.data || error.message)
    throw error
  }
}
