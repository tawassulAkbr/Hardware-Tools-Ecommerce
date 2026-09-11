import { Request, Response } from 'express';
import { prisma } from '../index';
import fs from 'node:fs';
import path from 'node:path';

type FeedbackRecord = { id: number; type: string; name: string; email: string; subject: string; message: string; rating: number | null; status: string; createdAt: string; updatedAt: string };
const feedbackPath = path.resolve(__dirname, '../../data/local-feedback.json');
const readLocalFeedback = (): FeedbackRecord[] => {
  try { return JSON.parse(fs.readFileSync(feedbackPath, 'utf8')) as FeedbackRecord[]; } catch { return []; }
};
const writeLocalFeedback = (records: FeedbackRecord[]) => {
  fs.mkdirSync(path.dirname(feedbackPath), { recursive: true });
  fs.writeFileSync(feedbackPath, JSON.stringify(records, null, 2), 'utf8');
};

const clean = (value: unknown) => String(value || '').trim();

export const createFeedback = async (req: Request, res: Response): Promise<any> => {
  try {
    const type = clean(req.body.type).toUpperCase();
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const subject = clean(req.body.subject);
    const message = clean(req.body.message);
    const rating = req.body.rating === undefined || req.body.rating === '' ? null : Number(req.body.rating);

    if (!['COMPLAINT', 'SUGGESTION', 'REVIEW'].includes(type)) {
      return res.status(400).json({ error: 'Choose a complaint, suggestion, or review' });
    }
    if (!name || name.length > 100 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 160) {
      return res.status(400).json({ error: 'Enter a valid name and email address' });
    }
    if (!subject || subject.length > 160 || !message || message.length > 4000) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }
    if (type === 'REVIEW' && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars' });
    }
    if (type !== 'REVIEW' && rating !== null) {
      return res.status(400).json({ error: 'Ratings are only allowed for reviews' });
    }

    let feedback: { id: number };
    try {
      feedback = await prisma.customerFeedback.create({ data: { type, name, email, subject, message, rating } });
    } catch (databaseError) {
      console.error('Feedback database unavailable; saving locally.', databaseError);
      const now = new Date().toISOString();
      const records = readLocalFeedback();
      feedback = { id: -(records.length + 1) };
      records.unshift({ id: feedback.id, type, name, email, subject, message, rating, status: 'NEW', createdAt: now, updatedAt: now });
      writeLocalFeedback(records);
    }

    return res.status(201).json({ id: feedback.id, message: 'Thank you. Your feedback has been received.' });
  } catch (error) {
    console.error('Feedback creation failed', error);
    return res.status(500).json({ error: 'Unable to submit feedback right now' });
  }
};

export const listApprovedReviews = async (_req: Request, res: Response): Promise<any> => {
  try {
    const reviews = await prisma.customerFeedback.findMany({
      where: { type: 'REVIEW', status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 24,
      select: { id: true, name: true, subject: true, message: true, rating: true, createdAt: true },
    });
    return res.json(reviews);
  } catch (error) {
    console.error('Approved reviews lookup failed', error);
    return res.json(readLocalFeedback().filter((review) => review.type === 'REVIEW' && review.status === 'APPROVED').slice(0, 24));
  }
};

export const listFeedback = async (_req: Request, res: Response): Promise<any> => {
  try {
    return res.json(await prisma.customerFeedback.findMany({ orderBy: { createdAt: 'desc' } }));
  } catch (error) {
    console.error('Feedback database unavailable; reading local feedback.', error);
    return res.json(readLocalFeedback());
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response): Promise<any> => {
  const status = String(req.body.status || '').toUpperCase();
  if (!['NEW', 'APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid feedback status' });
  try {
    const feedback = await prisma.customerFeedback.update({ where: { id: Number(req.params.id) }, data: { status } });
    return res.json(feedback);
  } catch (error) {
    const records = readLocalFeedback();
    const index = records.findIndex((record) => record.id === Number(req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Feedback not found' });
    records[index].status = status;
    records[index].updatedAt = new Date().toISOString();
    writeLocalFeedback(records);
    return res.json(records[index]);
  }
};
