'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Car,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Image as ImageIcon,
  File,
  ExternalLink,
  CreditCard,
  Info,
  Edit,
  Save,
  X
} from 'lucide-react'

interface OrderDetails {
  id: string
  type: string
  status: string
  price: number
  reference?: string
  metadata?: any
  plaque_type?: string
  created_at: string
  updated_at: string
  vehicles?: {
    vin?: string
    make?: string
    model?: string
    year?: number
    engine?: string
    fuel_type?: string
    color?: string
    body_type?: string
    weight?: number
    power?: number
    displacement?: string
    registration_number?: string
  }
  profiles?: {
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
    address?: string
    city?: string
    zip_code?: string
    country?: string
  }
  documents?: Array<{
    id: string
    name: string
    file_url: string
    file_type: string
    file_size: number
    created_at: string
  }>
  payment?: {
    amount: number
    status: string
    stripe_payment_intent_id?: string
    sumup_checkout_id?: string
  }
}

export default function AdminOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setOrder(data.order)
      setNewStatus(data.order.status)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
      setIsEditingStatus(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentTypeLabel = (name: string) => {
    const types: Record<string, string> = {
      'carte_identite': 'Carte d\'identité',
      'justificatif_domicile': 'Justificatif de domicile',
      'carte_grise_actuelle': 'Carte grise actuelle',
      'certificat_cession': 'Certificat de cession',
      'permis_conduire': 'Permis de conduire',
      'controle_technique': 'Contrôle technique',
      'assurance': 'Attestation d\'assurance',
      'mandat': 'Mandat',
    }
    return types[name] || name
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      processing: { label: 'En traitement', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-200' },
      unpaid: { label: 'Non payé', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    }
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const isImage = (fileType: string) => fileType?.startsWith('image/')
  const isPdf = (fileType: string) => fileType?.includes('pdf')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Erreur</p>
        <p className="text-sm">{error || 'Commande non trouvée'}</p>
        <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          ← Retour aux commandes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détails de la commande</h1>
            <p className="text-gray-600">
              {order.reference || order.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditingStatus ? (
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
                <option value="unpaid">Non payé</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isSaving}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setIsEditingStatus(false)
                  setNewStatus(order.status)
                }}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {getStatusBadge(order.status)}
              <button
                onClick={() => setIsEditingStatus(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Modifier le statut"
              >
                <Edit className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de la commande</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-medium text-gray-900">
                  {order.type === 'carte-grise' ? 'Carte Grise' : 
                   order.type === 'plaque' ? 'Plaque Immatriculation' : 'COC'}
                </p>
              </div>
              {order.type === 'plaque' && (order.plaque_type || order.metadata?.plaqueType) && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Type de plaque</p>
                  <p className="font-medium text-gray-900">
                    {(order.plaque_type || order.metadata?.plaqueType) === 'permanente' ? 'Permanente' : 
                     (order.plaque_type || order.metadata?.plaqueType) === 'ww-provisoire' ? 'WW provisoire' : 
                     (order.plaque_type || order.metadata?.plaqueType)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Prix</p>
                <p className="font-medium text-gray-900">{order.price.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date de création</p>
                <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Dernière mise à jour</p>
                <p className="font-medium text-gray-900">{formatDate(order.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          {order.vehicles && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary-600" />
                Informations du véhicule
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(order.vehicles).map(([key, value]) => {
                  if (!value) return null
                  const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <div key={key}>
                      <p className="text-sm text-gray-600 mb-1">{label}</p>
                      <p className="font-medium text-gray-900">{String(value)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          {order.documents && order.documents.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Documents ({order.documents.length})
                </h2>
              </div>
              
              {/* Download All Button */}
              <div className="mb-4">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/admin/orders/${order.id}/download-documents`)
                      
                      if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.error || 'Erreur lors du téléchargement')
                      }

                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `documents_${order.reference || order.id}_${Date.now()}.zip`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    } catch (error: any) {
                      alert('Erreur lors du téléchargement: ' + (error.message || 'Une erreur est survenue'))
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger tous les documents (.zip)</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {order.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isImage(doc.file_type) ? (
                        <ImageIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : isPdf(doc.file_type) ? (
                        <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <File className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {getDocumentTypeLabel(doc.name)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ouvrir"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <a
                        href={doc.file_url}
                        download
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Documents
              </h2>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">Aucun document trouvé pour cette commande</p>
                <p className="text-sm mt-1">Les documents peuvent être en cours d'upload ou n'ont pas encore été ajoutés.</p>
              </div>
            </div>
          )}

          {/* Metadata - Form Fields */}
          {order.metadata && Object.keys(order.metadata).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-600" />
                Champs de saisie / Informations supplémentaires
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(order.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          {order.profiles && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Client
              </h2>
              <div className="space-y-3">
                {order.profiles.first_name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Prénom</p>
                    <p className="font-medium text-gray-900">{order.profiles.first_name}</p>
                  </div>
                )}
                {order.profiles.last_name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nom</p>
                    <p className="font-medium text-gray-900">{order.profiles.last_name}</p>
                  </div>
                )}
                {order.profiles.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{order.profiles.email}</p>
                    </div>
                  </div>
                )}
                {order.profiles.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                      <p className="font-medium text-gray-900">{order.profiles.phone}</p>
                    </div>
                  </div>
                )}
                {(order.profiles.address || order.profiles.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Adresse</p>
                      <p className="font-medium text-gray-900">
                        {order.profiles.address && `${order.profiles.address}, `}
                        {order.profiles.zip_code && `${order.profiles.zip_code} `}
                        {order.profiles.city}
                        {order.profiles.country && `, ${order.profiles.country}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {order.payment && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Paiement
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Montant</p>
                  <p className="font-semibold text-gray-900">{order.payment.amount.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Statut</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (order.payment.status === 'succeeded' || order.payment.status === 'paid')
                      ? 'bg-green-100 text-green-800' 
                      : order.payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(order.payment.status === 'succeeded' || order.payment.status === 'paid') ? 'Payé' : 
                     order.payment.status === 'pending' ? 'En attente' : 'Non payé'}
                  </span>
                </div>
                {order.payment.sumup_checkout_id && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ID SumUp</p>
                    <p className="font-mono text-xs text-gray-700">{order.payment.sumup_checkout_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

