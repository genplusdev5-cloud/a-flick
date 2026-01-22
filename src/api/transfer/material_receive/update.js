import api from '@/utils/axiosInstance'
import { objectToFormData } from '@/utils/formUtils'

export const updateMaterialReceive = async (id, data) => {
  try {
    const formData = objectToFormData(data)
    const res = await api.put(`tm_material_receive-update/?id=${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  } catch (error) {
    console.error('Update material receive error:', error?.response?.data || error.message)
    throw error
  }
}
