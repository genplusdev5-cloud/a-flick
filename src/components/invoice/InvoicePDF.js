import React, { forwardRef } from 'react'

const InvoicePDF = forwardRef(({ invoiceData }, ref) => {
  const data = invoiceData?.data || {}
  const inv = data.invoice || {}
  const company = data.company || {}
  const customer = data.customer || {}
  const contract = data.contract || {}

  return (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '10mm', background: '#fff', fontFamily: 'Arial' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Dummy Logo */}
        <img src="/dummy-logo.png" alt="Logo" style={{ width: 150 }} />

        <div style={{ textAlign: 'right', fontSize: '11px' }}>
          <b>{company.name}</b><br />
          UEN : {company.uen_number}<br />
          {company.address_line_1}{company.address_line_2}<br />
          {company.city}<br />
          Tel:{company.phone}<br />
          Email:{company.email}
        </div>
      </div>

      {/* INVOICE TITLE */}
      <h3 style={{ textAlign: 'left', marginTop: '15px', border: '1px solid #000', width: '80px', textAlign: 'center' }}>
        INVOICE
      </h3>

      {/* TOP DETAILS */}
      <div style={{ fontSize: '11px', marginTop: '10px' }}>
        <div><b>Bill To:</b> {customer.name}</div>
        <div><b>Billing Address:</b> {customer.billing_address}</div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px' }}>
        Invoice #: {inv.invoice_number}<br />
        Date : {inv.invoice_date}<br />
        Payment Due : {data.payment_due_date}<br />
        Terms : {contract.billing_term} days<br />
        Contract No : {contract.contract_code}<br />
        Salesperson : {data.sales_person?.name || '-'}
      </div>

      {/* SERVICE TABLE */}
      <table style={{ width: '100%', marginTop: '20px', fontSize: '11px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th align="left">Service Description Details</th>
            <th align="right">Amount ($)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{inv.remarks}</td>
            <td align="right">{inv.amount?.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* TOTALS */}
      <table style={{ width: '100%', fontSize: '12px', marginTop: '15px' }}>
        <tbody>
          <tr>
            <td align="right"><b>Total :</b></td>
            <td align="right">${(inv.amount + inv.gst).toFixed(2)}</td>
          </tr>
          <tr>
            <td align="right"><b>Grand Total :</b></td>
            <td align="right">${(inv.amount + inv.gst).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '40px' }}>
        <b>{company.name}</b>
      </div>

      {/* Dummy QR + certification placeholders */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <div style={{ fontSize: "9px" }}>
          All cheque transfer details here...<br />
          REF: {inv.invoice_number}
        </div>
        <img src="/dummy-qr.png" alt="QR" style={{ width: 130, height: 130 }} />
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
        This is a computer-generated invoice therefore no signature is required
      </div>
    </div>
  )
})

export default InvoicePDF
