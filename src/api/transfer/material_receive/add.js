import api from '@/utils/axiosInstance'

export const addMaterialReceive = async payload => {
  try {
    const res = await api.post('tm_material_receive-add/', payload)
    return res.data
  } catch (error) {
    console.error('Add material receive error:', error?.response?.data || error.message)
    throw error
  }
}
