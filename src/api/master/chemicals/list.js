import api from '@/utils/axiosInstance'

export const getChemicalsList = async (params = {}) => {
  try {
    const response = await api.get('chemicals-list/', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 25,
        search: params.search || ''
      }
    })

    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data, message: response.data.message }
    } else {
      return {
        success: false,
        data: { results: [], count: 0 },
        message: response?.data?.message || 'Failed to fetch chemicals'
      }
    }
  } catch (error) {
    console.error('❌ Get Chemicals List Error:', error)
    return {
      success: false,
      data: { results: [], count: 0 },
      message: error?.response?.data?.message || 'Something went wrong'
    }
  }
}
