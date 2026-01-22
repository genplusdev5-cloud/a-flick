import api from '@/utils/axiosInstance'

export const getMaterialReceiveList = async (params = {}) => {
  try {
    const cleanParams = Object.keys(params).reduce((acc, key) => {
      const val = params[key]
      if (val !== '' && val !== null && val !== undefined && !Number.isNaN(val)) {
        acc[key] = val
      }
      return acc
    }, {})

    const res = await api.get('tm_material_receive-list/', { params: cleanParams })
    return res.data
  } catch (error) {
    console.error('Material receive list API error:', error)
    return { data: { results: [] }, count: 0 }
  }
}
