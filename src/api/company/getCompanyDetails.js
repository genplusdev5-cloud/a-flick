import api from '@/utils/axiosInstance'

// ✅ Get company details by ID
export const getCompanyDetails = async id => {
  try {
    const response = await api.get(`company-details/?id=${id}`)
    return response.data?.data || null
  } catch (error) {
    console.error(`❌ Error fetching company details for ID ${id}:`, error)
    throw error
  }
}
