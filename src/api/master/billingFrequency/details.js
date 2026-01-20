import api from '@/utils/axiosInstance'

// ✅ Get details by ID
export const getBillingFrequencyDetails = async id => {
  const { data } = await api.get(`billingfrequency-details/?id=${id}`)
  return data
}
