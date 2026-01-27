import api from '@/utils/axiosInstance'

import getVehicleList from './list'

export const getVehicleDropdown = async () => {
  try {
    const res = await getVehicleList({ page_size: 1000 })
    return {
      vehicle: res?.data?.results || res?.results || []
    }
  } catch (error) {
    console.error('getVehicleDropdown error:', error)
    return { vehicle: [] }
  }
}
