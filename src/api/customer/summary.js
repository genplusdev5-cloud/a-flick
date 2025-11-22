import api from '@/utils/axiosInstance'

export const getCustomerSummary = async () => {
  try {
    const res = await api.get('customer-summary/')

    return {
      status: 'success',
      data: res?.data?.data || {}
    }
  } catch (err) {
    console.error('❌ Customer Summary API Error')
    return {
      status: 'failed',
      data: {
        total_customers: 0,
        total_myob: 0,
        total_active: 0,
        total_inactive: 0
      }
    }
  }
}
