import api from '@/utils/axiosInstance'

export const getContractList = async (params = {}) => {
  try {
    // 🔹 Clean up params: Remove empty strings, null, undefined, and NaN
    const cleanParams = Object.keys(params).reduce((acc, key) => {
      const val = params[key]
      if (val !== '' && val !== null && val !== undefined && !Number.isNaN(val)) {
        acc[key] = val
      }
      return acc
    }, {})

    console.log('📡 Fetching contract-list with params:', cleanParams)

    const res = await api.get('contract-list/', { params: cleanParams })
    return res.data
  } catch (error) {
    console.error('❌ Contract list API error:', error)
    if (error.response) {
      console.error('👉 Status:', error.response.status)
      console.error('👉 Data:', JSON.stringify(error.response.data, null, 2))
    }
    return { data: { results: [] }, count: 0 }
  }
}
