'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createOrder, uploadDocuments, createCheckoutAndRedirect } from '@/lib/services/orderService'
import { getFilesFromIndexedDB, clearIndexedDB } from '@/lib/utils/storage'
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

    const loadFiles = async () => {
      // 1. D'abord tenter de récupérer depuis IndexedDB (notre nouvelle méthode pour les gros fichiers)
      try {
        const idbFiles = await getFilesFromIndexedDB()
        if (Object.keys(idbFiles).length > 0) {
          console.log('Fichiers récupérés depuis IndexedDB:', Object.keys(idbFiles))
          setFiles(idbFiles)
          return // Si on a trouvé dans IDB, on s'arrête là
        }
      } catch (err) {
        console.error('Erreur lecture IndexedDB:', err)
      }

      // 2. Repli sur sessionStorage (base64) pour les anciennes sessions
      const storedFiles = sessionStorage.getItem('pendingOrderFiles')
      if (storedFiles) {
        try {
          const filesData = JSON.parse(storedFiles)
          console.log('Fichiers récupérés depuis sessionStorage:', Object.keys(filesData))
          
          const fileObjects: { [key: string]: File } = {}
          for (const [key, fileData] of Object.entries(filesData)) {
            if (fileData && typeof fileData === 'object' && 'base64' in fileData) {
              try {
                const fileInfo = fileData as any
                const byteCharacters = atob(fileInfo.base64)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: fileInfo.type || 'application/octet-stream' })
                const fileName = fileInfo.name || `${key}_${Date.now()}`
                fileObjects[key] = new File([blob], fileName, { type: fileInfo.type || 'application/octet-stream' })
              } catch (convertError) {
                console.error(`Erreur conversion fichier ${key}:`, convertError)
              }
            }
          }
          setFiles(fileObjects)
        } catch (error) {
          console.error('Erreur récupération fichiers sessionStorage:', error)
        }
      } else {
        console.warn('Aucun fichier trouvé')
      }
    }

    loadFiles()
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

      // Court délai pour que les cookies et le profil soient pris en compte
      await new Promise(resolve => setTimeout(resolve, 500))

      // Créer la commande
      console.log('Création de la commande avec orderData:', {
        type: orderData.type,
        price: orderData.price,
        hasVehicleData: !!orderData.vehicleData
      })
      
      const result = await createOrder(orderData)

      if (!result.success || !result.order) {
        console.error('Erreur création commande:', result.error)
        let errorMessage = result.error || 'Erreur lors de la création de la commande'
        if (result.error?.includes('foreign key') || result.error?.includes('user_id')) {
          errorMessage = 'Erreur de profil utilisateur. Veuillez rafraîchir la page et réessayer.'
        } else if (result.error?.includes('constraint') || result.error?.includes('violation')) {
          errorMessage = 'Erreur de validation des données. Veuillez vérifier vos informations.'
        }
        throw new Error(errorMessage)
      }
      
      console.log('Commande créée avec succès:', result.order.id)

      // --- LOAD FILES FRESH FROM IndexedDB at submit time ---
      let freshFiles: Record<string, File> = {}
      try {
        freshFiles = await getFilesFromIndexedDB()
        console.log('Fichiers récupérés depuis IndexedDB (submit):', Object.keys(freshFiles))
      } catch (err) {
        console.error('Erreur lecture IndexedDB lors de la soumission:', err)
      }
      // Fallback to state files if IndexedDB was empty
      if (Object.keys(freshFiles).length === 0 && Object.keys(files).length > 0) {
        freshFiles = files
        console.log('Utilisation des fichiers depuis l\'état React:', Object.keys(freshFiles))
      }

      // Uploader les documents
      const documentsToUpload: Array<{ file: File; documentType: string }> = []
      
      console.log('Fichiers disponibles pour upload:', Object.keys(freshFiles))
      
      // Documents de base
      const baseDocMap: Record<string, string> = {
        idFile: 'carte_identite',
        proofAddressFile: 'justificatif_domicile',
        currentCardFile: 'carte_grise_actuelle',
        certificatCessionFile: 'certificat_cession',
        permisConduireFile: 'permis_conduire',
        controleTechniqueFile: 'controle_technique',
        assuranceFile: 'assurance',
        carteGriseFile: 'carte_grise',
        rectoFile: 'carte_grise_recto',
        versoFile: 'carte_grise_verso',
      }

      for (const [key, docType] of Object.entries(baseDocMap)) {
        const file = freshFiles[key]
        if (file) {
          console.log(`Ajout ${docType}:`, file.name)
          documentsToUpload.push({ file, documentType: docType })
        }
      }

      // Mandat signé
      if (freshFiles.mandatFile) {
        const mandatType = orderData.metadata?.isSignatureValidated ? 'mandat_signe' : 'mandat'
        console.log('Ajout mandat:', freshFiles.mandatFile.name, `(${mandatType})`)
        documentsToUpload.push({ file: freshFiles.mandatFile, documentType: mandatType })
      }

      // Documents spécifiques aux procédures carte-grise
      const procedureDocTypeMap: Record<string, string> = {
        hostIdFile: 'host_id',
        hostProofAddressFile: 'host_justificatif_domicile',
        attestationHebergementFile: 'attestation_hebergement',
        kbisFile: 'kbis',
        gerantIdFile: 'gerant_id',
        companyAssuranceFile: 'company_assurance',
        cerfa13750File: 'cerfa_13750',
        cerfa13753File: 'cerfa_13753',
        mandatFile: 'mandat',
        carteGriseVendeurFile: 'carte_grise_vendeur',
        demandeCertificatMandatFile: 'demande_certificat_mandat',
        certificatCessionCerfa15776File: 'certificat_cession_15776',
        recepisseDeclarationAchatFile: 'recepisse_declaration_achat',
        certificatDeclarationAchatCerfa13751File: 'certificat_declaration_achat_13751',
        justificatifIdentiteFile: 'justificatif_identite',
        extraitKbisFile: 'extrait_kbis',
        ficheJustificatifIdentiteFile: 'fiche_justificatif_identite',
        fichePermisConduireFile: 'fiche_permis_conduire',
        ficheCopieCarteGriseFile: 'fiche_copie_carte_grise',
        ficheMandatCerfa13757File: 'fiche_mandat_13757',
        wwCarteGriseEtrangereFile: 'ww_carte_grise_etrangere',
        wwCertificatConformiteFile: 'ww_certificat_conformite',
        wwDemandeCertificatMandatFile: 'ww_demande_certificat_mandat',
        wwJustificatifProprieteFile: 'ww_justificatif_propriete',
        wwQuitusFiscalFile: 'ww_quitus_fiscal',
        wwPermisConduireFile: 'ww_permis_conduire',
        wwJustificatifDomicileFile: 'ww_justificatif_domicile',
        wwJustificatifIdentiteFile: 'ww_justificatif_identite',
        wwControleTechniqueFile: 'ww_controle_technique',
        ueCarteGriseEtrangereFile: 'ue_carte_grise_etrangere',
        ueCertificatConformiteFile: 'ue_certificat_conformite',
        ueDemandeCertificatMandatFile: 'ue_demande_certificat_mandat',
        ueJustificatifProprieteFile: 'ue_justificatif_propriete',
        ueQuitusFiscalFile: 'ue_quitus_fiscal',
        uePermisConduireFile: 'ue_permis_conduire',
        ueJustificatifDomicileFile: 'ue_justificatif_domicile',
        ueJustificatifIdentiteFile: 'ue_justificatif_identite',
        ueControleTechniqueFile: 'ue_controle_technique',
        wGarageKbisFile: 'w_garage_kbis',
        wGarageSirenFile: 'w_garage_siren',
        wGarageJustificatifDomiciliationFile: 'w_garage_justificatif_domiciliation',
        wGarageCniGerantFile: 'w_garage_cni_gerant',
        wGarageAssuranceFile: 'w_garage_assurance',
        wGaragePreuveActiviteFile: 'w_garage_preuve_activite',
        wGarageAttestationFiscaleFile: 'w_garage_attestation_fiscale',
        wGarageAttestationUrssafFile: 'w_garage_attestation_urssaf',
        wGarageMandatFile: 'w_garage_mandat',
        cessionCarteGriseBarreeFile: 'cession_carte_grise_barree',
        cessionCarteIdentiteFile: 'cession_carte_identite',
        cessionCertificatVenteFile: 'cession_certificat_vente',
        cessionMandatFile: 'cession_mandat',
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

      Object.entries(procedureDocTypeMap).forEach(([key, docType]) => {
        const file = (freshFiles as Record<string, File | undefined>)[key]
        if (file && !documentsToUpload.find(d => d.documentType === docType)) {
          documentsToUpload.push({ file, documentType: docType })
        }
      })
      
      console.log(`Total documents à uploader: ${documentsToUpload.length}`)

      if (documentsToUpload.length > 0) {
        console.log(`Début upload de ${documentsToUpload.length} documents...`)
        const uploadResult = await uploadDocuments(documentsToUpload, result.order.id)
        console.log(`Résultat upload: ${uploadResult.uploaded}/${documentsToUpload.length} uploadés`)
        
        if (!uploadResult.success) {
          console.error('Certains documents n\'ont pas pu être uploadés:', uploadResult.errors)
          // Ne pas bloquer le paiement — l'admin peut toujours demander les documents manuellement
        }
      } else {
        // No files found — log a warning but continue to payment
        // Admin will receive order data and can request documents manually
        console.warn('Aucun document trouvé à uploader. La commande sera créée sans documents.')
      }

      // Nettoyer les données temporaires
      localStorage.removeItem('pendingOrderData')
      sessionStorage.removeItem('pendingOrderFiles')
      await clearIndexedDB()

      // Stocker les références de commande
      localStorage.setItem('currentOrderId', result.order.id)
      localStorage.setItem('currentOrderRef', result.order.reference)
      localStorage.setItem('currentOrderPrice', String(orderData.price))

      // Redirection vers le paiement
      setRedirectingToPayment(true)

      // Lancer le paiement — createCheckoutAndRedirect ouvre un popup ou redirige
      // On redirige vers le dashboard après (le popup gérera la suite)
      try {
        await createCheckoutAndRedirect(result.order.id, orderData.price)
      } catch (checkoutError: any) {
        console.error('Erreur lors de la création du checkout:', checkoutError)
        // En cas d'erreur de paiement, rediriger vers le dashboard
        // La commande a bien été créée, l'admin la verra
        setError('Commande créée. Erreur lors de l\'ouverture du paiement. Veuillez contacter le support ou réessayer depuis votre espace client.')
        setRedirectingToPayment(false)
        // Redirect to dashboard anyway so user can see their order
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
        return
      }

      // Redirect to dashboard after payment is initiated
      // (popup handles SumUp, this page stays as dashboard)
      router.push('/dashboard')

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


