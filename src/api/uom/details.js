import api from '@/utils/axiosInstance'

export const getUomDetails = async id => {
  try {
    const response = await api.get(`uom-details/?id=${id}`)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'UOM details fetched successfully'
      }
    } else {
      return { success: false, message: response?.data?.message || 'Failed to fetch UOM details' }
    }
  } catch (error) {
    console.error('❌ Get UOM Details Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while fetching UOM details'
    }
  }
}
