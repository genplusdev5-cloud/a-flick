'use client'
import React, { forwardRef } from 'react'

const AgreementPDF = forwardRef((props, ref) => {
  const agreementData = props.agreementData || {}
  const company = agreementData.company || {}
  const customer = agreementData.customer || {}
  const contract = agreementData.contract || {}

  const safe = (v, fallback = 'N/A') => (v ? String(v).trim() : fallback)
  const upper = v => (v ? String(v).trim().toUpperCase() : 'N/A')

  const isBaygone = Number(contract?.company_id) === 5

  const companyLogo = isBaygone ? '/invoice/baygone_logo.png' : '/invoice/aflick_print_logo.png'

  const footerImages = isBaygone
    ? ['/invoice/bizsafelogo.jpg', '/invoice/sac_cert.jpg']
    : ['/invoice/aflick_its_gone.jpg', '/invoice/bizsafelogo.jpg', '/invoice/sac_cert.jpg']

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 15mm',
        background: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        lineHeight: 1.5,
        color: '#000'
      }}
    >
      {/* HEADER */}
      <table width='100%' cellPadding={0} cellSpacing={0} style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <td width='40%' valign='top'>
              <img src={companyLogo} alt='Logo' style={{ width: 160, objectFit: 'contain' }} />
            </td>
            <td width='60%' align='right' valign='top' style={{ fontSize: 11, lineHeight: '1.4' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{safe(company.name)}</div>
              UEN (GST): {safe(company.uen_number)}
              <br />
              {safe(company.address_line_1)}
              {company.address_line_2 && (
                <>
                  <br />
                  {safe(company.address_line_2)}
                </>
              )}
              <br />
              {safe(company.city)} {safe(company.postal_code)}
              <br />
              Tel: {safe(company.phone)}
              <br />
              Email: {safe(company.email)}
            </td>
          </tr>
        </tbody>
      </table>

      <hr style={{ border: '1px solid #000', margin: '8px 0 12px' }} />

      <h3
        style={{ textAlign: 'center', textDecoration: 'underline', margin: '10px 0', fontSize: 16, fontWeight: 'bold' }}
      >
        PEST MANAGEMENT SERVICE AGREEMENT
      </h3>

      <p align='justify' style={{ marginBottom: 8 }}>
        This Agreement is made between <b>M/s {upper(company.name)}</b>, having its registered office at{' '}
        <b>
          {safe(company.address_line_1)}
          {company.address_line_2 && (
            <>
              ,<br />
              {safe(company.address_line_2)}
            </>
          )}
          {company.city && ` ${safe(company.city)}`}
          {company.postal_code && ` ${safe(company.postal_code)}`}
        </b>{' '}
        (hereinafter called <b>“The Contractor”</b>) of the one part and <b>{upper(customer.name)}</b> having its
        billing address <b>{safe(customer.billing_address)}</b> (hereinafter called <b>“The Client”</b>) of the other
        part. Whereas the Client is desirous of appointing the Contractor for the provision of Pest Control Services and
        the Contractor has consented to provide services at the following{' '}
        <b>
          {safe(contract.service_address)}, Singapore - {safe(contract.postal_address)}
        </b>{' '}
        (hereinafter called <b>“The Premises”</b>).
      </p>

      <p style={{ marginBottom: 10 }}>
        This Agreement <b>WITNESSETH</b> and the parties hereto mutually agree as follows:
      </p>

      <ol type='a' style={{ marginLeft: 18, paddingLeft: 10 }}>
        <li style={{ marginBottom: 10 }}>
          <p align='justify'>
            This Contract will commence from <b>{safe(contract.start_date)}</b> for a period of{' '}
            <b>{safe(contract.contract_months)} months</b>. The Client agrees to pay for the scope of work at monthly (
            <b>S${safe(contract.monthly_price)} nett</b>) of the contract sum as stated in clause (b) herein.
          </p>
        </li>
        <li style={{ marginBottom: 10 }}>
          <p align='justify'>
            The Client shall pay the contract sum of <b>S${safe(contract.yearly_price)} nett</b> per year. Payment shall
            be made within 30 days upon receipt of the respective invoice. Please refer clause (a) on the payment terms.
          </p>
        </li>
        <li style={{ marginBottom: 10 }}>
          <p align='justify'>
            This contract is binding for one year from the date as stated in Clause (a) and shall continue thereafter
            but may be terminated after the 1st year by giving <b>Two (2) month’s</b> notice in writing.
          </p>
        </li>
        <li style={{ marginBottom: 10 }}>
          <p align='justify'>
            The Client shall provide free access to all parts of the premises for any inspection or treatment by the
            Contractor. The Contractor will not be able to service areas which are obstructed or inaccessible.
          </p>
        </li>
        <li style={{ marginBottom: 10 }}>
          <p align='justify'>
            <b>{upper(company.name)}</b> will not be responsible for damages or whatsoever caused by infestation of
            pests.
          </p>
        </li>
        <li style={{ marginBottom: 12 }}>
          <b>PESTS AND SERVICE FREQUENCY COVER UNDER THE AGREEMENT</b>
          <ul style={{ margin: '8px 0 0 20px', listStyleType: 'disc' }}>
            <li>{safe(contract.invoice_remarks) || 'Monthly service for Cockroaches, Flies, Rodents'}</li>
          </ul>
        </li>
      </ol>

      <ol start={1} style={{ marginLeft: 18, fontSize: 11, marginTop: 5, lineHeight: 1.4 }}>
        <li>Any pest infestation (covered by contract) call visits will be F.O.C except flies.</li>
        <li>Pest Control Treatment from Monday to Friday 9.00am to 5.00pm & Saturday 9.00am to 12.00pm.</li>
        <li>
          <p align='justify' style={{ margin: '4px 0' }}>
            Disclaimer: The customer shall indemnify {isBaygone ? 'Baygone Pte Ltd' : 'the Contractor'} from and against
            all loss, damage or liability and legal fees and costs incurred in the event of or as a result of any act or
            default by the customer or its agents and Employees pursuant to this proposal/agreement.{' '}
            {isBaygone ? 'Baygone Pte Ltd' : 'The Contractor'} shall not be held liable for any indirect, incidental or
            consequential damages, including without limitation, any loss of profit, data or income arising out of or in
            connection to the treatment.
          </p>
        </li>
      </ol>

      {/* SIGNATURE - Contractor */}
      <table width='100%' style={{ marginTop: 40, fontSize: 12 }}>
        <tbody>
          <tr>
            <td width='180' valign='top'>
              Signed By
              <br />
              For and on behalf of
              <br />
              {isBaygone ? 'Baygone Pte Ltd' : safe(company.name)}
            </td>

            <td width='20' valign='top'>
              )
            </td>

            {/* Signature line */}
            <td width='200' valign='top'>
              ___________________
            </td>

            {/* NAME + DATE */}
            <td valign='top' style={{ paddingLeft: 20 }}>
              <strong>KELSON LIM</strong>
            </td>

            <td valign='top' style={{ paddingLeft: 40 }}>
              DATE: ___________________
            </td>
          </tr>
        </tbody>
      </table>

      {/* SIGNATURE - Client */}
      {/* CONTRACTOR SIGNATURE BLOCK */}
      <table width='100%' style={{ marginTop: 40, fontSize: 12 }}>
        <tbody>
          <tr>
            {/* LEFT SIDE TEXT */}
            <td width='180' valign='top'>
              Signed By
              <br />
              For and on behalf of
              <br />
              {isBaygone ? 'Baygone Pte Ltd' : safe(company.name)}
            </td>

            {/* BRACKET */}
            <td width='20' valign='top'>
              )
            </td>

            {/* SIGNATURE LINE */}
            <td width='200' valign='top'>
              ___________________
            </td>

            {/* NAME */}
            <td valign='top' style={{ paddingLeft: 20 }}>
              <strong>KELSON LIM</strong>
            </td>

            {/* DATE */}
            <td valign='top' style={{ paddingLeft: 40 }}>
              DATE: ___________________
            </td>
          </tr>
        </tbody>
      </table>

      {/* CLIENT SIGNATURE BLOCK */}
      <table width='100%' style={{ marginTop: 35, fontSize: 12 }}>
        <tbody>
          <tr>
            {/* LEFT SIDE TEXT */}
            <td width='180' valign='top'>
              Signed & Stamp By
              <br />
              Client
            </td>

            {/* BRACKET */}
            <td width='20' valign='top'>
              )
            </td>

            {/* SIGNATURE LINE */}
            <td width='200' valign='top'>
              ___________________
            </td>

            {/* NAME */}
            <td valign='top' style={{ paddingLeft: 20 }}>
              NAME: {safe(customer.name)}
            </td>

            {/* DATE */}
            <td valign='top' style={{ paddingLeft: 40 }}>
              DATE: ___________________
            </td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER - SAME STRUCTURE AS INVOICE STYLE */}
      <div
        style={{
          position: 'absolute',
          bottom: '10mm',
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '15mm',
          paddingRight: '15mm'
        }}
      >
        {/* LEFT SIDE (A-Flick text + bizsafe if needed) */}
        {!isBaygone ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src='/invoice/aflick_its_gone.jpg' style={{ height: 14 }} />
            <img src='/invoice/bizsafelogo.jpg' style={{ height: 24 }} />
          </div>
        ) : (
          <div></div> // Baygone has no left logos
        )}

        {/* RIGHT SIDE (SAC Certificates - always show) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src='/invoice/sac_cert.jpg' style={{ height: 28 }} />
          <img src='/invoice/sac_cert2.jpg' style={{ height: 28 }} />
        </div>
      </div>
    </div>
  )
})

AgreementPDF.displayName = 'AgreementPDF'
export default AgreementPDF
