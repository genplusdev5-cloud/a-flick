import api from '@/utils/axiosInstance'

// ✅ Update existing company by ID
export const updateCompany = async (id, payload) => {
  try {
    const response = await api.put(`company-update/?id=${id}`, payload)
    return response.data
  } catch (error) {
    console.error(`❌ Error updating company ID ${id}:`, error)
    throw error
  }
}
