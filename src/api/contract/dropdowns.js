// api/contract/dropdowns.js
import api from '@/utils/axiosInstance'

export const getAllDropdowns = async () => {
  try {
    const company = typeof window !== 'undefined' ? localStorage.getItem('company') : ''
    const branch = typeof window !== 'undefined' ? localStorage.getItem('branch') : ''

    const res = await api.get('/contract/', {
      params: { company, branch, dropdown: true, page_size: 500 }
    })

    // THIS IS THE EXACT PATH FROM YOUR RESPONSE
    const raw = res?.data?.data?.data || {}

    // Helper to extract name array from { name: [...] } structure
    const extractNames = (field) => {
      if (!field) return []
      if (Array.isArray(field)) return field.map(item => item.name || item)
      if (field.name && Array.isArray(field.name)) {
        return field.name.map(item => item.name || item)
      }
      return []
    }

    // Extract customers (might be direct array or object)
    const customers = raw.customer
      ? Array.isArray(raw.customer)
        ? raw.customer.map(c => c.name || c)
        : raw.customer.name
        ? raw.customer.name.map(c => c.name || c)
        : []
      : []

    return {
      customers,
      callTypes: extractNames(raw.calltype),
      billingFreq: extractNames(raw.billing_frequency),
      serviceFreq: extractNames(raw.service_frequency),
      pests: extractNames(raw.pest),
      chemicals: [], // not in response
      employees: [
        ...(raw.technician?.name || []).map(t => ({ ...t, designation: 'Technician' })),
        ...(raw.supervisor?.name || []).map(s => ({ ...s, designation: 'Supervisor' })),
        ...(raw.sales?.name || []).map(sa => ({ ...sa, designation: 'Sales' }))
      ]
    }
  } catch (err) {
    console.error('Dropdown API Error:', err.response?.data || err)
    return {
      customers: [],
      callTypes: [],
      billingFreq: [],
      serviceFreq: [],
      pests: [],
      chemicals: [],
      employees: []
    }
  }
}
