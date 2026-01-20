import api from '@/utils/axiosInstance'

export const deleteIndustry = async id => {
  try {
    const res = await api.patch(`industry-delete/?id=${id}`)

    if (res?.data?.status === 'success') {
      return { success: true, message: res.data.message || 'Industry deleted successfully' }
    }
    return { success: false, message: res?.data?.message || 'Failed to delete industry' }
  } catch (error) {
    console.error('❌ Delete Industry Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while deleting industry'
    }
  }
}
