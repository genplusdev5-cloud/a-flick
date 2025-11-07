import api from '@/utils/axiosInstance'

export const deleteHoliday = async id => {
  try {
    const res = await api.patch(`holidays-delete/?id=${id}`)
    if (res?.data?.status === 'success') {
      return { success: true, message: res.data.message || 'Holiday deleted successfully' }
    }
    return { success: false, message: res?.data?.message || 'Failed to delete holiday' }
  } catch (error) {
    console.error('❌ Delete Holiday Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
