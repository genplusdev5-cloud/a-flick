import api from '@/utils/axiosInstance'

export const getTaxList = async () => {
  try {
    const res = await api.get('tax-list/')
    console.log('🧾 TAX LIST RESPONSE:', res.data)
    return res.data
  } catch (error) {
    console.error('❌ TAX LIST ERROR:', error.response?.data || error.message)
    throw error
  }
}
