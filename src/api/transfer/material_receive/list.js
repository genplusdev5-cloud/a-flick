import api from '@/utils/axiosInstance'

export const getMaterialReceiveList = params => {
  return api.get('tm_material_receive-list/', { params })
}
