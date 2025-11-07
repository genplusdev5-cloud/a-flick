import api from '@/utils/axiosInstance'

export const getDesignationList = async () => {
  try {
    const response = await api.get('designation-list/')
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data?.results || [] }
    }
    return { success: false, message: response.data?.message || 'Failed to fetch designations' }
  } catch (error) {
    console.error('❌ Get Designation List Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
