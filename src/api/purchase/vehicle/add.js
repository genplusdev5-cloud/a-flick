import api from '@/utils/axiosInstance'

const addVehicle = async payload => {
  const response = await api.post('vehicle-add/', payload)
  return response.data
}

export default addVehicle
