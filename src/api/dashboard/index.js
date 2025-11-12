import api from '@/utils/axiosInstance'

export const getFullDashboardData = async (
  type = 'contract',
  page = 1,
  pageSize = 25,
  cancelToken
) => {
  try {
    // 🧠 Sanity log
    console.log('✅ Using baseURL:', api.defaults.baseURL)

    // 🟢 Step 1: Get dashboard cards
    const cardsRes = await api.get('dashboard/', { cancelToken })

    // 🟢 Step 2: Get table list
    const listRes = await api.get(`dashboard-filter/`, {
      cancelToken,
      params: {
        type,
        page,
        limit: pageSize
      }
    })

    return {
      status: 'success',
      cards: cardsRes?.data?.data || {},
      table:
        listRes?.data?.results ||
        listRes?.data?.data?.results ||
        [],
      count:
        listRes?.data?.count ||
        listRes?.data?.data?.count ||
        0
    }
  } catch (err) {
    console.error('❌ Dashboard API Error:', err)
    return { status: 'failed', cards: {}, table: [], count: 0 }
  }
}
