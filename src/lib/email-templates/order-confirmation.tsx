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
  serviceName: string
  extensionName?: string | null
  amount: number
}

const Email = ({ orderCode, customerName, serviceName, extensionName, amount }: Props) => {
  const firstName = (customerName || '').split(' ')[0] || 'there'
  const rows: Array<[string, string]> = [
    ['Order code', orderCode],
    ['Service', serviceName],
    ...(extensionName ? ([['Extension', extensionName]] as Array<[string, string]>) : []),
    ['Amount', `$${amount}`],
    ['Status', 'Pending'],
  ]
  return (
    <Html lang="en">
      <Head />
      <Preview>We received your order {orderCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks, {firstName}!</Heading>
          <Text style={p}>
            We received your order <strong>{orderCode}</strong> on pubsetup.com. Our team will
            reach out shortly to confirm the details and get started — no payment is required at
            this step.
          </Text>
          <Section style={tableWrap}>
            {rows.map(([k, v]) => (
              <Row key={k} style={row}>
                <Column style={cellKey}>{k}</Column>
                <Column style={cellVal}><strong>{v}</strong></Column>
              </Row>
            ))}
          </Section>
          <Hr style={hr} />
          <Text style={p}>
            Need to add information or change something? Just reply to this email — it goes
            straight to our team at <a href="mailto:contact@pubsetup.com" style={link}>contact@pubsetup.com</a>.
          </Text>
          <Text style={footer}>— The pubsetup.com team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Order ${d.orderCode ?? ''} received — pubsetup.com`,
  displayName: 'Order confirmation (customer)',
  previewData: {
    orderCode: 'PUB-ABC123',
    customerName: 'Jane Doe',
    serviceName: 'Magento 2 setup',
    extensionName: 'Amasty SEO Toolkit',
    amount: 300,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#222' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const h1 = { fontSize: '24px', margin: '0 0 12px' }
const p = { fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }
const tableWrap = { border: '1px solid #eee', borderRadius: '6px', margin: '8px 0' }
const row = { borderBottom: '1px solid #eee' }
const cellKey = { padding: '8px 12px', color: '#666', fontSize: '14px', width: '40%' }
const cellVal = { padding: '8px 12px', fontSize: '14px' }
const hr = { borderColor: '#eee', margin: '20px 0' }
const link = { color: '#2563eb', textDecoration: 'none' }
const footer = { color: '#888', fontSize: '12px', marginTop: '20px' }
