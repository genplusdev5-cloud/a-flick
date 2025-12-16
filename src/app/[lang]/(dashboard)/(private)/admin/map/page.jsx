'use client'

import React from 'react'
import PermissionGuard from '@/components/auth/PermissionGuard'

const MapPageContent = () => {
  return (
    <div className='p-6'>
      {/* ✅ Page Title */}
      <h1 className='text-2xl font-semibold mb-4'>🗺️ Map</h1>

      {/* ✅ Full Width Google Map (No API Key Needed) */}
      <div className='w-full h-[calc(100vh-150px)] rounded-lg overflow-hidden shadow-md'>
        <iframe
          src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.800274522733!2d103.819836!3d1.352083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19a9f6a6dbbb%3A0xb6e7a7e7ed1a3c6e!2sSingapore!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin'
          width='100%'
          height='100%'
          style={{ border: 0 }}
          allowFullScreen=''
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
        ></iframe>
      </div>
    </div>
  )
}

export default function MapPage() {
  return (
    <PermissionGuard permission="Map">
      <MapPageContent />
    </PermissionGuard>
  )
}
