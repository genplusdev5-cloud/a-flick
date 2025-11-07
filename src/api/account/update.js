import api from '@/utils/axiosInstance'

export const updateAccount = async payload => {
  // ✅ Backend expects `is_active` to handle Active/Inactive
  const body = {
    id: payload.id,
    name: payload.name,
    item_number: payload.itemNumber,
    description: payload.description || '',
    is_active: payload.status === 'Active' ? 1 : 0, // 🧠 main fix
    status: 1 // always 1 (don’t let status toggle)
  }

  console.log('📤 UPDATE ACCOUNT PAYLOAD:', body)
  const { data } = await api.put(`account-update/?id=${payload.id}`, body)
  console.log('📥 UPDATE ACCOUNT RESPONSE:', data)
  return data
}
