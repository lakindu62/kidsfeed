import { Router } from 'express';
import express from 'express';
import { clerkWebhookController } from './clerk.webhook.controller.js';

const clerkWebhookRouter = Router();

// Endpoint for Clerk Webhooks
// It is imperative that this route parses the raw buffer from the request so
// the Svix signature verification matches exact bytes. We apply express.raw()
// specifically here instead of applying it globally.
clerkWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  clerkWebhookController.handleWebhook.bind(clerkWebhookController)
);

export { clerkWebhookRouter };
