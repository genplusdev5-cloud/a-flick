import api from '@/utils/axiosInstance'

export const addEmployee = async payload => {
  try {
    // ✅ Build backend-ready payload (convert objects to plain strings)
    const finalPayload = {
      company_name: '-', // default
      user_role:
        typeof payload.user_role === 'object'
          ? payload.user_role.label
          : payload.user_role || '-',
      department:
        typeof payload.department === 'object'
          ? payload.department.label
          : payload.department || '-',
      designation:
        typeof payload.designation === 'object'
          ? payload.designation.label
          : payload.designation || '-',
      scheduler:
        typeof payload.scheduler === 'object'
          ? payload.scheduler.label
          : payload.scheduler || '-',
      supervisor:
        typeof payload.supervisor === 'object'
          ? payload.supervisor.label
          : payload.supervisor || '-',

      // ✅ make sure name, email, password exist
      name: payload.name?.trim() || '-',
      email: payload.email?.trim() || '-',
      password: payload.password?.trim() || '-',

      // ✅ convert boolean flags properly
      is_scheduler: payload.isScheduler ? 1 : 0,
      is_sales: payload.isSales ? 1 : 0,
      is_technician: payload.isTechnician ? 1 : 0,
      description: payload.description || '-',

      // ✅ backend tracking fields
      is_active: 1,
      created_by: 1,
      updated_by: 1
    }

    console.log('📤 Final Payload Sent:', finalPayload)
    const response = await api.post('employee-add/', finalPayload)

    console.log('✅ Employee Added Successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Employee Add API Error:', error.response?.data || error.message)
    throw error
  }
}
