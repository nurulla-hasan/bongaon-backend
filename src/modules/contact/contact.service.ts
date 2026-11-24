import httpStatus from 'http-status';
import type { ContactStatus, Prisma } from '../../../generated/prisma/client';
import { sendContactReplyEmail } from '../../lib/email';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { buildPaginationMeta, calculatePagination } from '../../utils/pagination';
import type {
  CreateContactInput,
  GetContactsQueryInput,
  ReplyContactInput,
  UpdateContactStatusInput,
} from './contact.validation';

const CONTACT_PUBLIC_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  subject: true,
  message: true,
  status: true,
  adminReply: true,
  repliedAt: true,
  repliedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContactMessageSelect;

const CONTACT_SORT_MAP: Record<string, Prisma.ContactMessageOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
};

const createContactMessageIntoDB = async (payload: CreateContactInput) => {
  const contact = await prisma.contactMessage.create({
    data: {
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? '',
      subject: payload.subject ?? '',
      message: payload.message,
      status: 'NEW',
    },
    select: CONTACT_PUBLIC_SELECT,
  });

  return contact;
};

const getAllContactMessagesFromDB = async (query: GetContactsQueryInput) => {
  const { page, limit, searchTerm, status, sortBy } = query;
  const { page: pageNum, limit: limitNum, skip } = calculatePagination({ page, limit });

  const andConditions: Prisma.ContactMessageWhereInput[] = [];

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { message: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status: status as ContactStatus });
  }

  const whereCondition: Prisma.ContactMessageWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy = CONTACT_SORT_MAP[sortBy] || CONTACT_SORT_MAP.newest;

  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where: whereCondition }),
    prisma.contactMessage.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: CONTACT_PUBLIC_SELECT,
    }),
  ]);

  return {
    meta: buildPaginationMeta(pageNum, limitNum, total),
    data: messages,
  };
};

const getContactMessageByIdFromDB = async (id: string) => {
  const contact = await prisma.contactMessage.findUnique({
    where: { id },
    select: CONTACT_PUBLIC_SELECT,
  });

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  return contact;
};

const updateContactStatusIntoDB = async (id: string, payload: UpdateContactStatusInput) => {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status: payload.status as ContactStatus },
    select: CONTACT_PUBLIC_SELECT,
  });

  return updated;
};

const replyContactMessageIntoDB = async (
  id: string,
  payload: ReplyContactInput,
  adminId: string,
) => {
  const contact = await prisma.contactMessage.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      message: true,
    },
  });

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  if (!contact.email) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This contact message has no email address to reply to',
      'NO_EMAIL_ADDRESS',
    );
  }

  const emailSubject =
    payload.subject || `Re: ${contact.subject || 'Your inquiry at Bongaon Bajar'}`;

  await sendContactReplyEmail({
    email: contact.email,
    name: contact.name,
    subject: emailSubject,
    originalMessage: contact.message,
    replyMessage: payload.replyMessage,
  });

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: {
      adminReply: payload.replyMessage,
      repliedAt: new Date(),
      repliedById: adminId,
      status: 'REPLIED',
    },
    select: CONTACT_PUBLIC_SELECT,
  });

  return updated;
};

const deleteContactMessageFromDB = async (id: string) => {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  await prisma.contactMessage.delete({ where: { id } });

  return { message: 'Contact message deleted successfully' };
};

export const contactService = {
  createContactMessageIntoDB,
  getAllContactMessagesFromDB,
  getContactMessageByIdFromDB,
  updateContactStatusIntoDB,
  replyContactMessageIntoDB,
  deleteContactMessageFromDB,
};
