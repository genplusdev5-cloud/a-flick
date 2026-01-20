import api from '@/utils/axiosInstance'

export const deleteDepartment = async id => {
  try {
    const response = await api.patch(`department-delete/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Department deleted successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to delete department' }
    }
  } catch (error) {
    console.error('❌ Delete Department Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
