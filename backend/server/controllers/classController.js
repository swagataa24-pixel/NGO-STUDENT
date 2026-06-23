import * as classService from '../services/classService.js';
import { httpError } from '../utils/httpError.js';

export async function index(req, res, next) {
  try {
    res.json(await classService.listClasses(req.query, req.user));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    if (!req.body.name) throw httpError(400, 'Class name is required.');
    res.status(201).json(await classService.createClass(req.body, req.user));
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const classGroup = await classService.updateClass(req.params.id, req.body, req.user);
    if (!classGroup) throw httpError(404, 'Class not found.');
    res.json(classGroup);
  } catch (error) {
    next(error);
  }
}

export async function archive(req, res, next) {
  try {
    const classGroup = await classService.archiveClass(req.params.id, req.body.activeStatus ?? false, req.user);
    if (!classGroup) throw httpError(404, 'Class not found.');
    res.json(classGroup);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await classService.deleteClass(req.params.id, req.user);
    if (!result) throw httpError(404, 'Class not found.');
    res.json({ message: 'Class and related records deleted successfully.', ...result });
  } catch (error) {
    next(error);
  }
}
