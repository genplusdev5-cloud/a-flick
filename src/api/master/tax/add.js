import api from '@/utils/axiosInstance'

export const addTax = async (payload) => {
  const body = {
    name: payload.name,
    percent: payload.percent?.toString() || '', // ✅ convert number to string
    description: payload.description || '',
    status: Number(payload.status ?? 1)
  }

  console.log('📤 ADD TAX PAYLOAD:', body) // debug
  const { data } = await api.post('tax-add/', body)
  console.log('📥 ADD TAX RESPONSE:', data)
  return data
}
