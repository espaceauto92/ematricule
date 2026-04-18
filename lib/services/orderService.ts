 * Service pour la gestion des commandes
 * Centralise les appels API pour créer, récupérer et gérer les commandes
 */
import { createClient } from '@/lib/supabase/client'

export interface OrderData {
  type: 'carte-grise' | 'plaque' | 'coc'
  vehicleData?: {
    vin?: string
    registrationNumber?: string
    marque?: string
    make?: string
    model?: string
    year?: number
  }
  serviceType?: string
  price: number
  metadata?: Record<string, any>
}

export interface Order {
  id: string
  reference: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  price: number
  createdAt: string
  type: 'carte-grise' | 'plaque' | 'coc'
  vehicleInfo?: {
    brand?: string
    model?: string
    registrationNumber?: string
  }
}

export interface CreateOrderResponse {
  success: boolean
  order?: {
    id: string
    reference: string
    status: string
    price: number
    createdAt: string
  }
  error?: string
  details?: any
}

export interface GetOrdersResponse {
  success: boolean
  orders?: Order[]
  error?: string
}

/**
 * Créer une nouvelle commande
 */
export async function createOrder(data: OrderData): Promise<CreateOrderResponse> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclure les cookies dans la requête
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      let errorMessage = 'Erreur lors de la création de la commande'
      let errorDetails: any = null
      try {
        const result = await response.json()
        errorMessage = result.error || errorMessage
        errorDetails = result.details
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      console.error('Order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        details: errorDetails
      })
      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      }
    }

    const result = await response.json()
    return {
      success: true,
      order: result.order
    }
  } catch (error: any) {
    console.error('Erreur createOrder:', error)
    return {
      success: false,
      error: error.message || 'Erreur de connexion'
    }
  }
}

/**
 * Create checkout and open SumUp widget in a popup
 */
const CHECKOUT_REQUEST_TIMEOUT_MS = 20000 // 20s (Next.js API only, no backend)

