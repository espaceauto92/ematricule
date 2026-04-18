import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carte Grise en Ligne - Service Officiel et Rapide',
  description: 'Commandez votre carte grise en ligne en quelques minutes. Changement de titulaire, duplicata, changement d\'adresse. Habilitation Ministère de l\'Intérieur.',
  keywords: 'carte grise, certificat immatriculation, changement titulaire, duplicata carte grise, ants, carte grise express',
  alternates: {
    canonical: '/carte-grise',
  },
  openGraph: {
    title: 'Carte Grise en Ligne - E-matricule',
    description: 'Simplifiez vos démarches de carte grise. Service rapide et sécurisé en ligne.',
    url: 'https://ematricule.fr/carte-grise',
  },
}

export default function CarteGriseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
