import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Hr,
  Preview,
} from '@react-email/components'

/**
 * WelcomeEmail Component
 *
 * Sent to users who sign up for the waitlist.
 * Clean, text-forward design with a "Founder to Founder" tone.
 * Built with @react-email/components for reliable cross-client rendering.
 */

interface WelcomeEmailProps {
  email?: string
}

export default function WelcomeEmail({ email }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>You&apos;re a founding member of Slab Advisor</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={headingStyle}>Welcome to the Sanctuary.</Text>

            <Text style={textStyle}>
              You&apos;re officially a Founding Member of Slab Advisor.
            </Text>

            <Text style={textStyle}>
              We are building the only platform that combines professional
              portfolio tracking with AI-powered card grading and fair access to
              sealed product. No more guessing what your cards are worth. No more
              overpaying for sealed.
            </Text>

            <Text style={textStyle}>
              As a founding member, you&apos;ll be among the first to get access
              when we launch. We&apos;ll keep you updated on our progress and let
              you know as soon as the doors open.
            </Text>

            <Hr style={hrStyle} />

            <Text style={signatureStyle}>
              Thanks for believing in what we&apos;re building.
            </Text>

            <Text style={signatureNameStyle}>
              — The Slab Advisor Team
            </Text>

            {email && (
              <Text style={footerStyle}>
                This email was sent to {email} because you signed up for the
                Slab Advisor waitlist.
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0' as const,
  padding: '0' as const,
}

const containerStyle = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '40px 20px',
}

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px 32px',
  border: '1px solid #e5e7eb',
}

const headingStyle = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#111827',
  margin: '0 0 24px 0',
  lineHeight: '1.3',
}

const textStyle = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const hrStyle = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const signatureStyle = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 4px 0',
}

const signatureNameStyle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#ea580c',
  margin: '0 0 0 0',
}

const footerStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  marginTop: '24px',
}
