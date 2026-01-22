import api from '@/utils/axiosInstance'

const updateVehicle = async payload => {
  const response = await api.put('vehicle-update/', payload)
  return response.data
}

export default updateVehicle
