'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, Info } from 'lucide-react'
import Link from 'next/link'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'
import { createOrder, uploadDocuments, createCheckoutAndRedirect } from '@/lib/services/orderService'
import { saveFilesToIndexedDB } from '@/lib/utils/storage'

// Product data - matching the listing page
const allProducts = [
  {
    id: 1,
    brand: 'Volkswagen',
    brandName: 'VW Volkswagen',
    title: 'Document COC pour VW Volkswagen',
    price: '264,00',
    rating: 5,
    reviews: 481,
    logoImage: '/vw.png',
  },
  {
    id: 2,
    brand: 'Peugeot',
    brandName: 'Peugeot',
    title: 'Document COC pour Peugeot',
    price: '336,00',
    rating: 4.5,
    reviews: 190,
    logoImage: '/peugeot.png',
  },
  {
    id: 3,
    brand: 'Audi',
    brandName: 'Audi',
    title: 'Document COC pour Audi',
    price: '264,00',
    rating: 4.5,
    reviews: 276,
    logoImage: '/audi.png',
  },
  {
    id: 4,
    brand: 'Citroën',
    brandName: 'Citroën',
    title: 'Papiers COC pour Citroën',
    price: '360,00',
    rating: 4,
    reviews: 113,
    logoImage: '/citroen.png',
  },
  {
    id: 5,
    brand: 'Opel',
    brandName: 'OPEL',
    title: 'Document COC pour OPEL',
    price: '311,00',
    rating: 4.5,
    reviews: 84,
    logoImage: '/opel.png',
  },
  {
    id: 6,
    brand: 'Skoda',
    brandName: 'Skoda',
    title: 'Document COC pour Skoda',
    price: '240,00',
    rating: 4,
    reviews: 54,
    logoImage: '/skoda.png',
  },
  {
    id: 7,
    brand: 'Mercedes-Benz',
    brandName: 'Mercedes-Benz',
    title: 'Papiers COC pour Mercedes-Benz',
    price: '360,00',
    rating: 3.5,
    reviews: 13,
    logoImage: '/mercedes.png',
  },
  {
    id: 8,
    brand: 'SEAT',
    brandName: 'SEAT',
    title: 'Papiers COC pour SEAT',
    price: '264,00',
    rating: 5,
    reviews: 9,
    logoImage: '/seat.png',
  },
  {
    id: 9,
    brand: 'Renault',
    brandName: 'Renault',
    title: 'Document COC pour Renault',
    price: '411,00',
    rating: 4.8,
    reviews: 342,
    logoImage: '/renault.png',
  },
  {
    id: 10,
    brand: 'BMW',
    brandName: 'BMW',
    title: 'Document COC pour BMW',
    price: '238,00',
    rating: 4.7,
    reviews: 267,
    logoImage: '/bmw.png',
  },
  {
    id: 11,
    brand: 'Ford',
    brandName: 'Ford',
    title: 'Papiers COC pour Ford',
    price: '360,00',
    rating: 4.3,
    reviews: 156,
    logoImage: '/ford.png',
  },
  {
    id: 12,
    brand: 'Toyota',
    brandName: 'Toyota',
    title: 'Document COC pour Toyota',
    price: '264,00',
    rating: 4.6,
    reviews: 198,
    logoImage: '/toyota.png',
  },
  {
    id: 13,
    brand: 'Fiat',
    brandName: 'Fiat',
    title: 'Papiers COC pour Fiat',
    price: '480,00',
    rating: 4.2,
    reviews: 87,
    logoImage: '/fiat.png',
  },
  {
    id: 14,
    brand: 'Nissan',
    brandName: 'Nissan',
    title: 'Document COC pour Nissan',
    price: '418,00',
    rating: 4.4,
    reviews: 124,
    logoImage: '/nissan.png',
  },
  {
    id: 15,
    brand: 'Hyundai',
    brandName: 'Hyundai',
    title: 'Document COC pour Hyundai',
    price: '300,00',
    rating: 4.1,
    reviews: 76,
    logoImage: '/hyundai.png',
  },
  {
    id: 16,
    brand: 'Kia',
    brandName: 'Kia',
    title: 'Papiers COC pour Kia',
    price: '364,00',
    rating: 4.3,
    reviews: 92,
    logoImage: '/kia.png',
  },
  {
    id: 17,
    brand: 'Mazda',
    brandName: 'Mazda',
    title: 'Document COC pour Mazda',
    price: '300,00',
    rating: 4.5,
    reviews: 68,
    logoImage: '/mazda.png',
  },
  {
    id: 18,
    brand: 'Volvo',
    brandName: 'Volvo',
    title: 'Papiers COC pour Volvo',
    price: '720,00',
    rating: 4.7,
    reviews: 145,
    logoImage: '/volvo.png',
  },
  {
    id: 19,
    brand: 'Mini',
    brandName: 'Mini',
    title: 'Document COC pour Mini',
    price: '240,00',
    rating: 4.6,
    reviews: 112,
    logoImage: '/mini.png',
  },
  {
    id: 20,
    brand: 'Jaguar',
    brandName: 'Jaguar',
    title: 'Papiers COC pour Jaguar',
    price: '324,00',
    rating: 4.8,
    reviews: 43,
    logoImage: '/jaguar.png',
  },
  {
    id: 21,
    brand: 'Land Rover',
    brandName: 'Land Rover',
    title: 'Document COC pour Land Rover',
    price: '324,00',
    rating: 4.7,
    reviews: 67,
    logoImage: '/landrover.png',
  },
  {
    id: 22,
    brand: 'Porsche',
    brandName: 'Porsche',
    title: 'Papiers COC pour Porsche',
    price: '600,00',
    rating: 4.9,
    reviews: 89,
    logoImage: '/Porsche.png',
  },
  {
    id: 23,
    brand: 'Tesla',
    brandName: 'Tesla',
    title: 'Document COC pour Tesla',
    price: '479,00',
    rating: 4.8,
    reviews: 156,
    logoImage: '/tesla.png',
  },
  {
    id: 24,
    brand: 'Dacia',
    brandName: 'Dacia',
    title: 'Papiers COC pour Dacia',
    price: '324,00',
    rating: 4.2,
    reviews: 234,
    logoImage: '/dacia.png',
  },
  {
    id: 25,
    brand: 'Suzuki',
    brandName: 'Suzuki',
    title: 'Document COC pour Suzuki',
    price: '324,00',
    rating: 4.3,
    reviews: 78,
    logoImage: '/suzuki.png',
  },
  {
    id: 26,
    brand: 'Mitsubishi',
    brandName: 'Mitsubishi',
    title: 'Papiers COC pour Mitsubishi',
    price: '330,00',
    rating: 4.1,
    reviews: 56,
    logoImage: '/Mitsubishi.png',
  },
  {
    id: 27,
    brand: 'Alfa Romeo',
    brandName: 'Alfa Romeo',
    title: 'Document COC pour Alfa Romeo',
    price: '480,00',
    rating: 4.4,
    reviews: 34,
    logoImage: '/alfa.png',
  },
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: sessionLoading } = useSupabaseSession()
  const brandSlug = params.brand as string
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [vin, setVin] = useState('')
  const [country, setCountry] = useState('')
  const [tvaNumber, setTvaNumber] = useState('')
  const [rectoFile, setRectoFile] = useState<File | null>(null)
  const [versoFile, setVersoFile] = useState<File | null>(null)
  
  // Client information fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [streetType, setStreetType] = useState('')
  const [streetName, setStreetName] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [carteGriseFile, setCarteGriseFile] = useState<File | null>(null)
  const [acceptResponsibility, setAcceptResponsibility] = useState(false)

  // Find product by brand slug (normalize for matching)
  const normalizeBrand = (brand: string) => brand.toLowerCase().replace(/\s+/g, '-').replace('ë', 'e').replace('é', 'e')
  const product = allProducts.find(p => normalizeBrand(p.brand) === brandSlug.toLowerCase())

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
          <Link href="/notre-mission" className="text-primary-600 hover:underline">
            Retour aux produits
          </Link>
        </div>
      </div>
    )
  }

  // Get image paths - only show main image, remove empty thumbnails
  const brandName = product.brand.toLowerCase().replace('ë', 'e').replace('é', 'e')
  const mainImage = product.logoImage
  // Only include main image - thumbnails are removed as they're empty
  const allImages = [mainImage]

  // Render stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative w-5 h-5">
            <Star className="w-5 h-5 fill-gray-200 text-gray-200 absolute" />
            <div className="absolute overflow-hidden w-2.5 h-5">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 fill-gray-200 text-gray-200" />
        ))}
      </div>
    )
  }

  const handleFileChange = (setter: (file: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!vin || vin.trim() === '' || vin.length !== 17) {
      alert('Le numéro VIN doit contenir exactement 17 caractères.')
      return
    }

    // Validate client information
    if (!firstName || !lastName || !email || !phone || !streetNumber || !streetType || !streetName || !postalCode || !city) {
      alert('Veuillez remplir tous les champs d\'information client.')
      return
    }

    // Validate carte grise upload
    if (!carteGriseFile) {
      alert('Veuillez uploader votre carte grise pour confirmer que vous êtes le propriétaire du véhicule.')
      return
    }

    // Validate pièce d'identité recto/verso (obligatoires)
    if (!rectoFile) {
      alert('Veuillez télécharger le recto de votre pièce d\'identité.')
      return
    }
    if (!versoFile) {
      alert('Veuillez télécharger le verso de votre pièce d\'identité.')
      return
    }

    // Validate responsibility checkbox
    if (!acceptResponsibility) {
      alert('Veuillez accepter la déclaration de responsabilité.')
      return
    }

    try {
      const price = parseFloat(product.price.replace(',', '.'))
      const fullAddress = `${streetNumber} ${streetType} ${streetName}`.trim()

      // Create order data
      const orderData = {
        type: 'coc' as const,
        vehicleData: {
          vin: vin.trim().toUpperCase(),
          make: product.brand,
        },
        serviceType: 'coc',
        price: price,
        metadata: {
          firstName,
          lastName,
          email,
          phone,
          streetNumber,
          streetType,
          streetName,
          address: fullAddress,
          postalCode,
          city,
          vin: vin.trim().toUpperCase(),
          country,
          tvaNumber,
          brand: product.brand,
          brandName: product.brandName,
        }
      }

      // Store all form data temporarily in localStorage for checkout-signup page
      const formDataToStore = {
        orderData,
        finalPrice: price,
      }
      
      localStorage.setItem('pendingOrderData', JSON.stringify(formDataToStore))
      
      // Check if user is already logged in
      // CASE 1: USER IS LOGGED IN
      if (user && !sessionLoading) {
        console.log('User logged in, uploading directly...')
        try {
          const result = await createOrder(orderData)
          if (!result.success || !result.order) {
            throw new Error(result.error || 'Erreur lors de la création de la commande')
          }

          const filesToUpload: Array<{ file: File; documentType: string }> = []
          if (carteGriseFile) filesToUpload.push({ file: carteGriseFile, documentType: 'carte_grise' })
          if (rectoFile) filesToUpload.push({ file: rectoFile, documentType: 'carte_identite_recto' })
          if (versoFile) filesToUpload.push({ file: versoFile, documentType: 'carte_identite_verso' })
          
          if (filesToUpload.length > 0) {
            await uploadDocuments(filesToUpload, result.order.id)
          }

          localStorage.setItem('currentOrderId', result.order.id)
          localStorage.setItem('currentOrderRef', result.order.reference)
          localStorage.setItem('currentOrderPrice', String(orderData.price))
          
          await createCheckoutAndRedirect(result.order.id, orderData.price)
          return
        } catch (error: any) {
          console.error('Erreur création commande:', error)
          alert('Erreur lors de la création de la commande: ' + (error.message || 'Une erreur est survenue'))
          return
        }
      }
      
      // CASE 2: GUEST USER
      console.log('Guest user, storing in IndexedDB...')
      localStorage.setItem('pendingOrderData', JSON.stringify({ orderData, finalPrice: price }))
      
      const filesToStore: Record<string, File> = {}
      if (carteGriseFile) filesToStore.carteGriseFile = carteGriseFile
      if (rectoFile) filesToStore.rectoFile = rectoFile
      if (versoFile) filesToStore.versoFile = versoFile
      
      await saveFilesToIndexedDB(filesToStore)
      router.push('/checkout-signup')

    } catch (error: any) {
      console.error('Erreur soumission:', error)
      alert(error.message || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
            {/* Left Column: Images */}
            <div>
              {/* Main Image */}
              <div className="mb-4">
                <div className="relative w-full aspect-square bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src={allImages[selectedImage]}
                    alt={`${product.brandName} - Image ${selectedImage + 1}`}
                    width={600}
                    height={600}
                    className="object-contain w-full h-full p-12"
                    onError={(e) => {
                      // Fallback to main logo if thumbnail doesn't exist
                      if (selectedImage > 0) {
                        e.currentTarget.src = mainImage
                      }
                    }}
                  />
                </div>
              </div>

              {/* Thumbnails removed - only showing main image */}
            </div>

            {/* Right Column: Product Details */}
            <div>
              {/* Product Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {product.title} (Certificat de Conformité)
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-5">
                {renderStars(product.rating)}
                <span className="text-sm text-gray-700">{product.reviews} avis</span>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  €{product.price} EUR
                </div>
                <p className="text-sm text-gray-500">
                  Taxes incluses. Frais d'expédition calculés à l'étape de paiement.
                </p>
              </div>

              {/* Order Form */}
              <form onSubmit={handleSubmit} className="space-y-5 mb-8">
                {/* VIN Number */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-900 mb-2">
                    Numéro d'identification du véhicule (VIN) à 17 chiffres
                    <div className="w-4 h-4 ml-2 rounded-full bg-gray-300 flex items-center justify-center cursor-help">
                      <Info className="w-3 h-3 text-gray-600" />
                    </div>
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    maxLength={17}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    placeholder=""
                    required
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Pour quel pays avez-vous besoin du document?
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    placeholder=""
                    required
                  />
                </div>

                {/* TVA Number */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-900 mb-2">
                    Numéro d'identification TVA (optionnel)
                    <div className="w-4 h-4 ml-2 rounded-full bg-gray-300 flex items-center justify-center cursor-help">
                      <Info className="w-3 h-3 text-gray-600" />
                    </div>
                  </label>
                  <input
                    type="text"
                    value={tvaNumber}
                    onChange={(e) => setTvaNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    placeholder=""
                  />
                </div>

                {/* File Upload - Recto */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-900 mb-2">
                    Certificat d'immatriculation - recto
                    <div className="w-4 h-4 ml-2 rounded-full bg-gray-300 flex items-center justify-center cursor-help">
                      <Info className="w-3 h-3 text-gray-600" />
                    </div>
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer">
                      <span className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors">
                        Choisir un fichier
                      </span>
                      <input
                        type="file"
                        name="recto"
                        onChange={handleFileChange(setRectoFile)}
                        className="hidden"
                        accept="image/*,.pdf"
                      />
                    </label>
                    <span className="text-sm text-gray-500">
                      {rectoFile ? rectoFile.name : 'Aucun fichier choisi'}
                    </span>
                  </div>
                </div>

                {/* File Upload - Verso */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-900 mb-2">
                    Certificat d'immatriculation - verso
                    <div className="w-4 h-4 ml-2 rounded-full bg-gray-300 flex items-center justify-center cursor-help">
                      <Info className="w-3 h-3 text-gray-600" />
                    </div>
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer">
                      <span className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors">
                        Choisir un fichier
                      </span>
                      <input
                        type="file"
                        name="verso"
                        onChange={handleFileChange(setVersoFile)}
                        className="hidden"
                        accept="image/*,.pdf"
                      />
                    </label>
                    <span className="text-sm text-gray-500">
                      {versoFile ? versoFile.name : 'Aucun fichier choisi'}
                    </span>
                  </div>
                </div>

                {/* Client Information Section */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Vos informations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={streetNumber}
                        onChange={(e) => setStreetNumber(e.target.value)}
                        placeholder="N°"
                        required
                        className="px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                      <select
                        value={streetType}
                        onChange={(e) => setStreetType(e.target.value)}
                        required
                        className="px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      >
                        <option value="" disabled>Type</option>
                        <option value="Rue">Rue</option>
                        <option value="Avenue">Avenue</option>
                        <option value="Boulevard">Boulevard</option>
                        <option value="Place">Place</option>
                        <option value="Chemin">Chemin</option>
                        <option value="Allée">Allée</option>
                        <option value="Autre">Autre</option>
                      </select>
                      <input
                        type="text"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        placeholder="Nom de la rue"
                        required
                        className="px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Carte Grise Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carte grise du véhicule *
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Veuillez uploader votre carte grise pour confirmer que vous êtes le propriétaire du véhicule.
                    </p>
                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer">
                        <span className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors">
                          Choisir un fichier
                        </span>
                        <input
                          type="file"
                          name="carteGrise"
                          onChange={handleFileChange(setCarteGriseFile)}
                          className="hidden"
                          accept="image/*,.pdf"
                        />
                      </label>
                      <span className="text-sm text-gray-500">
                        {carteGriseFile ? carteGriseFile.name : 'Aucun fichier choisi'}
                      </span>
                    </div>
                  </div>

                  {/* Responsibility Checkbox */}
                  <div className="mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptResponsibility}
                        onChange={(e) => setAcceptResponsibility(e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">
                        J'assume la responsabilité totale de cette commande de document COC. 
                        Je certifie être le propriétaire légitime du véhicule identifié par le VIN <strong>{vin.toUpperCase() || 'XXXXX'}</strong> et que toutes les informations fournies sont exactes. Je comprends que ce document est soumis 
                        aux réglementations en vigueur et que toute utilisation frauduleuse est passible de sanctions pénales. *
                      </span>
                    </label>
                  </div>
                </div>

                {/* Order Button */}
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3.5 px-6 rounded font-semibold text-base hover:bg-gray-800 transition-colors"
                >
                  Commander
                </button>
              </form>

              {/* Features List */}
              <div className="mb-8">
                <ul className="space-y-1.5 text-sm text-gray-900 list-disc list-inside">
                  <li className="font-bold">Document original de {product.brandName}</li>
                  <li className="font-bold">accepté dans tous les pays de l'UE et dans d'autres pays (CH, UK, ...)</li>
                  <li className="font-bold">facile & rapide à commander</li>
                  <li className="font-bold">prix avantageux</li>
                  <li className="font-bold">processus de paiement sécurisé</li>
                  <li className="font-bold">Garantie de remboursement</li>
                  <li className="font-bold">PDF gratuit au préalable (délai de livraison d'environ 5-7 jours)</li>
                </ul>
              </div>

              {/* Additional Information */}
              <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
                <p>
                  Veuillez saisir le numéro de châssis (VIN) à 17 chiffres de votre véhicule dans le champ de saisie ci-dessus. Cette information est suffisante pour identifier votre véhicule. Veillez à ce que le numéro soit correct.
                </p>
                <p>
                  Vous pouvez également indiquer l'année de construction en option, mais ce n'est pas nécessaire pour la commande.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

