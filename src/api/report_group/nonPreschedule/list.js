import api from '@/utils/axiosInstance'

export const getNonPrescheduleList = async (params = {}) => {
  return api.get('non-preschedule/', { params })
}

