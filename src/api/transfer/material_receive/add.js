import api from '@/utils/axiosInstance'

export const addMaterialReceive = data => {
  return api.post('tm_material_receive-add/', data)
}