export async function createCheckoutAndRedirect(orderId: string, amount: number): Promise<void> {
  try {
    console.log('Creating checkout for order:', orderId, 'amount:', amount)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CHECKOUT_REQUEST_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          amount: amount,
          currency: 'eur'
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    // Read the response body only once
    let responseData: any = {};
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Réponse invalide du serveur');
    }

    if (!response.ok) {
      console.error('Checkout creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      throw new Error(responseData.error || responseData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    const { checkoutUrl } = responseData;
    
    if (!checkoutUrl) {
      console.error('No checkoutUrl in response:', responseData);
      throw new Error('URL de paiement non reçue du serveur');
    }
    
    console.log('Opening SumUp checkout in popup:', checkoutUrl);
    
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (window.innerWidth <= 768);
    
    // Responsive popup sizing - full screen on mobile, centered popup on desktop
    let width: number;
    let height: number;
    let left: number;
    let top: number;
    let popupFeatures: string;
    
    if (isMobile) {
      // Full screen on mobile devices
      width = window.screen.width || window.innerWidth;
      height = window.screen.height || window.innerHeight;
      left = 0;
      top = 0;
      popupFeatures = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,location=yes,status=yes`;
    } else {
      // Centered popup on desktop
      width = 600;
      height = 800;
      left = Math.max(0, (window.screen.width - width) / 2);
      top = Math.max(0, (window.screen.height - height) / 2);
      popupFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;
    }
    
    const popup = window.open(
      checkoutUrl,
      'SumUpCheckout',
      popupFeatures
    );

    if (!popup || popup.closed) {
      // Popup blocked or failed to open - fallback to redirect
      console.warn('Popup blocked or failed, redirecting instead');
      if (isMobile) {
        // On mobile, open in same window if popup fails
        window.location.href = checkoutUrl;
      } else {
        // On desktop, try to open in new tab as fallback
        window.open(checkoutUrl, '_blank');
      }
      return;
    }
    
    // Focus the popup window (especially important on mobile)
    try {
      popup.focus();
    } catch (e) {
      console.warn('Could not focus popup:', e);
    }

    // Listen for messages from the popup
    const messageHandler = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'SUMPUP_PAYMENT_SUCCESS') {
        console.log('Payment successful; popup will redirect to success page then close.');
        // Popup will redirect to /payment-success after 5s, show message and 15s countdown, then close.
        // When popup closes (or sends REDIRECT_TO_DASHBOARD), we redirect to dashboard below.
      } else if (event.data.type === 'REDIRECT_TO_DASHBOARD') {
        console.log('Success page requested redirect to dashboard');
        window.removeEventListener('message', messageHandler);
        if (window.location.pathname.includes('/dashboard')) {
          window.location.reload();
        } else {
          window.location.href = '/dashboard';
        }
      } else if (event.data.type === 'SUMPUP_PAYMENT_FAILED') {
        console.log('Payment failed, closing popup');
        window.removeEventListener('message', messageHandler);
        
        // Close popup with error handling
        try {
          if (popup && !popup.closed) {
            popup.close();
          }
        } catch (e) {
          console.warn('Could not close popup:', e);
        }
        
        // Show error message (you can customize this)
        alert('Le paiement a échoué. Veuillez réessayer.');
        
        // Reload page to update payment status
        if (window.location.pathname.includes('/dashboard')) {
          window.location.reload();
        }
      } else if (event.data.type === 'SUMPUP_POPUP_CLOSED') {
        console.log('Popup closed by user');
        window.removeEventListener('message', messageHandler);
        
        // Reload page when popup is closed
        if (window.location.pathname.includes('/dashboard')) {
          window.location.reload();
        }
      }
    };

    window.addEventListener('message', messageHandler);

    // When popup is closed (by user or after success page countdown), redirect to dashboard
    const checkPopupClosed = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          console.log('Popup was closed; redirecting to dashboard');
          if (window.location.pathname.includes('/dashboard')) {
            window.location.reload();
          } else {
            window.location.href = '/dashboard';
          }
        }
      } catch (e) {
        console.warn('Error checking popup status:', e);
      }
    }, 500);
  } catch (error: any) {
    console.error('Erreur création checkout:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      orderId,
      amount
    });
    if (error.name === 'AbortError') {
      throw new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.')
    }
    throw error
  }
}

/**
 * Récupérer toutes les commandes de l'utilisateur
 */
export async function getOrders(): Promise<GetOrdersResponse> {
  try {
    const response = await fetch('/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erreur lors de la récupération des commandes'
      }
    }

    return {
      success: true,
      orders: result.orders
    }
  } catch (error: any) {
    console.error('Erreur getOrders:', error)
    return {
      success: false,
      error: error.message || 'Erreur de connexion'
    }
  }
}

/**
 * Uploader un document pour une commande
 */
export async function uploadDocument(
  file: File,
  orderId: string,
  documentType: string
): Promise<{ success: boolean; document?: any; error?: string }> {
  try {
    // Vérifier que le fichier est valide
    if (!file || file.size === 0) {
      console.error('Fichier invalide:', file)
      return {
        success: false,
        error: 'Fichier invalide ou vide'
      }
    }

    console.log(`Upload document: ${documentType}, taille: ${file.size} bytes, nom: ${file.name}`)

    // Pour les fichiers de plus de 4Mo ou si l'utilisateur est connecté, 
    // on tente l'upload direct via Supabase pour bypasser la limite Vercel de 4.5Mo
    if (file.size > 4 * 1024 * 1024) {
      console.log('Fichier volumineux détecté, utilisation de l\'upload direct Supabase')
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const fileExt = file.name.split('.').pop() || 'pdf'
          const timestamp = Date.now()
          const fileName = `${user.id}/${orderId}/${documentType || 'document'}_${timestamp}.${fileExt}`
          
          // 1. Upload au Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file, {
              contentType: file.type,
              upsert: false
            })

          if (uploadError) throw uploadError

          // 2. Récupérer l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName)

          // 3. Insérer la référence en base (via API pour rester sécurisé et bypasser l'admin client si besoin)
          // On utilise quand même l'API pour la partie base de données car elle gère les checks de permission admin
          // Mais on passe l'URL déjà uploadée
          const response = await fetch('/api/documents/upload-ref', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              documentType,
              fileUrl: publicUrl,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            })
          })

          if (!response.ok) {
            const result = await response.json()
            throw new Error(result.error || 'Erreur lors de la sauvegarde de la référence')
          }

          const result = await response.json()
          return { success: true, document: result.document }
        }
      } catch (directError: any) {
        console.error('Échec upload direct, repli sur API standard:', directError)
        // On continue vers l'API standard si l'upload direct échoue
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('orderId', orderId)
    formData.append('documentType', documentType)

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      credentials: 'include', // Important pour inclure les cookies de session
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      console.error(`Erreur upload ${documentType}:`, result.error, 'Status:', response.status)
      return {
        success: false,
        error: result.error || 'Erreur lors de l\'upload du document'
      }
    }

    console.log(`Document ${documentType} uploadé avec succès:`, result.document?.id)
    return {
      success: true,
      document: result.document
    }
  } catch (error: any) {
    console.error('Erreur uploadDocument:', error)
    return {
      success: false,
      error: error.message || 'Erreur de connexion'
    }
  }
}

/**
 * Uploader plusieurs documents pour une commande
 */
export async function uploadDocuments(
  files: Array<{ file: File; documentType: string }>,
  orderId: string
): Promise<{ success: boolean; uploaded: number; errors: string[] }> {
  const errors: string[] = []
  let uploaded = 0

  console.log(`Début upload de ${files.length} documents pour la commande ${orderId}`)

  for (const { file, documentType } of files) {
    try {
      const result = await uploadDocument(file, orderId, documentType)
      if (result.success) {
        uploaded++
        console.log(`✓ ${documentType} uploadé avec succès`)
      } else {
        const errorMsg = `${documentType}: ${result.error}`
        errors.push(errorMsg)
        console.error(`✗ ${errorMsg}`)
      }
    } catch (error: any) {
      const errorMsg = `${documentType}: ${error.message || 'Erreur inconnue'}`
      errors.push(errorMsg)
      console.error(`✗ ${errorMsg}`)
    }
  }

  console.log(`Upload terminé: ${uploaded}/${files.length} documents uploadés`)

  return {
    success: errors.length === 0,
    uploaded,
    errors
  }
}

