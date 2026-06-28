import { Student } from '../models/Student.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { storeTrustedImage } from './cloudinaryService.js';
import mongoose from 'mongoose';

async function processPhotoUrl(photoUrl) {
  if (!photoUrl) return '';
  const result = await storeTrustedImage(photoUrl);
  return result.url;
}

function normalizeStudentPayload(payload) {
  const next = { ...payload };
  if (!mongoose.isValidObjectId(next.classId)) {
    delete next.classId;
  }
  return next;
}

export async function listStudents(filters = {}, user = null) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.activeOnly === 'true') query.activeStatus = true;
  
  // Teachers can only see students in their own classes; Admins see all
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    query.$or = [
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ];
    
    // If teacher has no classes, return empty array
    if (classIds.length === 0 && classNames.length === 0) {
      return [];
    }
  }
  
  return Student.find(query).sort({ createdAt: -1 });
}

export async function createStudent(payload, user = null) {
  // Teachers can only create students in their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => String(c._id));
    const classNames = teacherClasses.map(c => c.name);
    
    const isOwnClass = (payload.classId && classIds.includes(String(payload.classId))) || 
                       (payload.className && classNames.includes(payload.className));
    
    if (!isOwnClass) {
      throw new Error('You can only create students in your own classes.');
    }
  }
  
  payload = normalizeStudentPayload(payload);
  if (payload.photoUrl) {
    payload.photoUrl = await processPhotoUrl(payload.photoUrl);
  }
  return Student.create(payload);
}

export async function getStudent(id, user = null) {
  let query = { _id: id };
  
  // Teachers can only get students in their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    query.$or = [
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ];
  }
  
  return Student.findOne(query);
}

export async function updateStudent(id, payload, user = null) {
  // Teachers can only update students in their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    // Check if student is in teacher's class
    const student = await Student.findOne({ 
      _id: id, 
      $or: [
        { classId: { $in: classIds } },
        { className: { $in: classNames } }
      ]
    });
    
    if (!student) {
      throw new Error('Student not found or not in your classes.');
    }
    
    // If changing class, check new class is also teacher's
    if (payload.classId || payload.className) {
      const isNewClassOwn = (payload.classId && classIds.some(cid => String(cid) === String(payload.classId))) || 
                            (payload.className && classNames.includes(payload.className));
      
      if (!isNewClassOwn) {
        throw new Error('You can only move students to your own classes.');
      }
    }
  }
  
  payload = normalizeStudentPayload(payload);
  if (payload.photoUrl) {
    payload.photoUrl = await processPhotoUrl(payload.photoUrl);
  }
  return Student.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function archiveStudent(id, activeStatus = false, user = null) {
  let query = { _id: id };
  
  // Teachers can only archive students in their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    query.$or = [
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ];
  }
  
  return Student.findOneAndUpdate(query, { activeStatus }, { new: true });
}

export async function deleteStudent(id, user = null) {
  let query = { _id: id };
  
  // Teachers can only delete students in their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    query.$or = [
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ];
  }
  
  return Student.findOneAndDelete(query);
}
