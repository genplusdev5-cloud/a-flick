import api from '@/utils/axiosInstance'

export const getContractList = async (filters = {}) => {
  try {
    const params = new URLSearchParams()

    // 🔹 1) UUID filter
    if (filters.uuid) params.append('uuid', filters.uuid)

    // 🔹 2) Other filters – IMPORTANT: key names must match Postman
    if (filters.customer_id) params.append('customer_id', filters.customer_id)
    if (filters.contract_type) params.append('contract_type', filters.contract_type)
    if (filters.contract_status) params.append('contract_status', filters.contract_status)

    const query = params.toString()
    const url = query ? `contract-list/?${query}` : 'contract-list/'

    console.log('📡 Fetching:', url)

    const res = await api.get(url)
    return res.data
  } catch (error) {
    console.error('❌ Contract list API error:', error)
    return { data: { results: [] }, count: 0 }
  }
}
