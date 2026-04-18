import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 }
      )
    }

    const { orderId, documentType, fileUrl, fileName, fileType, fileSize } = await request.json()

    if (!orderId || !fileUrl) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée ou non autorisée' },
        { status: 404 }
      )
    }

    const adminSupabase = createAdminClient()

    // Save document reference with admin client
    const { data: document, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        order_id: orderId,
        name: documentType || fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize
      })
      .select()
      .single()

    if (docError) {
      console.error('Erreur sauvegarde document-ref:', docError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du document' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur API upload-ref:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
