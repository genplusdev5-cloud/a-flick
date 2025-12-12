'use client'
import React, { forwardRef } from 'react'

const SchedulePDF = forwardRef(({ data = {}, schedule = [] }, ref) => {
  const company = data.company || {}
  const customer = data.customer || {}

  const baseURL = typeof window !== 'undefined' ? window.location.origin : ''

  const logo =
    company.name?.toLowerCase().includes('baygone')
      ? `${baseURL}/invoice/baygone_logo.png`
      : `${baseURL}/invoice/aflick_print_logo.png`

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 15mm',
        background: '#fff',
        fontFamily: 'Arial',
        fontSize: 12,
        lineHeight: 1.5,
        color: '#000'
      }}
    >
      {/* ===== HEADER (LOGO LEFT + COMPANY RIGHT) ===== */}
      <table width="100%">
        <tbody>
          <tr>
            <td width="40%" style={{ verticalAlign: 'top' }}>
              <img src={logo} style={{ height: 70 }} />
            </td>

            <td width="60%" style={{ textAlign: 'right', verticalAlign: 'top' }}>
              <p><b>{company.name}</b></p>
              <p>{company.address_line_1}</p>
              <p>{company.address_line_2}</p>
              <p>{company.city}</p>
              <p>Tel: {company.phone}</p>
              <p>Email: {company.email}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DIVIDER BELOW LOGO (REQUESTED) ===== */}
      <div
        style={{
          borderBottom: '2px solid #000',
          width: '100%',
          margin: '10px 0'
        }}
      ></div>

      {/* ===== DATE + CUSTOMER DETAILS ===== */}
      <p><b>Date :</b> {new Date().toLocaleDateString()}</p>

      <p><b>{customer.name?.trim()}</b></p>
      <p>{customer.billing_address}</p>
      <p>{customer.city} - {customer.postal_code}</p>

      <br />

      {/* ===== TITLE ===== */}
      <h3
        style={{
          textAlign: 'center',
          textDecoration: 'underline',
          margin: '10px 0',
          fontWeight: 'bold'
        }}
      >
        SCHEDULE OF PEST CONTROL SERVICE
      </h3>

      <p>
        Thank you for giving us the opportunity to carry out pest control services for the above-mentioned.
        We are pleased to inform that the services will be scheduled on the following dates.
      </p>

      <br />

      {/* ===== TWO COLUMN SCHEDULE TABLE ===== */}
      <table
        width="100%"
        border="1"
        cellPadding="6"
        style={{ borderCollapse: 'collapse', fontSize: 11 }}
      >
        <thead>
          <tr style={{ background: '#f2f2f2', textAlign: 'center' }}>
            <th>No</th>
            <th>Service Date</th>
            <th>Pests</th>
            <th>Status</th>

            <th>No</th>
            <th>Service Date</th>
            <th>Pests</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {(() => {
            const rows = []
            for (let i = 0; i < schedule.length; i += 2) {
              const left = schedule[i]
              const right = schedule[i + 1]

              rows.push(
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{left?.service_date}</td>
                  <td>{left?.pests}</td>
                  <td>{left?.status}</td>

                  <td>{right ? i + 2 : ''}</td>
                  <td>{right?.service_date || ''}</td>
                  <td>{right?.pests || ''}</td>
                  <td>{right?.status || ''}</td>
                </tr>
              )
            }
            return rows
          })()}
        </tbody>
      </table>

      <br />

      {/* ===== LEGEND ===== */}
      <p><b>LEGEND :</b> ROD - Rodents, FLIES - Flies, CR - Cockroaches</p>

      <br />

      {/* ===== FOOTER ===== */}
      <p>
        Should you require to change any date/time, please kindly inform us via email or contact us directly.
      </p>

      <br />

      <p>Thank you.</p>
      <p>
        Yours faithfully,<br />
        {company.name} Team
      </p>
    </div>
  )
})

SchedulePDF.displayName = 'SchedulePDF'
export default SchedulePDF
