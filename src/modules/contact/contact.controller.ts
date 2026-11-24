import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { contactService } from './contact.service';
import type { GetContactsQueryInput } from './contact.validation';

const createContactMessage: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.createContactMessageIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Message sent successfully',
    data: result,
  });
});

const getAllContactMessages: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.getAllContactMessagesFromDB(
    (req.validatedQuery ?? req.query) as GetContactsQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contact messages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getContactMessageById: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.getContactMessageByIdFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contact message retrieved successfully',
    data: result,
  });
});

const updateContactStatus: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.updateContactStatusIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contact message status updated successfully',
    data: result,
  });
});

const replyContactMessage: RequestHandler = catchAsync(async (req, res) => {
  const adminId = req.user?.id as string;
  const result = await contactService.replyContactMessageIntoDB(
    req.params.id as string,
    req.body,
    adminId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Reply email sent successfully',
    data: result,
  });
});

const deleteContactMessage: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.deleteContactMessageFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const contactController = {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactStatus,
  replyContactMessage,
  deleteContactMessage,
};
