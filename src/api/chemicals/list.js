import api from '@/utils/axiosInstance'

export const getChemicalsList = async () => {
  try {
    const response = await api.get('chemicals-list/')

    if (response?.data?.status === 'success') {
      const data = response.data.data?.results || []
      return { success: true, data, message: response.data.message }
    } else {
      return { success: false, data: [], message: response?.data?.message || 'Failed to fetch chemicals' }
    }
  } catch (error) {
    console.error('❌ Get Chemicals List Error:', error)
    return { success: false, data: [], message: error?.response?.data?.message || 'Something went wrong' }
  }
}
