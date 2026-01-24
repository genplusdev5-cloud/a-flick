import api from '@/utils/axiosInstance'

// ✅ Get all companies
export const getCompanyList = async () => {
  try {
    const response = await api.get('company-list/')
    return response.data?.data?.results || response.data?.data || response.data || []
  } catch (error) {
    console.error('❌ Error fetching company list:', error)
    return []
  }
}
