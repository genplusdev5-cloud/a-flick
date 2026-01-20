import api from '@/utils/axiosInstance'

// ✅ List all billing frequencies
export const getBillingFrequencyList = async () => {
  const { data } = await api.get('billingfrequency-list/')
  return data
}
