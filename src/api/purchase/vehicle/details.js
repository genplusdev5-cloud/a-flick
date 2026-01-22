import api from '@/utils/axiosInstance'

const getVehicleDetails = async id => {
  const response = await api.get('vehicle-details/', {
    params: { id }
  })
  return response.data
}

export default getVehicleDetails
