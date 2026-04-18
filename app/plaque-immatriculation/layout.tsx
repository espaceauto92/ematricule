import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plaques d\'Immatriculation Homologuées - Fabrication Française',
  description: 'Commandez vos plaques d\'immatriculation en ligne. Matériaux haut de gamme (Plexiglass), fabrication française, livraison en 24/48h. Tous départements disponibles.',
  keywords: 'plaque immatriculation, plaques auto, plaques moto, plaques homologuées, plaque immatriculation personnalisée, plaque plexiglass',
  alternates: {
    canonical: '/plaque-immatriculation',
  },
  openGraph: {
    title: 'Plaques d\'Immatriculation Homologuées - E-matricule',
    description: 'Plaques d\'immatriculation de haute qualité, homologuées et fabriquées en France.',
    url: 'https://ematricule.fr/plaque-immatriculation',
  },
}

export default function PlaqueImmatriculationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
