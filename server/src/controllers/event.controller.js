import {
  getActiveEvents as getActiveEventsService,
  getEventById as getEventByIdService,
  submitEventAnswer as submitEventAnswerService,
  adminCreateEvent as adminCreateEventService
} from '../services/event.service.js';

export const getActiveEvents = async (req, res, next) => {
  try {
    const result = await getActiveEventsService(req.user?._id || null);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await getEventByIdService(eventId, req.user?._id || null);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 404 || error.status === 400) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const rawAnswer = typeof req.body.answer === 'object' && req.body.answer !== null ? req.body.answer.answer : req.body.answer;
    const result = await submitEventAnswerService(eventId, req.user._id, rawAnswer);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const adminCreate = async (req, res, next) => {
  try {
    const { title, description, bannerUrl, clues, solution, startDate, endDate } = req.body;
    const result = await adminCreateEventService({
      adminUserId: req.user._id,
      title,
      description,
      bannerUrl,
      clues,
      solution,
      startDate,
      endDate
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  getActiveEvents,
  getEvent,
  submitAnswer,
  adminCreate
};

