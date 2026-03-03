import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail } from '@/lib/email'

/**
 * GET /api/payments/verify-payment/[checkoutId]
 * Verifies SumUp checkout status and updates the payments table.
 * Replaces the need to call the NestJS backend for verification.
 */
export async function GET(
  request: Request,
  { params }: { params: { checkoutId: string } }
) {
  try {
    const { checkoutId } = params
    if (!checkoutId) {
      return NextResponse.json(
        { error: 'checkoutId required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const apiKey = process.env.SUMUP_API_KEY
    if (!apiKey) {
      console.error('SUMUP_API_KEY is not set')
      return NextResponse.json(
        { error: 'Configuration paiement manquante' },
        { status: 500 }
      )
    }

    // Get checkout status from SumUp API
    const sumupResponse = await fetch(
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!sumupResponse.ok) {
      const errText = await sumupResponse.text()
      console.error('SumUp API error:', sumupResponse.status, errText)
      return NextResponse.json(
        { error: 'Impossible de vérifier le paiement', status: 'UNKNOWN' },
        { status: 502 }
      )
    }

    const checkout = await sumupResponse.json()
    const status = (checkout.status || '').toUpperCase()
    const paid = status === 'PAID'

    // Update payments table and linked order (service role)
    const admin = createAdminClient()
    const { data: payment } = await admin
      .from('payments')
      .select('id, order_id')
      .eq('sumup_checkout_id', checkoutId)
      .single()

    if (payment) {
      const paymentStatus = paid ? 'succeeded' : 'failed'
      const { error: payUpdateError } = await admin
        .from('payments')
        .update({
          status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (payUpdateError) {
        console.error('Verify-payment: failed to update payment', payUpdateError)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du paiement', status: 'UNKNOWN' },
          { status: 500 }
        )
      }

      // Mark order as completed when paid, unpaid when payment failed/cancelled/expired
      const orderStatus = paid ? 'completed' : 'unpaid'
      const { error: orderUpdateError } = await admin
        .from('orders')
        .update({
          status: orderStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.order_id)

      if (orderUpdateError) {
        console.error('Verify-payment: failed to update order', orderUpdateError)
      }

      // When paid: send confirmation email (email from order metadata or profile)
      if (paid) {
        const { data: order } = await admin
          .from('orders')
          .select('metadata, user_id')
          .eq('id', payment.order_id)
          .single()
        let clientEmail: string | null = null
        const metadata = (order as any)?.metadata as Record<string, unknown> | null
        if (metadata?.email && typeof metadata.email === 'string') {
          clientEmail = metadata.email
        }
        if (!clientEmail && (order as any)?.user_id) {
          const { data: profile } = await admin
            .from('profiles')
            .select('email')
            .eq('id', (order as any).user_id)
            .single()
          if (profile?.email) clientEmail = profile.email
        }
        if (clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
          const result = await sendOrderConfirmationEmail(clientEmail)
          if (!result.success) {
            console.error('Order confirmation email failed:', result.error)
          }
        } else {
          console.warn('Verify-payment: no valid client email for order', payment.order_id)
        }
      }
    }

    return NextResponse.json({ status: status === 'PAID' ? 'PAID' : status })
  } catch (error: any) {
    console.error('Error in verify-payment:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
