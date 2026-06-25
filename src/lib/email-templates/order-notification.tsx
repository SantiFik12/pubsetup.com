import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  orderCode: string
  customerName: string
  customerEmail: string
  website?: string | null
  notes?: string | null
  serviceName: string
  extensionName?: string | null
  amount: number
}

const Email = ({
  orderCode,
  customerName,
  customerEmail,
  website,
  notes,
  serviceName,
  extensionName,
  amount,
}: Props) => {
  const rows: Array<[string, string]> = [
    ['Order code', orderCode],
    ['Service', serviceName],
    ...(extensionName ? ([['Extension', extensionName]] as Array<[string, string]>) : []),
    ['Customer', customerName],
    ['Email', customerEmail],
    ...(website ? ([['Website', website]] as Array<[string, string]>) : []),
    ['Amount', `$${amount}`],
  ]
  return (
    <Html lang="en">
      <Head />
      <Preview>New order {orderCode} — {serviceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New order {orderCode}</Heading>
          <Text style={muted}>A customer just placed an order on pubsetup.com.</Text>
          <Section style={tableWrap}>
            {rows.map(([k, v]) => (
              <Row key={k} style={row}>
                <Column style={cellKey}>{k}</Column>
                <Column style={cellVal}><strong>{v}</strong></Column>
              </Row>
            ))}
          </Section>
          {notes ? (
            <>
              <Hr style={hr} />
              <Heading as="h3" style={h3}>Notes / requirements</Heading>
              <Text style={notesStyle}>{notes}</Text>
            </>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>Reply to this email to reach the customer directly.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `New order ${d.orderCode ?? ''} — ${d.serviceName ?? 'pubsetup.com'}`,
  displayName: 'Order notification (internal)',
  to: 'contact@pubsetup.com',
  previewData: {
    orderCode: 'PUB-ABC123',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    website: 'https://example.com',
    notes: 'SSH access in attached file',
    serviceName: 'Magento 2 setup',
    extensionName: 'Amasty SEO Toolkit',
    amount: 300,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#222' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const h1 = { fontSize: '22px', margin: '0 0 8px' }
const h3 = { fontSize: '14px', margin: '16px 0 8px' }
const muted = { color: '#666', fontSize: '14px', margin: '0 0 16px' }
const tableWrap = { border: '1px solid #eee', borderRadius: '6px' }
const row = { borderBottom: '1px solid #eee' }
const cellKey = { padding: '8px 12px', color: '#666', fontSize: '14px', width: '40%' }
const cellVal = { padding: '8px 12px', fontSize: '14px' }
const notesStyle = { whiteSpace: 'pre-wrap' as const, background: '#f7f7f7', padding: '12px', borderRadius: '6px', fontSize: '14px' }
const hr = { borderColor: '#eee', margin: '20px 0' }
const footer = { color: '#888', fontSize: '12px' }
