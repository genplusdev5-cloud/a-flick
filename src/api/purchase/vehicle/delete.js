import api from '@/utils/axiosInstance'

const deleteVehicle = async id => {
  const response = await api.patch(`vehicle-delete/?id=${id}`, { id })
  return response.data
}

export default deleteVehicle
