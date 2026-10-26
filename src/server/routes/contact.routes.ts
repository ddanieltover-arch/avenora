/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Public Contact & Support Inquiry Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultEmailService } from '../services/email.service.ts';
import { defaultAuthService } from '../services/auth.service.ts';

export const contactRouter = Router();

const ContactInquirySchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(2, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  category: z.string().max(64).optional(),
});

const SupportTicketSchema = z.object({
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
  priority: z.enum(['STANDARD', 'HIGH', 'CRITICAL']).default('STANDARD'),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  category: z.string().max(64).optional(),
});

function buildReference(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

async function attachUserIfPresent(req: Request): Promise<void> {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  if (!token && req.cookies?.['avenora_session']) {
    token = req.cookies['avenora_session'];
  }
  if (!token) return;

  const user = await defaultAuthService.validateSession(token);
  if (user) {
    req.user = user;
    req.sessionToken = token;
  }
}

/**
 * POST /api/v1/contact
 * Public contact form — emails support inbox + acknowledgement to sender.
 */
contactRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ContactInquirySchema.parse(req.body);
    const reference = buildReference('AVN');

    const result = await defaultEmailService.sendContactInquiry({
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
      category: validated.category,
      reference,
    });

    res.status(200).json({
      status: 'success',
      reference,
      emailDispatched: result.sent || Boolean(result.skipped),
      message: 'Your message has been received. Our team will respond shortly.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/contact/support
 * Portal / help-center support ticket. Session optional — if present, uses profile.
 */
contactRouter.post('/support', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await attachUserIfPresent(req);

    const validated = SupportTicketSchema.parse(req.body);
    const ticketId = buildReference('TKT');

    const customerEmail = req.user?.email || validated.email;
    const customerName = req.user?.fullName || validated.name;

    if (!customerEmail || !customerName) {
      res.status(400).json({
        type: 'https://avenora.com/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Name and email are required when not signed in.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const subject = validated.category
      ? `[${validated.category}] ${validated.subject}`
      : validated.subject;

    const result = await defaultEmailService.sendSupportTicket({
      customerEmail,
      customerName,
      subject,
      message: validated.message,
      priority: validated.priority,
      ticketId,
    });

    res.status(200).json({
      status: 'success',
      ticketId,
      emailDispatched: result.sent || Boolean(result.skipped),
      message:
        'Your inquiry has been logged. A support specialist will respond using the contact details provided.',
    });
  } catch (err) {
    next(err);
  }
});
