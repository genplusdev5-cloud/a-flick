import api from '@/utils/axiosInstance'

export const addMaterialRequest = async payload => {
  try {
    const res = await api.post('tm_material_request-add/', payload)
    return res.data
  } catch (error) {
    console.error('Add Material Request API error:', error.response?.data || error.message)
    throw error
  }
}
