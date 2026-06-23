import { Student } from '../models/Student.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { httpError } from '../utils/httpError.js';

async function isStudentAllowed(studentId, user) {
  if (!user || user.role === 'Admin') return true;
  
  const teacherIdentifier = user.name || user.email;
  const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
  const classIds = teacherClasses.map(c => c._id);
  const classNames = teacherClasses.map(c => c.name);
  
  const student = await Student.findOne({ 
    _id: studentId, 
    $or: [
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ]
  });
  
  return !!student;
}

export async function index(req, res, next) {
  try {
    const isAllowed = await isStudentAllowed(req.params.studentId, req.user);
    if (!isAllowed) throw httpError(403, 'You can only view progress notes for your own students.');
    
    const student = await Student.findById(req.params.studentId).select('progressNotes name');
    if (!student) throw httpError(404, 'Student not found.');
    res.json(student.progressNotes);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const isAllowed = await isStudentAllowed(req.params.studentId, req.user);
    if (!isAllowed) throw httpError(403, 'You can only add progress notes for your own students.');
    
    if (!req.body.note) throw httpError(400, 'Progress note is required.');
    const student = await Student.findById(req.params.studentId);
    if (!student) throw httpError(404, 'Student not found.');
    
    // Add author info
    const note = {
      ...req.body,
      author: req.user ? (req.user.name || req.user.email) : 'Anonymous',
      createdAt: new Date()
    };
    
    student.progressNotes.push(note);
    await student.save();
    res.status(201).json(student.progressNotes.at(-1));
  } catch (error) {
    next(error);
  }
}
