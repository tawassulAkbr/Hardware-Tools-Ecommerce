import { Request, Response } from 'express';
import { prisma } from '../index';

const clean = (value: unknown) => String(value || '').trim();

export const createFeedback = async (req: Request, res: Response): Promise<any> => {
  try {
    const type = clean(req.body.type).toUpperCase();
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const subject = clean(req.body.subject);
    const message = clean(req.body.message);

    if (!['COMPLAINT', 'SUGGESTION'].includes(type)) {
      return res.status(400).json({ error: 'Choose a complaint or suggestion' });
    }
    if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 160) {
      return res.status(400).json({ error: 'Enter a valid name and email address' });
    }
    if (!subject || subject.length > 160 || !message || message.length > 4000) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const feedback = await prisma.customerFeedback.create({
      data: { type, name, email, subject, message },
    });

    return res.status(201).json({ id: feedback.id, message: 'Thank you. Your feedback has been received.' });
  } catch (error) {
    console.error('Feedback creation failed', error);
    return res.status(500).json({ error: 'Unable to submit feedback right now' });
  }
};
