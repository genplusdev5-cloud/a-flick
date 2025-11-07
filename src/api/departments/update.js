import api from '@/utils/axiosInstance'

export const updateDepartment = async payload => {
  try {
    if (!payload.id) throw new Error('Missing Department ID')
    const response = await api.put(`department-update/?id=${payload.id}`, payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Department updated successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to update department' }
    }
  } catch (error) {
    console.error('❌ Update Department Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
