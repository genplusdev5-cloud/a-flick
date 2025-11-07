import api from '@/utils/axiosInstance'

export const updateHoliday = async payload => {
  try {
    if (!payload.id) {
      throw new Error('Missing holiday ID for update')
    }

    const response = await api.put(`holidays-update/?id=${payload.id}`, payload)

    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Holiday updated successfully' }
    } else {
      return { success: false, message: response?.data?.message || 'Failed to update holiday' }
    }
  } catch (error) {
    console.error('❌ Update Holiday Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
