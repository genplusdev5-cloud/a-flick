import api from '@/utils/axiosInstance'

// ✅ Add new company
export const addCompany = async data => {
  try {
    const response = await api.post('company-add/', data)
    return response.data
  } catch (error) {
    console.error('❌ Error adding company:', error)
    throw error
  }
}
