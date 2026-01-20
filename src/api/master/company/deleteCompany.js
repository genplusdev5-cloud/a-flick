import api from '@/utils/axiosInstance'

// ✅ Delete company by ID
export const deleteCompany = async (id) => {
  try {
    const response = await api.patch(`company-delete/?id=${id}`)
    return response.data
  } catch (error) {
    console.error('❌ Error deleting company:', error)
    throw error
  }
}
