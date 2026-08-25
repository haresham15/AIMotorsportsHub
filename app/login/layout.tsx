import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | Apexis',
  description: 'Sign in to Apexis to access Fantasy Predictions, custom alerts, and more.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
