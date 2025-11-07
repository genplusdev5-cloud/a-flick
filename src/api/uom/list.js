import api from '@/utils/axiosInstance'

export const getUomList = async () => {
  try {
    const response = await api.get('uom-list/')

    if (response?.data?.status === 'success') {
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || 'UOM list fetched successfully'
      }
    } else {
      return { success: false, data: [], message: response?.data?.message || 'Failed to fetch list' }
    }
  } catch (error) {
    console.error('❌ Get UOM List Error:', error)
    return {
      success: false,
      data: [],
      message: error?.response?.data?.message || 'Something went wrong while fetching UOM list'
    }
  }
}
