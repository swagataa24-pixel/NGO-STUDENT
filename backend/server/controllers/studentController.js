import * as studentService from '../services/studentService.js';
import { httpError } from '../utils/httpError.js';

export async function index(req, res, next) {
  try {
    res.json(await studentService.listStudents(req.query));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    if (!req.body.name) throw httpError(400, 'Student name is required.');
    res.status(201).json(await studentService.createStudent(req.body));
  } catch (error) {
    next(error);
  }
}

export async function show(req, res, next) {
  try {
    const student = await studentService.getStudent(req.params.id);
    if (!student) throw httpError(404, 'Student not found.');
    res.json(student);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    if (!student) throw httpError(404, 'Student not found.');
    res.json(student);
  } catch (error) {
    next(error);
  }
}

export async function archive(req, res, next) {
  try {
    const student = await studentService.archiveStudent(req.params.id, req.body.activeStatus ?? false);
    if (!student) throw httpError(404, 'Student not found.');
    res.json(student);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const student = await studentService.deleteStudent(req.params.id);
    if (!student) throw httpError(404, 'Student not found.');
    res.json({ message: 'Student deleted successfully.', student });
  } catch (error) {
    next(error);
  }
}
