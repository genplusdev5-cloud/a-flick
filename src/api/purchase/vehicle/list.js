import api from '@/utils/axiosInstance'

const getVehicleList = async params => {
  const response = await api.get('vehicle-list/', { params })
  return response.data
}

export default getVehicleList
