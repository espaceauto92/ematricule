'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Flag, Percent, Truck, Star } from 'lucide-react'
import Image from 'next/image'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'
import { createOrder, uploadDocuments, createCheckoutAndRedirect } from '@/lib/services/orderService'
import { saveFilesToIndexedDB } from '@/lib/utils/storage'

export default function PlaqueImmatriculationPage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSupabaseSession()
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [registrationNumberError, setRegistrationNumberError] = useState<string | null>(null)
  const [plaqueType, setPlaqueType] = useState<string | null>(null)
  const [material, setMaterial] = useState('plexiglass')
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [fixingMode, setFixingMode] = useState<string | null>(null)
  const [textOption, setTextOption] = useState('no-text')
  const [customText, setCustomText] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [regionLogoError, setRegionLogoError] = useState(false)
  const [euFlagError, setEuFlagError] = useState(false)
  
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

  // Region logos mapping (local files in public/regions/)
  const regionLogos: { [key: string]: string } = {
    'auvergne-rhone-alpes': '/d1.jpeg',
    'bourgogne-franche-comte': '/d2.jpeg',
    'bretagne': '/d3.jpeg',
    'centre-val-de-loire': '/d4.jpeg',
    'corse': '/d5.jpeg',
    'grand-est': '/d6.jpeg',
    'hauts-de-france': '/d7.jpeg',
    'ile-de-france': '/d8.jpeg',
    'normandie': '/d9.jpeg',
    'nouvelle-aquitaine': '/d10.jpeg',
    'occitanie': '/d11.jpeg',
    'pays-de-la-loire': '/d12.jpeg',
    'paca': '/d13.jpeg',
    'guadeloupe': '/d14.jpeg',
    'martinique': '/d15.jpeg',
    'guyane': '/d16.jpeg',
    'la-reunion': '/d17.jpeg',
    'mayotte': '/d18.jpeg',
  }

  // Department to region mapping
  const getRegionLogo = (deptCode: string): string => {
    const regionMap: { [key: string]: string } = {
      // Auvergne–Rhône–Alpes
      '01': 'auvergne-rhone-alpes', '03': 'auvergne-rhone-alpes', '07': 'auvergne-rhone-alpes',
      '15': 'auvergne-rhone-alpes', '26': 'auvergne-rhone-alpes', '38': 'auvergne-rhone-alpes',
      '42': 'auvergne-rhone-alpes', '43': 'auvergne-rhone-alpes', '63': 'auvergne-rhone-alpes',
      '69': 'auvergne-rhone-alpes', '73': 'auvergne-rhone-alpes', '74': 'auvergne-rhone-alpes',
      // Bourgogne–Franche–Comté
      '21': 'bourgogne-franche-comte', '25': 'bourgogne-franche-comte', '39': 'bourgogne-franche-comte',
      '58': 'bourgogne-franche-comte', '70': 'bourgogne-franche-comte', '71': 'bourgogne-franche-comte',
      '89': 'bourgogne-franche-comte', '90': 'bourgogne-franche-comte',
      // Bretagne
      '22': 'bretagne', '29': 'bretagne', '35': 'bretagne', '56': 'bretagne',
      // Centre–Val de Loire
      '18': 'centre-val-de-loire', '28': 'centre-val-de-loire', '36': 'centre-val-de-loire',
      '37': 'centre-val-de-loire', '41': 'centre-val-de-loire', '45': 'centre-val-de-loire',
      // Corse
      '2A': 'corse', '2B': 'corse',
      // Grand Est
      '08': 'grand-est', '10': 'grand-est', '51': 'grand-est', '52': 'grand-est',
      '54': 'grand-est', '55': 'grand-est', '57': 'grand-est', '67': 'grand-est',
      '68': 'grand-est', '88': 'grand-est',
      // Hauts-de-France
      '02': 'hauts-de-france', '59': 'hauts-de-france', '60': 'hauts-de-france',
      '62': 'hauts-de-france', '80': 'hauts-de-france',
      // Île-de-France
      '75': 'ile-de-france', '77': 'ile-de-france', '78': 'ile-de-france',
      '91': 'ile-de-france', '92': 'ile-de-france', '93': 'ile-de-france',
      '94': 'ile-de-france', '95': 'ile-de-france',
      // Normandie
      '14': 'normandie', '27': 'normandie', '50': 'normandie', '61': 'normandie', '76': 'normandie',
      // Nouvelle-Aquitaine
      '16': 'nouvelle-aquitaine', '17': 'nouvelle-aquitaine', '19': 'nouvelle-aquitaine',
      '23': 'nouvelle-aquitaine', '24': 'nouvelle-aquitaine', '33': 'nouvelle-aquitaine',
      '40': 'nouvelle-aquitaine', '47': 'nouvelle-aquitaine', '64': 'nouvelle-aquitaine',
      '79': 'nouvelle-aquitaine', '86': 'nouvelle-aquitaine', '87': 'nouvelle-aquitaine',
      // Occitanie
      '09': 'occitanie', '11': 'occitanie', '12': 'occitanie', '30': 'occitanie',
      '31': 'occitanie', '32': 'occitanie', '34': 'occitanie', '46': 'occitanie',
      '48': 'occitanie', '65': 'occitanie', '66': 'occitanie', '81': 'occitanie', '82': 'occitanie',
      // Pays de la Loire
      '44': 'pays-de-la-loire', '49': 'pays-de-la-loire', '53': 'pays-de-la-loire',
      '72': 'pays-de-la-loire', '85': 'pays-de-la-loire',
      // Provence–Alpes–Côte d'Azur
      '04': 'paca', '05': 'paca', '06': 'paca', '13': 'paca', '83': 'paca', '84': 'paca',
      // DROM
      '971': 'guadeloupe',
      '972': 'martinique',
      '973': 'guyane',
      '974': 'la-reunion',
      '976': 'mayotte',
    }
    const region = regionMap[deptCode] || 'ile-de-france'
    return regionLogos[region] || ''
  }

  // French departments (1-95)
  const departments = [
    { code: '01', name: 'Ain' },
    { code: '02', name: 'Aisne' },
    { code: '03', name: 'Allier' },
    { code: '04', name: 'Alpes-de-Haute-Provence' },
    { code: '05', name: 'Hautes-Alpes' },
    { code: '06', name: 'Alpes-Maritimes' },
    { code: '07', name: 'Ardèche' },
    { code: '08', name: 'Ardennes' },
    { code: '09', name: 'Ariège' },
    { code: '10', name: 'Aube' },
    { code: '11', name: 'Aude' },
    { code: '12', name: 'Aveyron' },
    { code: '13', name: 'Bouches-du-Rhône' },
    { code: '14', name: 'Calvados' },
    { code: '15', name: 'Cantal' },
    { code: '16', name: 'Charente' },
    { code: '17', name: 'Charente-Maritime' },
    { code: '18', name: 'Cher' },
    { code: '19', name: 'Corrèze' },
    { code: '21', name: 'Côte-d\'Or' },
    { code: '22', name: 'Côtes-d\'Armor' },
    { code: '23', name: 'Creuse' },
    { code: '24', name: 'Dordogne' },
    { code: '25', name: 'Doubs' },
    { code: '26', name: 'Drôme' },
    { code: '27', name: 'Eure' },
    { code: '28', name: 'Eure-et-Loir' },
    { code: '29', name: 'Finistère' },
    { code: '30', name: 'Gard' },
    { code: '31', name: 'Haute-Garonne' },
    { code: '32', name: 'Gers' },
    { code: '33', name: 'Gironde' },
    { code: '34', name: 'Hérault' },
    { code: '35', name: 'Ille-et-Vilaine' },
    { code: '36', name: 'Indre' },
    { code: '37', name: 'Indre-et-Loire' },
    { code: '38', name: 'Isère' },
    { code: '39', name: 'Jura' },
    { code: '40', name: 'Landes' },
    { code: '41', name: 'Loir-et-Cher' },
    { code: '42', name: 'Loire' },
    { code: '43', name: 'Haute-Loire' },
    { code: '44', name: 'Loire-Atlantique' },
    { code: '45', name: 'Loiret' },
    { code: '46', name: 'Lot' },
    { code: '47', name: 'Lot-et-Garonne' },
    { code: '48', name: 'Lozère' },
    { code: '49', name: 'Maine-et-Loire' },
    { code: '50', name: 'Manche' },
    { code: '51', name: 'Marne' },
    { code: '52', name: 'Haute-Marne' },
    { code: '53', name: 'Mayenne' },
    { code: '54', name: 'Meurthe-et-Moselle' },
    { code: '55', name: 'Meuse' },
    { code: '56', name: 'Morbihan' },
    { code: '57', name: 'Moselle' },
    { code: '58', name: 'Nièvre' },
    { code: '59', name: 'Nord' },
    { code: '60', name: 'Oise' },
    { code: '61', name: 'Orne' },
    { code: '62', name: 'Pas-de-Calais' },
    { code: '63', name: 'Puy-de-Dôme' },
    { code: '64', name: 'Pyrénées-Atlantiques' },
    { code: '65', name: 'Hautes-Pyrénées' },
    { code: '66', name: 'Pyrénées-Orientales' },
    { code: '67', name: 'Bas-Rhin' },
    { code: '68', name: 'Haut-Rhin' },
    { code: '69', name: 'Rhône' },
    { code: '70', name: 'Haute-Saône' },
    { code: '71', name: 'Saône-et-Loire' },
    { code: '72', name: 'Sarthe' },
    { code: '73', name: 'Savoie' },
    { code: '74', name: 'Haute-Savoie' },
    { code: '75', name: 'Paris' },
    { code: '76', name: 'Seine-Maritime' },
    { code: '77', name: 'Seine-et-Marne' },
    { code: '78', name: 'Yvelines' },
    { code: '79', name: 'Deux-Sèvres' },
    { code: '80', name: 'Somme' },
    { code: '81', name: 'Tarn' },
    { code: '82', name: 'Tarn-et-Garonne' },
    { code: '83', name: 'Var' },
    { code: '84', name: 'Vaucluse' },
    { code: '85', name: 'Vendée' },
    { code: '86', name: 'Vienne' },
    { code: '87', name: 'Haute-Vienne' },
    { code: '88', name: 'Vosges' },
    { code: '89', name: 'Yonne' },
    { code: '90', name: 'Territoire de Belfort' },
    { code: '91', name: 'Essonne' },
    { code: '92', name: 'Hauts-de-Seine' },
    { code: '93', name: 'Seine-Saint-Denis' },
    { code: '94', name: 'Val-de-Marne' },
    { code: '95', name: 'Val-d\'Oise' },
    { code: '2A', name: 'Corse-du-Sud' },
    { code: '2B', name: 'Haute-Corse' },
    { code: '971', name: 'Guadeloupe' },
    { code: '972', name: 'Martinique' },
    { code: '973', name: 'Guyane' },
    { code: '974', name: 'La Réunion' },
    { code: '976', name: 'Mayotte' },
  ]

  const fixingModes = [
    { id: 'rivets', name: '2 rivets', size: '4x20mm', price: 'Gratuit', image: '/simple.png' },
    { id: 'rivets-premium', name: '2 rivets premium', size: '4x20mm', price: '1,90 €', image: '/premium.png' },
    { id: 'rivets-premium-noirs', name: '2 rivets premium noirs', size: '4x20mm', price: '1,90 €', image: '/noire.png' },
    { id: 'kit-pose', name: 'Kit pose', additional: '+ 2 rivets premium', size: '', price: '14,90 €', image: '/kitpose.png' },
  ]

  const handleRegistrationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-alphanumeric characters (including dashes) and convert to uppercase
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    
    // Allow up to 7 characters
    const cleaned = value.slice(0, 7)
    
    setRegistrationNumber(cleaned)
    
    // Validate format: AA123AA (2 letters, 3 digits, 2 letters)
    if (cleaned.length > 0) {
      const formatRegex = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/
      if (cleaned.length === 7 && formatRegex.test(cleaned)) {
        setRegistrationNumberError(null)
      } else if (cleaned.length === 7) {
        setRegistrationNumberError('Le format doit être AA-123-AA (2 lettres, 3 chiffres, 2 lettres)')
      } else {
        setRegistrationNumberError('Le numéro doit contenir 7 caractères (2 lettres, 3 chiffres, 2 lettres)')
      }
    } else {
      setRegistrationNumberError(null)
    }
    
    // Reset image error states when registration changes
    setRegionLogoError(false)
    setEuFlagError(false)
  }

  // Format registration number for display (AA-123-AB)
  const formatRegistrationNumber = (num: string): string => {
    if (!num) return 'AA-123-AB'
    // Remove all non-alphanumeric characters
    const cleaned = num.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    // Format as AA-123-AB (2 letters, 3 digits, 2 letters)
    if (cleaned.length <= 2) {
      return cleaned
    } else if (cleaned.length <= 5) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
    } else {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!registrationNumber || registrationNumber.trim() === '') {
      setRegistrationNumberError('Le numéro d\'immatriculation est obligatoire.')
      alert('Le numéro d\'immatriculation est obligatoire.')
      return
    }
    
    // Validate format: must be exactly 7 characters (2 letters, 3 digits, 2 letters)
    const cleaned = registrationNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const formatRegex = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/
    if (cleaned.length !== 7 || !formatRegex.test(cleaned)) {
      setRegistrationNumberError('Le numéro d\'immatriculation doit être au format AA-123-AA (2 lettres, 3 chiffres, 2 lettres).')
      alert('Le numéro d\'immatriculation doit être au format AA-123-AA (2 lettres, 3 chiffres, 2 lettres).')
      return
    }
    
    // Clear error if format is valid
    setRegistrationNumberError(null)
    
    if (!plaqueType) {
      alert('Veuillez sélectionner le type de plaque.')
      return
    }
    
    if (plaqueType !== 'ww-provisoire' && !selectedDepartment) {
      alert('Veuillez sélectionner un département.')
      return
    }

    // Validate client information
    if (!firstName || !lastName || !email || !phone || !streetNumber || !streetType || !streetName || !postalCode || !city) {
      alert('Veuillez remplir tous les champs d\'information client.')
      return
    }

    // Validate carte grise upload
    if (!carteGriseFile) {
      alert('Veuillez télécharger la carte grise afin de confirmer que vous êtes le propriétaire du véhicule.')
      return
    }

    // Validate responsibility checkbox
    if (!acceptResponsibility) {
      alert('Veuillez accepter la déclaration de responsabilité.')
      return
    }

    try {
      const basePrice = calculatePlatePrice()
      const deliveryPrice = getDeliveryPrice()
      const totalPrice = basePrice + deliveryPrice

      const fullAddress = `${streetNumber} ${streetType} ${streetName}`.trim()
      
      // Create order data with all metadata
      const orderData = {
        type: 'plaque' as const,
        vehicleData: {
          registrationNumber: registrationNumber.trim().toUpperCase().replace(/\s+/g, ''),
        },
        serviceType: 'plaque-immatriculation',
        price: totalPrice,
        plaqueType, // Add plaqueType at top level for database column
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
          registrationNumber: registrationNumber.trim().toUpperCase().replace(/\s+/g, ''),
          plaqueType,
          material,
          department: plaqueType !== 'ww-provisoire' ? selectedDepartment : null,
          fixingMode,
          textOption,
          customText: textOption === 'custom' ? customText : '',
          quantity,
          basePrice,
          calculatedPrice: totalPrice,
        }
      }

      // Store all form data temporarily in localStorage for checkout-signup page
      const formDataToStore = {
        orderData,
        finalPrice: totalPrice,
      }
      
      localStorage.      // CASE 1: USER IS LOGGED IN
      if (user && !sessionLoading) {
        console.log('User logged in, uploading directly...')
        const result = await createOrder(orderData)
        
        if (!result.success || !result.order) {
          throw new Error(result.error || 'Erreur lors de la création de la commande')
        }

        if (carteGriseFile) {
          await uploadDocuments([{ file: carteGriseFile, documentType: 'carte_grise' }], result.order.id)
        }
        
        localStorage.setItem('currentOrderId', result.order.id)
        localStorage.setItem('currentOrderRef', result.order.reference)
        localStorage.setItem('currentOrderPrice', String(orderData.price))
        
        await createCheckoutAndRedirect(result.order.id, orderData.price)
        return
      }
      
      // CASE 2: GUEST USER
      console.log('Guest user, storing in IndexedDB...')
      localStorage.setItem('pendingOrderData', JSON.stringify({ orderData, finalPrice: totalPrice }))
      
      if (carteGriseFile) {
        await saveFilesToIndexedDB({ carteGriseFile })
      }
      
      router.push('/checkout-signup')
