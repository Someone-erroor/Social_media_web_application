import * as moodOrbitService from '../services/moodOrbit.service.js';

export const handleListRooms = async (req, res, next) => {
  try {
    const { mood, status, page, limit } = req.query;
    const result = await moodOrbitService.listRooms({
      mood,
      status,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetRoomById = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await moodOrbitService.getRoomById(roomId, req.user?._id);

    return res.status(200).json({
      success: true,
      room
    });
  } catch (err) {
    next(err);
  }
};

export const handleCreateRoom = async (req, res, next) => {
  try {
    const room = await moodOrbitService.createRoom(req.body, req.user._id);

    return res.status(201).json({
      success: true,
      message: 'Mood-Orbit room created successfully.',
      room
    });
  } catch (err) {
    next(err);
  }
};

export const handleJoinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const result = await moodOrbitService.joinRoom(roomId, req.user._id);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleLeaveRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const result = await moodOrbitService.leaveRoom(roomId, req.user._id);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handlePostRoomMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const message = await moodOrbitService.postRoomMessage(roomId, req.user._id, { content });

    return res.status(201).json({
      success: true,
      message
    });
  } catch (err) {
    next(err);
  }
};
