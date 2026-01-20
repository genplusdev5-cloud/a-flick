import api from '@/utils/axiosInstance'

/**
 * 🔹 Get ALL modules (Master list)
 * Used when User Privilege page opens
 * API: GET user_module-list/
 */
export const getUserModuleList = async () => {
  try {
    const res = await api.get('user_module-list/', {
      params: {
        page_size: 1000 // 🔥 FULL LIST
      }
    })

    return {
      status: res.data?.status || 'success',
      data: res.data?.data
    }
  } catch (error) {
    console.error('❌ Module list error:', error)
    throw error
  }
}

/**
 * 🔹 Get single module details (optional / future use)
 * API: GET user_module-details/?id=1
 */
export const getUserModuleDetails = async id => {
  try {
    const res = await api.get('user_module-details/', {
      params: { id }
    })

    return {
      status: res.data?.status || 'success',
      data: res.data?.data || res.data
    }
  } catch (error) {
    console.error('❌ Module details error:', error)
    throw error
  }
}
