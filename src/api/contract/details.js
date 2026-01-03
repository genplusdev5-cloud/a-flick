import api from '@/utils/axiosInstance'

export const getContractDetails = async id => {
  try {
    // Check if the id is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    const params = isUuid ? { uuid: id } : { id: id }

    console.log('📡 Fetching Contract Details:', { id, isUuid, params })
    
    const res = await api.get('contract-details/', { params })

    return res.data?.data || null
  } catch (error) {
    console.error('❌ getContractDetails FAILED')
    console.error('👉 URL:', error.config?.url)
    console.error('👉 Status:', error.response?.status)
    console.error('👉 Data:', JSON.stringify(error.response?.data, null, 2))
    
    throw error
  }
}
