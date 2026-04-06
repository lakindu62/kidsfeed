import { verifyWebhook } from '@clerk/express/webhooks';
import { userSyncService } from '../../application/services/user-sync.service.js';
import { UserModel } from '../../infrastructure/schemas/user.schema.js';

/**
 * ClerkWebhookController
 *
 * Presentation layer controller handling incoming webhook events from Clerk.
 * Responsible strictly for HTTP concerns: signature verification, parsing,
 * and routing payload data to the appropriate application domain service.
 */
class ClerkWebhookController {
  async handleWebhook(req, res) {
    let evt;
    try {
      // The verifyWebhook helper automatically reads the raw req.body and headers
      // using the CLERK_WEBHOOK_SIGNING_SECRET from the environment.
      evt = await verifyWebhook(req);
    } catch (err) {
      console.error('[Clerk Webhook] Verification failed:', err.message);
      return res.status(400).json({ message: 'Webhook verification failed' });
    }

    const { type: eventType, data } = evt;
    console.log(`[Clerk Webhook] Event received: ${eventType}`);

    try {
      switch (eventType) {
        case 'user.created':
        case 'user.updated':
          // Delegate to the Application layer service
          await userSyncService.syncClerkUserToMongo(data);
          break;

        case 'user.deleted':
          // Handle deletion (domain logic here handles hard deletion based on clerk ID)
          await UserModel.findOneAndDelete({ clerkId: data.id });
          break;

        default:
          console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
      }

      // Return 200 strictly so Svix marks the delivery as successful
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[Clerk Webhook] Handler error:', err);
      // Return 500 on failure so Svix will retry the webhook delivery
      return res
        .status(500)
        .json({ message: 'Internal error processing webhook' });
    }
  }
}

// Export singleton instance for routing
export const clerkWebhookController = new ClerkWebhookController();
