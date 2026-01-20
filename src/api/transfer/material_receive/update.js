import api from '@/utils/axiosInstance'

export const updateMaterialReceive = (id, data) => {
  return api.put(`tm_material_receive-update/?id=${id}`, data)
}
