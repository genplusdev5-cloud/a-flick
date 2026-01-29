import api from '@/utils/axiosInstance'

export const updateMaterialReceive = async (id, payload) => {
  try {
    const res = await api.put(`tm_material_receive-update/?id=${id}`, payload)
    return res.data
  } catch (error) {
    console.error('Update material receive error:', error?.response?.data || error.message)
    throw error
  }
}
