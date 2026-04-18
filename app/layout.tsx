import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'
import ConditionalLayout from '@/components/ConditionalLayout'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const baseUrl = 'https://ematricule.fr'

export const metadata: Metadata = {
  title: {
    default: 'E-matricule - Cartes Grises et Plaques d\'Immatriculation en 2 minutes',
    template: '%s | E-matricule'
  },
  description: 'Votre carte grise & vos plaques d\'immatriculation en 2 minutes. Service d\'immatriculation simplifié en ligne avec habilitation du Ministère de l\'Intérieur. Simple, Rapide et Sécurisé.',
  keywords: 'carte grise en ligne, plaque immatriculation, immatriculation, véhicule, auto, moto, camion, changement de propriétaire, duplicata carte grise, habilitation ministère intérieur',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'E-matricule - Cartes Grises et Plaques d\'Immatriculation',
    description: 'Service d\'immatriculation simplifié en ligne. Commandez votre carte grise et vos plaques en 2 minutes.',
    url: baseUrl,
    siteName: 'E-matricule',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'E-matricule - Service d\'immatriculation',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-matricule - Cartes Grises et Plaques d\'Immatriculation',
    description: 'Votre carte grise & vos plaques d\'immatriculation en 2 minutes. Service d\'immatriculation simplifié.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-TJ822J78');`}
        </Script>
        {/* End Google Tag Manager */}
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q20X17PE6E"
          strategy="afterInteractive"
        />
        <Script id="ga-script" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Q20X17PE6E');`}
        </Script>
        {/* Schema.org Structured Data */}
        <Script id="schema-org" strategy="afterInteractive" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "E-matricule",
            "url": "https://ematricule.fr",
            "logo": "https://ematricule.fr/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "Contact@ematricule.fr",
              "contactType": "customer service"
            },
            "sameAs": [
              // Add social media links here if available
            ]
          })}
        </Script>
        <Script id="schema-website" strategy="afterInteractive" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "E-matricule",
            "url": "https://ematricule.fr",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://ematricule.fr/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </Script>

      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-TJ822J78"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <SessionProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </SessionProvider>
      </body>
    </html>
  )
}





