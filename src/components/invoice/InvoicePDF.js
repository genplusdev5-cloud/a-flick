'use client'

import React, { forwardRef } from 'react'

const InvoicePDF = forwardRef(({ invoiceData = {} }, ref) => {
  const data = invoiceData?.data || {}
  const inv = data.invoice || {}
  const company = data.company || {}
  const customer = data.customer || {}
  const contract = data.contract || {}
  const salesperson = data.sales_person || {}

  // safe numeric conversions
  const amount = Number(inv.amount ?? 0)
  const gst = Number(inv.gst ?? 0)
  const grandTotal = +(amount + gst).toFixed(2)

  const logoSrc = company.logo ? `/invoice/${company.logo.split('/').pop()}` : '/invoice/baygone_logo.png'

  // Static invoice images
  const qrSrc = '/invoice/baygone_qr.png'
  const payNowSrc = '/invoice/pay_now_footer.png'
  const bizSafe = '/invoice/bizsafe_logo.jpg' // FIXED ✔
  const sac = '/invoice/sac_cert.jpg' // Correct ✔

  // utility to render a safe text line
  const safeText = t => (t === null || t === undefined ? '' : String(t))

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 14mm',
        background: '#ffffff',
        color: '#000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 11,
        boxSizing: 'border-box',

        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '60%' }}>
          <img src={logoSrc} alt='company logo' style={{ width: 160, display: 'block' }} crossOrigin='anonymous' />
        </div>

        <div style={{ width: '35%', textAlign: 'right', lineHeight: 1.4 }}>
          <strong>{safeText(company.name)}</strong>
          <br />
          UEN : {safeText(company.uen_number)}
          <br />
          {safeText(company.address_line_1)}
          <br />
          {safeText(company.address_line_2)}
          <br />
          {safeText(company.city)} {company.postal_code ? `- ${company.postal_code}` : ''}
          <br />
          Tel: {safeText(company.phone)}
          <br />
          Email: {safeText(company.email)}
        </div>
      </div>

      {/* invoice label */}
      <div
        style={{
          marginTop: 16,
          display: 'inline-block',
          border: '1px solid #000',
          padding: '5px 16px',
          fontWeight: 700
        }}
      >
        INVOICE
      </div>

      {/* details block */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
        {/* left billing */}
        <div style={{ width: '60%', lineHeight: 1.5 }}>
          <strong>Bill To:</strong>
          <br />
          {safeText(customer.name)}
          <br />
          {safeText(customer.billing_address)}
          <br />
          {safeText(customer.city)} {customer.postal_code ? ` ${customer.postal_code}` : ''}
          <br />
          {customer.billing_contact_name && (
            <>
              <strong>ATTENTION TO:</strong> {customer.billing_contact_name}
              <br />
            </>
          )}
          <br />
          {/* <strong>Service Site Address:</strong>
          <br />
          {safeText(customer.billing_address)} */}
          <strong>Service Site Address:</strong>
          <br />
          As Below
        </div>

        {/* right data table */}
        <div style={{ width: '35%' }}>
          <table style={{ width: '100%', lineHeight: 1.6, fontSize: 11 }}>
            <tbody>
              <tr>
                <td>Invoice # :</td>
                <td style={{ textAlign: 'right' }}>{safeText(inv.invoice_number)}</td>
              </tr>
              <tr>
                <td>Date :</td>
                <td style={{ textAlign: 'right' }}>{safeText(inv.invoice_date)}</td>
              </tr>
              <tr>
                <td>Payment Due :</td>
                <td style={{ textAlign: 'right' }}>{safeText(data.payment_due_date)}</td>
              </tr>
              <tr>
                <td>Terms :</td>
                <td style={{ textAlign: 'right' }}>{safeText(contract.billing_term)} days</td>
              </tr>
              <tr>
                <td>Contract No :</td>
                <td style={{ textAlign: 'right' }}>{safeText(contract.contract_code)}</td>
              </tr>
              <tr>
                <td>Page No :</td>
                <td style={{ textAlign: 'right' }}>1</td>
              </tr>
              <tr>
                <td>Salesperson :</td>
                <td style={{ textAlign: 'right' }}>{safeText(salesperson?.name ?? '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* divider header */}
      <div
        style={{
          marginTop: 20,
          borderTop: '1px solid #000',
          borderBottom: '1px solid #000',
          padding: '6px 4px',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <span>Service Description Details</span>
        <span>Amount ($)</span>
      </div>

      {/* services table */}
      <table style={{ width: '100%', marginTop: 8 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', paddingRight: 6 }}>{safeText(inv.remarks)}</td>
            <td style={{ textAlign: 'right', width: 100 }}>{amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* PUSH DOWN AREA – keeps footer fixed */}
      <div style={{ flexGrow: 1 }}></div>

      {/* TOTALS SECTION */}
      <div style={{ paddingTop: 30, marginBottom: 0 }}>
        {/* TOP LINE */}
        <div style={{ borderTop: '2px solid #4a4f56', width: '100%' }}></div>

        {/* TOTALS TABLE */}
        <table style={{ width: '100%', fontSize: 11, marginTop: 6 }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'right', padding: '4px 0' }}>
                <strong>Total :</strong>
              </td>
              <td style={{ textAlign: 'right' }}>{amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'right' }}>0% of N-T :</td>
              <td style={{ textAlign: 'right' }}>{(0.0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* MIDDLE LINE */}
        <div style={{ borderTop: '2px solid #4a4f56', width: '100%', marginTop: 4 }}></div>

        {/* GRAND TOTAL TABLE */}
        <table style={{ width: '100%', fontSize: 11, marginTop: 4 }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'right', padding: '6px 0' }}>
                <strong>Grand Total :</strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <strong>{grandTotal.toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* BOTTOM LINE */}
        <div style={{ borderTop: '2px solid #4a4f56', width: '100%', marginTop: 4 }}></div>
      </div>

      {/* === ORIGINAL FOOTER (EXACT MATCH) === */}
      <div style={{ height: 100 }}></div>
      {/* TOP TITLE */}
      <div style={{ textAlign: 'center', marginTop: 55 }}>
        <div
          style={{
            display: 'inline-block', // keeps line width equal to text
            fontWeight: 'bold',
            fontSize: 14,
            borderBottom: '1px solid #000', // thin underline
            paddingBottom: 4 // small gap between text & line
          }}
        >
          BAYGONE PTE LTD
        </div>
      </div>

      {/* MAIN FOOTER CONTENT */}
      <div
        style={{
          marginTop: 25,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        {/* LEFT TEXT BLOCK */}
        <div
          style={{
            width: '55%',
            fontSize: 11,
            lineHeight: 1.55,
            marginTop: 10 // lifts text to match original height
          }}
        >
          All cheques must be payable to:
          <br />
          For Overseas and Local Transfer use: -<br />
          Beneficiary Bank Name: DBS Bank Ltd
          <br />
          Beneficiary Account Number: <strong>072-020337-2</strong>
          <br />
          Beneficiary Bank Code (four digits): 7171
          <br />
          Beneficiary Swift Code (eight characters): DBSSSGSG
          <br />
          For Paynow Transfer: -<br />
          Please select send via Unique Entity Number (UEN) <strong>{safeText(company.uen_number)}</strong>
          <br />
          Please enter reference number: <strong>{safeText(inv.invoice_number)}</strong>
        </div>

        {/* RIGHT QR BLOCK */}
        <div
          style={{
            width: '38%',
            textAlign: 'center',
            marginTop: -10 // ★ aligns QR to correct top position
          }}
        >
          <img
            src={qrSrc}
            style={{ width: 190 }} // ★ original QR is slightly bigger than your version
            crossOrigin='anonymous'
          />

          <div style={{ marginTop: 10 }}>
            <img
              src={payNowSrc}
              style={{ width: 200 }} // ★ original width
              crossOrigin='anonymous'
            />
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div
        style={{
          marginTop: 10,
          textAlign: 'center',
          fontSize: 11
        }}
      >
        This is a computer-generated invoice therefore no signature is required
      </div>

      {/* DIVIDER – EXACT LIKE <hr> IN PHP */}
      <div
        style={{
          marginTop: 5, // very small gap
          borderTop: '1px solid #000', // thin HR line same as PHP
          width: '100%'
        }}
      ></div>

      {/* BOTTOM LOGOS */}
      {/* BOTTOM BRAND LOGOS — EXACT ORIGINAL LAYOUT */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between', // ★ LEFT & RIGHT like original
          alignItems: 'center',
          width: '100%'
        }}
      >
        {/* LEFT LOGOS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src='/invoice/aflick_its_gone.jpg' style={{ height: 12 }} />
          <img src='/invoice/bizsafelogo.jpg' style={{ height: 25 }} />
        </div>

        {/* RIGHT LOGOS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src='/invoice/sac_cert.jpg' style={{ height: 32 }} />
          <img src='/invoice/sac_cert2.jpg' style={{ height: 32 }} />
        </div>
      </div>
      {/* === ORIGINAL FOOTER END === */}
    </div>
  )
})

InvoicePDF.displayName = 'InvoicePDF'

export default InvoicePDF
