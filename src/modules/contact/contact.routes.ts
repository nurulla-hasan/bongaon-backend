import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate, validateQuery } from '../../middlewares/validate';
import { contactController } from './contact.controller';
import {
  createContactSchema,
  getContactsQuerySchema,
  replyContactSchema,
  updateContactStatusSchema,
} from './contact.validation';

export const contactRouter = Router();

// Submit contact message (Public)
contactRouter.post('/', validate(createContactSchema), contactController.createContactMessage);

// Get all contact messages (Admin)
contactRouter.get(
  '/',
  auth('ADMIN'),
  validateQuery(getContactsQuerySchema),
  contactController.getAllContactMessages,
);

// Get contact message by ID (Admin)
contactRouter.get('/:id', auth('ADMIN'), contactController.getContactMessageById);

// Update contact message status (Admin)
contactRouter.patch(
  '/:id/status',
  auth('ADMIN'),
  validate(updateContactStatusSchema),
  contactController.updateContactStatus,
);

// Reply to contact message via email (Admin)
contactRouter.post(
  '/:id/reply',
  auth('ADMIN'),
  validate(replyContactSchema),
  contactController.replyContactMessage,
);

// Delete contact message (Admin)
contactRouter.delete('/:id', auth('ADMIN'), contactController.deleteContactMessage);