or.message || 'Une erreur est survenue'))
        }
        return
      }

    } catch (error: any) {
      console.error('Erreur soumission:', error)
      alert(error.message || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  // Tarifs: WW 15€, Permanente 10€, Livraison 5€ (constants pour éviter tout bug d'affichage)
  const PLATE_PRICE_WW_EUR = 15
  const PLATE_PRICE_PERMANENTE_EUR = 10
  const DELIVERY_PRICE_EUR = 5

  const calculatePlatePrice = (): number => {
    if (!plaqueType) return 0
    const base =
      plaqueType === 'ww-provisoire'
        ? PLATE_PRICE_WW_EUR
        : plaqueType === 'permanente'
          ? PLATE_PRICE_PERMANENTE_EUR
          : 0
    let platePrice = base
    if (textOption === 'website') platePrice -= 1.0
    else if (textOption === 'custom') platePrice += 1.5
    if (fixingMode === 'rivets-premium' || fixingMode === 'rivets-premium-noirs') platePrice += 1.9
    else if (fixingMode === 'kit-pose') platePrice += 14.9
    return platePrice * quantity
  }

  const getDeliveryPrice = (): number => DELIVERY_PRICE_EUR

  const calculateTotal = (): string => {
    const platePrice = calculatePlatePrice()
    const deliveryPrice = getDeliveryPrice()
    const total = platePrice + deliveryPrice
    return total.toFixed(2).replace('.', ',')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 py-3 text-sm font-medium">
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4" />
              <span>Made in France</span>
            </div>
            <div className="flex items-center space-x-2">
              <Percent className="w-4 h-4" />
              <span>Economisez jusqu'à 50%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4" />
              <span>Livraison en 24/48h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Matériaux haut de gamme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Title and Description */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-block mb-4">
              <span className="bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                Commande en ligne
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Quelles plaques souhaitez-vous commander ?
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Toutes nos plaques d'immatriculation sont fabriquées en France avec des matériaux de haute qualité.
            </p>
            <p className="text-base text-gray-500 max-w-3xl mx-auto leading-relaxed mt-3">
              La production et l'expédition sont réalisées sous 24h.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Step 1: Registration Number */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>
              <div className="absolute top-6 right-6">
                <span className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-full font-semibold">
                  Obligatoire
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-6 md:pr-32">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Indiquez le numéro d'immatriculation
                  </h2>
                  
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formatRegistrationNumber(registrationNumber)}
                        onChange={handleRegistrationNumberChange}
                        placeholder="AA-123-AA"
                        maxLength={9}
                        className={`w-full px-6 py-4 md:py-5 text-lg border-2 rounded-xl focus:ring-4 focus:ring-opacity-20 outline-none transition-all duration-200 placeholder:text-gray-400 uppercase tracking-wider font-semibold ${
                          registrationNumberError
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 bg-gray-50 focus:border-primary-500 focus:ring-primary-500 focus:bg-white'
                        }`}
                        required
                      />
                      {registrationNumberError ? (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {registrationNumberError}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">
                          Format: 2 lettres, 3 chiffres, 2 lettres (ex: AA-123-AA)
                        </p>
                      )}
                    </div>
                    
                    <div className="lg:w-72">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                        Exemples possibles
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 px-4 py-3 rounded-xl border border-primary-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-base font-bold text-gray-900">AA-123-AA</div>
                          <div className="text-xs text-gray-600 mt-1">Numéro actuel</div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-base font-bold text-gray-900">123 ABC 01</div>
                          <div className="text-xs text-gray-600 mt-1">Ancien numéro</div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-base font-bold text-gray-900">LIVRAISON</div>
                          <div className="text-xs text-gray-600 mt-1">Texte libre</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Plaque Type */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>
              <div className="absolute top-6 right-6">
                <span className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-full font-semibold">
                  Obligatoire
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-6 md:pr-32">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Choisissez le type de votre plaque
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                    <button
                      type="button"
                      onClick={() => setPlaqueType('permanente')}
                      className={`relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                        plaqueType === 'permanente'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-lg ring-2 ring-primary-200'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                      }`}
                    >
                      {/* Radio button in top right corner */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          plaqueType === 'permanente'
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {plaqueType === 'permanente' && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Image */}
                      <div className="mb-4 mt-1 flex justify-center">
                        <div className="relative w-full max-w-[240px] h-20 sm:h-24 md:h-28 overflow-hidden">
                          <Image
                            src="/permanente.png"
                            alt="Plaque permanente"
                            width={520}
                            height={110}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Type Info */}
                      <h3 className={`font-semibold text-lg mb-1 ${plaqueType === 'permanente' ? 'text-primary-600' : 'text-gray-900'}`}>
                        Permanente
                      </h3>
                      <p className="text-sm text-gray-600">
                        Plaque d'immatriculation permanente
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlaqueType('ww-provisoire')}
                      className={`relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                        plaqueType === 'ww-provisoire'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-lg ring-2 ring-primary-200'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                      }`}
                    >
                      {/* Radio button in top right corner */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          plaqueType === 'ww-provisoire'
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {plaqueType === 'ww-provisoire' && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Image */}
                      <div className="mb-4 mt-1 flex justify-center">
                        <div className="relative w-full max-w-[240px] h-20 sm:h-24 md:h-28 overflow-hidden">
                          <Image
                            src="/provisoire.png"
                            alt="Plaque WW provisoire"
                            width={520}
                            height={110}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Type Info */}
                      <h3 className={`font-semibold text-lg mb-1 ${plaqueType === 'ww-provisoire' ? 'text-primary-600' : 'text-gray-900'}`}>
                        WW provisoire
                      </h3>
                      <p className="text-sm text-gray-600">
                        Plaque d'immatriculation provisoire WW
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Material */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>
              <div className="absolute top-6 right-6">
                <CheckCircle className="w-7 h-7 text-primary-600" />
              </div>
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-6 md:pr-20">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Choisissez le matériau
                  </h2>
                  
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => setMaterial('plexiglass')}
                      className={`relative p-6 md:p-7 rounded-2xl border-2 transition-all duration-300 text-left w-full sm:w-[320px] transform hover:scale-[1.02] ${
                        material === 'plexiglass'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-lg ring-2 ring-primary-200'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                      }`}
                    >
                      {/* Radio button in top right corner */}
                      <div className="absolute top-3 right-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          material === 'plexiglass'
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {material === 'plexiglass' && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* License Plate Image */}
                      <div className="mb-3 mt-1">
                        <div className="relative aspect-[520/110] overflow-hidden">
                          {/* License Plate Image */}
                          <Image
                            src="/p.png"
                            alt="Plexiglass auto plaque"
                            width={520}
                            height={110}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Material Info */}
                      <h3 className={`font-semibold text-base mb-1.5 ${material === 'plexiglass' ? 'text-primary-600' : 'text-gray-900'}`}>
                        Plexiglass auto
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        520x110mm
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Department Selection - Hidden for temporary plates */}
            {plaqueType !== 'ww-provisoire' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
              <div className="absolute top-5 right-5">
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                  Obligatoire
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-6 pr-32">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">4</span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Choisissez la région et le département
                  </h2>
                  
                  {/* Scrollable Department List */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                      {departments.map((dept) => (
                        <button
                          key={dept.code}
                          type="button"
                          onClick={() => {
                            setSelectedDepartment(dept.code)
                            setRegionLogoError(false)
                          }}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center space-x-2 sm:space-x-3 border-b border-gray-100 last:border-b-0 transition-all hover:bg-gray-50 ${
                          selectedDepartment === dept.code
                            ? 'bg-primary-50 border-l-4 border-l-primary-600'
                            : 'bg-white'
                          }`}
                        >
                          {/* Department Logo (Region Logo) */}
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                            <Image
                              src={getRegionLogo(dept.code)}
                              alt={`Logo ${dept.name}`}
                              width={32}
                              height={32}
                              className="object-contain w-full h-full"
                              onError={(e) => {
                                // Hide image if it doesn't exist
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          
                          {/* Department Info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className={`font-semibold text-xs sm:text-sm ${
                              selectedDepartment === dept.code
                                ? 'text-primary-600'
                                : 'text-gray-900'
                            }`}>
                              <span className="hidden sm:inline">{dept.code} - </span>{dept.name}
                            </div>
                          </div>
                          
                          {/* Selection Indicator */}
                          {selectedDepartment === dept.code && (
                            <div className="flex-shrink-0">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Step 5: Fixing Mode (Step 4 when department selection is hidden) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
              <div className="absolute top-5 right-5">
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                  Obligatoire
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-6 pr-32">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">{plaqueType !== 'ww-provisoire' ? '5' : '4'}</span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Choisissez le mode de fixation
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fixingModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFixingMode(mode.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                          fixingMode === mode.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Radio button in top right */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            fixingMode === mode.id
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {fixingMode === mode.id && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>

                        {/* Image */}
                        <div className="mb-3 mt-1 flex items-center justify-center">
                          <div className="w-full h-20 max-w-[120px]">
                            <Image
                              src={mode.image}
                              alt={mode.name}
                              width={100}
                              height={80}
                              className="object-contain w-full h-full"
                              onError={(e) => {
                                // Fallback if image doesn't exist
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <h3 className={`font-semibold text-sm mb-1 ${fixingMode === mode.id ? 'text-primary-600' : 'text-gray-900'}`}>
                          {mode.name}
                        </h3>
                        {mode.additional && (
                          <p className="text-xs text-gray-600 mb-1">
                            {mode.additional}
                          </p>
                        )}
                        {mode.size && (
                          <p className="text-xs text-gray-600 mb-2">
                            {mode.size}
                          </p>
                        )}
                        <p className={`text-base font-bold ${fixingMode === mode.id ? 'text-primary-600' : 'text-gray-900'}`}>
                          {mode.price}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6: Add Text Under Plate (Step 5 when department selection is hidden) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
              <div className="absolute top-5 right-5">
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                  Obligatoire
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-6 md:pr-32">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">{plaqueType !== 'ww-provisoire' ? '6' : '5'}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Ajoutez un texte sous votre plaque
                  </h2>
                  
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setTextOption('no-text')}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                        textOption === 'no-text'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className={`font-medium ${textOption === 'no-text' ? 'text-primary-600' : 'text-gray-700'}`}>
                        Pas de texte
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        textOption === 'no-text'
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {textOption === 'no-text' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTextOption('website')}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                        textOption === 'website'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium ${textOption === 'website' ? 'text-primary-600' : 'text-gray-700'}`}>
                          Ajouter www.ematricule.fr
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          -1,00 € / plaque
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        textOption === 'website'
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {textOption === 'website' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTextOption('custom')}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                        textOption === 'custom'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium ${textOption === 'custom' ? 'text-primary-600' : 'text-gray-700'}`}>
                          Texte personnalisé
                        </span>
                        <span className="text-sm text-red-600 font-medium">
                          +1,50 € / plaque
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        textOption === 'custom'
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {textOption === 'custom' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {textOption === 'custom' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Entrez votre texte personnalisé"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-600 focus:ring-opacity-20 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 7: Quantity (Step 6 when department selection is hidden) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
              <div className="absolute top-5 right-5">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              
              <div className="flex items-start space-x-5 md:space-x-6 pr-20">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">{plaqueType !== 'ww-provisoire' ? '7' : '6'}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Quantité
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner la quantité
                    </label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-600 focus:ring-opacity-20 outline-none transition-all appearance-none bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'plaque' : 'plaques'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 8: Plate Preview (Step 7 when department selection is hidden) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
              <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 space-x-5 md:space-x-6">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-xl border-2 border-white/20 backdrop-blur-sm">
                    <span className="relative z-10">{plaqueType !== 'ww-provisoire' ? '8' : '7'}</span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Visuel de votre plaque
                  </h2>
                  
                  {/* License Plate Preview */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative border-2 border-gray-400 rounded-md overflow-hidden shadow-xl w-full max-w-[95vw] sm:max-w-[520px]" style={{ aspectRatio: '520/110' }}>
                      {/* Left EU band with f.jpg */}
                      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 flex items-center justify-center">
                        {!euFlagError ? (
                        <Image
                            src="/f.jpg"
                          alt="EU band with F"
                            width={64}
                          height={110}
                          className="w-full h-[60%] object-contain"
                            style={{ filter: 'brightness(1.15) contrast(1.1)' }}
                            onError={() => setEuFlagError(true)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full w-full">
                            <div className="flex items-center justify-center mb-0.5">
                              <div className="grid grid-cols-3 gap-0.5">
                                {[...Array(12)].map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 bg-yellow-200 rounded-sm shadow-sm" style={{ filter: 'brightness(1.3)' }}></div>
                                ))}
                              </div>
                            </div>
                            <div className="text-white font-bold text-xs sm:text-sm md:text-lg leading-none drop-shadow-lg" style={{ filter: 'brightness(1.2)', textShadow: '0 0 2px rgba(255,255,255,0.8)' }}>F</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Main plate area with registration number */}
                      <div className="absolute left-[3.5rem] sm:left-16 right-[3.5rem] sm:right-14 top-0 bottom-0 flex items-center justify-center bg-white">
                        <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black tracking-[0.1em] sm:tracking-[0.2em] font-mono select-none">
                          {formatRegistrationNumber(registrationNumber)}
                        </div>
                      </div>
                      
                      {/* Right band with region logo and department number */}
                      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-14 bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 flex flex-col overflow-hidden">
                        {plaqueType !== 'ww-provisoire' && selectedDepartment ? (
                          <>
                            {/* Top part: Region logo */}
                            <div className="flex-1 flex items-center justify-center p-1 min-h-0">
                              {!regionLogoError ? (
                                <Image
                                  src={getRegionLogo(selectedDepartment)}
                                  alt="Region logo"
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-contain"
                                  onError={() => setRegionLogoError(true)}
                                />
                              ) : (
                                <div className="text-white font-bold text-xs text-center leading-tight px-1">
                                  Logo
                                </div>
                              )}
                            </div>
                            {/* Bottom part: Department number */}
                            <div className="flex-shrink-0 h-6 sm:h-8 flex items-center justify-center border-t border-blue-400/30">
                              <div className="text-white font-bold text-xs sm:text-sm leading-none">
                                {selectedDepartment}
                              </div>
                            </div>
                          </>
                        ) : plaqueType === 'ww-provisoire' ? (
                          // For temporary plates, show WW logo
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-white font-bold text-xs sm:text-sm text-center leading-tight">
                              WW
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  
                  {/* Text under plate display (if selected) */}
                  {(textOption === 'website' || (textOption === 'custom' && customText)) && (
                    <div className="mb-4 text-center">
                      <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-700 font-medium">
                          {textOption === 'website' ? 'www.ematricule.fr' : customText}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Client Information Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10 mt-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Vos informations</h3>
              
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
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
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                  />
                  <select
                    value={streetType}
                    onChange={(e) => setStreetType(e.target.value)}
                    required
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                  >
                    <option value="">Type</option>
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
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                  />
                </div>
              </div>

              {/* Carte Grise Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carte grise du véhicule *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Veuillez télécharger la carte grise afin de confirmer que vous êtes le propriétaire du véhicule.
                </p>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Choisir un fichier</span>
                    </span>
                    <input
                      type="file"
                      onChange={(e) => setCarteGriseFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/*,.pdf"
                      required
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
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                  />
                  <span className="text-sm text-gray-700">
                    J'assume la responsabilité totale de la commande de cette plaque d'immatriculation. 
                    Je certifie être le propriétaire légitime du véhicule immatriculé <strong>{formatRegistrationNumber(registrationNumber) || 'XXXXX'}</strong> et que toutes les informations fournies sont exactes. Je comprends que l'utilisation de cette plaque 
                    est soumise aux réglementations en vigueur et que toute utilisation frauduleuse est passible de sanctions pénales. *
                  </span>
                </label>
              </div>
            </div>

            {/* Bottom Navigation and Total */}
            <div className="flex flex-col items-center space-y-6 pt-8">
              {/* Total Price */}
              <div className="w-full max-w-5xl bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-6 md:p-8 border-2 border-primary-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg md:text-xl font-medium text-gray-700">Prix</span>
                    <div className="text-xl md:text-2xl font-semibold text-gray-800">
                      {calculatePlatePrice().toFixed(2).replace('.', ',')} €
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg md:text-xl font-medium text-gray-700">Frais de livraison</span>
                    <div className="text-xl md:text-2xl font-semibold text-gray-800">
                      {getDeliveryPrice().toFixed(2).replace('.', ',')} €
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-primary-300 pt-3">
                    <span className="text-lg md:text-xl font-semibold text-gray-700">Total</span>
                    <div className="text-3xl md:text-4xl font-bold text-primary-700">
                      {calculateTotal()} €
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-12 py-4 md:py-5 rounded-2xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
              >
                Suivant
              </button>

              {/* Previous Link */}
              <button
                type="button"
                className="text-gray-500 hover:text-primary-600 transition-colors text-sm font-medium"
              >
                &lt; Précédent
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
