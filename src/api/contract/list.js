import api from '@/utils/axiosInstance'

export const getContractList = async (filters = {}) => {
  try {
    const params = new URLSearchParams()

    if (filters.customer_id) params.append('customer_id', filters.customer_id)
    if (filters.contract_type) params.append('contract_type', filters.contract_type)
    if (filters.contract_status) params.append('contract_status', filters.contract_status) // ✅ fixed key

    const query = params.toString()
    const url = query ? `contract-list/?${query}` : 'contract-list/'

    console.log('📡 Fetching contract list from:', url)

    const res = await api.get(url)

    console.log('🔥 Contract API Response →', res.data)

    const results = res.data?.data?.results
    return Array.isArray(results) ? results : []
  } catch (error) {
    console.error('❌ Contract list API error:', error)
    return []
  }
}
