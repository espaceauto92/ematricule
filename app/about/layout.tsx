import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'À Propos de E-matricule - Notre expertise en immatriculation',
  description: 'Découvrez E-matricule, votre partenaire de confiance pour toutes vos démarches d\'immatriculation en France depuis 2009. Habilitation officielle et service client dédié.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
