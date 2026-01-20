import api from '@/utils/axiosInstance'

// ✅ Fetch all customer names for Contract List filters
export const getCustomerNamesForList = async () => {
  try {
    const response = await api.get('customer-name/')

    // handle both possible structures
    if (Array.isArray(response.data)) {
      return response.data
    } else if (response.data?.data) {
      return response.data.data
    } else {
      return []
    }
  } catch (error) {
    console.error('Error fetching customer names for list page:', error)
    return []
  }
}
