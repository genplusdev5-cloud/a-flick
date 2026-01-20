import api from '@/utils/axiosInstance'

export const updateTax = async (payload) => {
  const body = {
    id: payload.id,
    name: payload.name,
    percent: payload.percent?.toString() || '0',
    description: payload.description || '',
    is_active: payload.status === 1 ? 1 : 0, // ✅ only this toggles
    status: 1 // ✅ always keep 1 (don’t send 0)
  }

  console.log('📤 UPDATE TAX PAYLOAD:', body)
  const { data } = await api.put(`tax-update/?id=${payload.id}`, body)
  console.log('📥 UPDATE TAX RESPONSE:', data)
  return data
}
