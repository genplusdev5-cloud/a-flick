import api from '@/utils/axiosInstance'

// ✅ Get all companies
export const getCompanyList = async () => {
  try {
    const response = await api.get('company-list/')
    return response.data?.data?.results || []
  } catch (error) {
    console.error('❌ Error fetching company list:', error)
    throw error
  }
}

