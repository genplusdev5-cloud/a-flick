import api from '@/utils/axiosInstance'

export const getTmMaterialRequestList = async (params = {}) => {
  try {
    const cleanParams = Object.keys(params).reduce((acc, key) => {
      const val = params[key]
      if (val !== '' && val !== null && val !== undefined && !Number.isNaN(val)) {
        acc[key] = val
      }
      return acc
    }, {})

    const res = await api.get('tm_material_request-list/', { params: cleanParams })
    return res.data
  } catch (error) {
    console.error('Material request list API error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    })
    throw error
  }
}
