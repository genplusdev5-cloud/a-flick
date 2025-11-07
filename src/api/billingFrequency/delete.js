import api from '@/utils/axiosInstance'

// ✅ Delete Billing Frequency
export const deleteBillingFrequency = async id => {
  const { data } = await api.patch(`billingfrequency-delete/?id=${id}`)
  return data
}
