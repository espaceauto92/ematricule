'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createOrder, uploadDocuments, createCheckoutAndRedirect } from '@/lib/services/orderService'
import { CheckCircle, Lock, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'

export default function CheckoutSignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [redirectingToPayment, setRedirectingToPayment] = useState(false)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [orderData, setOrderData] = useState<any>(null)
  const [files, setFiles] = useState<{ [key: string]: File }>({})

  useEffect(() => {
    // Récupérer les données depuis localStorage
    const storedData = localStorage.getItem('pendingOrderData')
    if (!storedData) {
      // Pas de données en attente, rediriger vers la page d'accueil
      router.push('/')
      return
    }

    const data = JSON.parse(storedData)
    setUserData({
      firstName: data.orderData.metadata.firstName,
      lastName: data.orderData.metadata.lastName,
      email: data.orderData.metadata.email,
      phone: data.orderData.metadata.phone,
      address: data.orderData.metadata.address,
      postalCode: data.orderData.metadata.postalCode,
      city: data.orderData.metadata.city,
    })
    setOrderData(data.orderData)

    // Récupérer les fichiers depuis sessionStorage (base64)
    const storedFiles = sessionStorage.getItem('pendingOrderFiles')
    if (storedFiles) {
      try {
        const filesData = JSON.parse(storedFiles)
        console.log('Fichiers récupérés depuis sessionStorage:', Object.keys(filesData))
        console.log('Données brutes:', filesData)
        
        // Convertir base64 en File objects
        const fileObjects: { [key: string]: File } = {}
        for (const [key, fileData] of Object.entries(filesData)) {
          if (fileData && typeof fileData === 'object' && 'base64' in fileData) {
            try {
              const fileInfo = fileData as any
              
              // Vérifier que base64 est présent et valide
              if (!fileInfo.base64 || typeof fileInfo.base64 !== 'string') {
                console.error(`Fichier ${key}: base64 manquant ou invalide`)
                continue
              }
              
              // Décoder base64
              const byteCharacters = atob(fileInfo.base64)
              if (byteCharacters.length === 0) {
                console.error(`Fichier ${key}: base64 décodé est vide`)
                continue
              }
              
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const blob = new Blob([byteArray], { type: fileInfo.type || 'application/octet-stream' })
              
              if (blob.size === 0) {
                console.error(`Fichier ${key}: Blob créé est vide`)
                continue
              }
              
              const fileName = fileInfo.name || `${key}_${Date.now()}`
              fileObjects[key] = new File([blob], fileName, { type: fileInfo.type || 'application/octet-stream' })
              
              console.log(`✓ Fichier converti: ${key} - ${fileName} (${blob.size} bytes, type: ${fileInfo.type})`)
            } catch (convertError) {
              console.error(`✗ Erreur conversion fichier ${key}:`, convertError)
            }
          } else {
            console.warn(`Fichier ${key}: format invalide`, fileData)
          }
        }
        
        setFiles(fileObjects)
        console.log(`Total fichiers convertis avec succès: ${Object.keys(fileObjects).length}/${Object.keys(filesData).length}`)
        
        if (Object.keys(fileObjects).length === 0) {
          console.error('AUCUN fichier n\'a pu être converti!')
        }
      } catch (error) {
        console.error('Erreur récupération fichiers:', error)
      }
    } else {
      console.warn('Aucun fichier trouvé dans sessionStorage - clé: pendingOrderFiles')
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setIsLoading(false)
      return
    }

    if (!userData || !orderData) {
      setError('Données manquantes. Veuillez recommencer.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Créer le compte utilisateur via l'API avec confirmation automatique de l'email
      const userDataToSend = {
        email: userData.email,
        password: formData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        postalCode: userData.postalCode,
        city: userData.city,
      }
      
      console.log('Données utilisateur à envoyer:', userDataToSend)
      
      const createUserResponse = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDataToSend),
      })

      const createUserResult = await createUserResponse.json()

      if (!createUserResponse.ok) {
        const errorMessage = createUserResult.error || 'Erreur lors de la création du compte'
        console.error('Erreur création utilisateur:', {
          status: createUserResponse.status,
          error: errorMessage,
          details: createUserResult.details
        })
        throw new Error(errorMessage)
      }

      // Maintenant se connecter avec le compte créé
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: formData.password,
      })
      
      if (signInError) {
        throw new Error('Compte créé mais impossible de se connecter. Veuillez réessayer.')
      }

      // Vérifier que la session est bien établie
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        throw new Error('Impossible d\'établir la session. Veuillez réessayer.')
      }

      // Court délai pour que les cookies et le profil soient pris en compte, puis on enchaîne direct sur la commande et le paiement
      await new Promise(resolve => setTimeout(resolve, 400))

      // Créer la commande puis redirection directe vers le paiement
      console.log('Création de la commande avec orderData:', {
        type: orderData.type,
        price: orderData.price,
        hasVehicleData: !!orderData.vehicleData
      })
      
      const result = await createOrder(orderData)

      if (!result.success || !result.order) {
        console.error('Erreur création commande:', result.error)
        console.error('Order data sent:', {
          type: orderData.type,
          price: orderData.price,
          hasVehicleData: !!orderData.vehicleData,
          hasMetadata: !!orderData.metadata
        })
        
        // Show more detailed error to user
        let errorMessage = result.error || 'Erreur lors de la création de la commande'
        if (result.error?.includes('foreign key') || result.error?.includes('user_id')) {
          errorMessage = 'Erreur de profil utilisateur. Veuillez rafraîchir la page et réessayer.'
        } else if (result.error?.includes('constraint') || result.error?.includes('violation')) {
          errorMessage = 'Erreur de validation des données. Veuillez vérifier vos informations.'
        }
        
        throw new Error(errorMessage)
      }
      
      console.log('Commande créée avec succès:', result.order.id)

      // Uploader les documents
      const documentsToUpload: Array<{ file: File; documentType: string }> = []
      
      console.log('Fichiers disponibles pour upload:', Object.keys(files))
      
      // Documents pour carte-grise
      if (files.idFile) {
        console.log('Ajout carte_identite:', files.idFile.name)
        documentsToUpload.push({ file: files.idFile, documentType: 'carte_identite' })
      }
      if (files.proofAddressFile) {
        console.log('Ajout justificatif_domicile:', files.proofAddressFile.name)
        documentsToUpload.push({ file: files.proofAddressFile, documentType: 'justificatif_domicile' })
      }
      if (files.currentCardFile) {
        console.log('Ajout carte_grise_actuelle:', files.currentCardFile.name)
        documentsToUpload.push({ file: files.currentCardFile, documentType: 'carte_grise_actuelle' })
      }
      if (files.certificatCessionFile) {
        console.log('Ajout certificat_cession:', files.certificatCessionFile.name)
        documentsToUpload.push({ file: files.certificatCessionFile, documentType: 'certificat_cession' })
      }
      if (files.permisConduireFile) {
        console.log('Ajout permis_conduire:', files.permisConduireFile.name)
        documentsToUpload.push({ file: files.permisConduireFile, documentType: 'permis_conduire' })
      }
      if (files.controleTechniqueFile) {
        console.log('Ajout controle_technique:', files.controleTechniqueFile.name)
        documentsToUpload.push({ file: files.controleTechniqueFile, documentType: 'controle_technique' })
      }
      if (files.assuranceFile) {
        console.log('Ajout assurance:', files.assuranceFile.name)
        documentsToUpload.push({ file: files.assuranceFile, documentType: 'assurance' })
      }
      if (files.mandatFile) {
        const mandatType = orderData.metadata?.isSignatureValidated ? 'mandat_signe' : 'mandat'
        console.log('Ajout mandat:', files.mandatFile.name, `(${mandatType})`)
        documentsToUpload.push({ file: files.mandatFile, documentType: mandatType })
      }

      const quitusDocTypes: Record<string, string> = {
        quitusJustificatifIdentiteFile: 'quitus_justificatif_identite',
        quitusJustificatifDomicileFile: 'quitus_justificatif_domicile',
        quitusCertificatImmatriculationEtrangerFile: 'quitus_certificat_immatriculation_etranger',
        quitusJustificatifVenteFile: 'quitus_justificatif_vente',
        quitusCertificatConformiteFile: 'quitus_certificat_conformite',
        quitusControleTechniqueFile: 'quitus_controle_technique',
        quitusUsageVehiculeFile: 'quitus_usage_vehicule',
        quitusMandatRepresentationFile: 'quitus_mandat_representation',
        quitusCopieIdentiteMandataireFile: 'quitus_copie_identite_mandataire',
        quitusDemandeCertificatCerfa13750File: 'quitus_demande_cerfa_13750',
      }
      if (orderData.serviceType === 'demande-quitus-fiscal') {
        Object.entries(quitusDocTypes).forEach(([key, docType]) => {
          const file = (files as Record<string, File | undefined>)[key]
          if (file) {
            documentsToUpload.push({ file, documentType: docType })
          }
        })
      }
      
      // Documents pour plaque et COC
      if (files.carteGriseFile) {
        console.log('Ajout carte_grise:', files.carteGriseFile.name)
        documentsToUpload.push({ file: files.carteGriseFile, documentType: 'carte_grise' })
      }
      if (files.rectoFile) {
        console.log('Ajout carte_grise_recto:', files.rectoFile.name)
        documentsToUpload.push({ file: files.rectoFile, documentType: 'carte_grise_recto' })
      }
      if (files.versoFile) {
        console.log('Ajout carte_grise_verso:', files.versoFile.name)
        documentsToUpload.push({ file: files.versoFile, documentType: 'carte_grise_verso' })
      }
      
      console.log(`Total documents à uploader: ${documentsToUpload.length}`)

      if (documentsToUpload.length > 0) {
        console.log(`Début upload de ${documentsToUpload.length} documents...`)
        const uploadResult = await uploadDocuments(documentsToUpload, result.order.id)
        console.log(`Résultat upload: ${uploadResult.uploaded}/${documentsToUpload.length} uploadés`)
        
        if (!uploadResult.success) {
          console.error('Erreurs lors de l\'upload des documents:', uploadResult.errors)
          // Afficher les erreurs mais continuer
          if (uploadResult.errors.length > 0) {
            console.error('Détails des erreurs:', uploadResult.errors)
          }
        }
        
        if (uploadResult.uploaded === 0) {
          console.error('AUCUN document n\'a été uploadé avec succès!')
          throw new Error('Échec de l\'upload des documents. Veuillez réessayer.')
        }
      } else {
        console.warn('Aucun document à uploader - vérifiez que les fichiers sont bien récupérés depuis sessionStorage')
      }

      // Nettoyer les données temporaires
      localStorage.removeItem('pendingOrderData')
      sessionStorage.removeItem('pendingOrderFiles')

      // Stocker les références de commande
      localStorage.setItem('currentOrderId', result.order.id)
      localStorage.setItem('currentOrderRef', result.order.reference)
      localStorage.setItem('currentOrderPrice', String(orderData.price))

      // Redirection directe vers le paiement (popup SumUp) — pas de passage par le dashboard
      setRedirectingToPayment(true)
      await createCheckoutAndRedirect(result.order.id, orderData.price)
    } catch (error: any) {
      console.error('Erreur:', error)
      setRedirectingToPayment(false)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userData || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Créer votre compte
            </h1>
            <p className="text-gray-600">
              Complétez votre inscription pour finaliser votre commande
            </p>
          </div>

          {/* Aperçu des informations */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              Vos informations
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">Email:</span>
                <span className="ml-2">{userData.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">Nom:</span>
                <span className="ml-2">{userData.firstName} {userData.lastName}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">Téléphone:</span>
                <span className="ml-2">{userData.phone}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">Adresse:</span>
                <span className="ml-2">{userData.address}, {userData.postalCode} {userData.city}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                placeholder="Choisissez un mot de passe sécurisé"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                placeholder="Confirmez votre mot de passe"
              />
            </div>

            <div className="flex items-center">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <p className="text-xs text-gray-600">
                Vos données sont sécurisées et ne seront utilisées que pour traiter votre commande.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || redirectingToPayment}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {redirectingToPayment ? (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Redirection vers le paiement sécurisé...
                </>
              ) : isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Création du compte...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Créer mon compte et continuer vers le paiement
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


