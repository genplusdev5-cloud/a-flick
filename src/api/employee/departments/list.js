import api from '@/utils/axiosInstance'

export const getDepartmentList = async () => {
  try {
    const response = await api.get('department-list/')
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data?.results || [] }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch departments' }
    }
  } catch (error) {
    console.error('❌ Get Department List Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
