import api from '@/utils/axiosInstance'

// ✅ PATCH instead of DELETE (your backend requirement)
export const deleteEmployee = async id => {
  try {
    const response = await api.patch(`employee-delete/?id=${id}`)
    return response.data
  } catch (error) {
    console.error('❌ Employee Delete API Error:', error.response?.data || error.message)
    throw error
  }
}
