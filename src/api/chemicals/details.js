import api from '@/utils/axiosInstance'

export const getChemicalDetails = async id => {
  try {
    const response = await api.get(`chemicals-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, message: response?.data?.message || 'Failed to get chemical details' }
    }
  } catch (error) {
    console.error('❌ Get Chemical Details Error:', error)
    return { success: false, message: 'Something went wrong while fetching chemical details' }
  }
}
