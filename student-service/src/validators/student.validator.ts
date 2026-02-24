import { Schema } from '../shared-local/validator';

export const createStudentSchema: Schema = {
  firstName:        { type: 'string', required: true, minLength: 2, maxLength: 50, trim: true },
  lastName:         { type: 'string', required: true, minLength: 2, maxLength: 50, trim: true },
  email:            { type: 'email',  required: true },
  phone:            { type: 'string', required: false, pattern: /^\+?[\d\s-]{10,15}$/ },
  dateOfBirth:      { type: 'date',   required: true },
  gender:           { type: 'string', required: true, enum: ['male', 'female', 'other'] },
  grade:            { type: 'string', required: true, maxLength: 20 },
  department:       { type: 'string', required: true, maxLength: 100 },
  enrollmentStatus: { type: 'string', required: false, enum: ['active', 'inactive', 'graduated', 'suspended'], default: 'active' },
  gpa:              { type: 'number', required: false, min: 0, max: 4.0 },
  subjects:         { type: 'array',  required: false, default: [] },
  guardianName:     { type: 'string', required: false, maxLength: 100 },
  guardianPhone:    { type: 'string', required: false },
};

export const updateStudentSchema: Schema = {
  firstName:        { type: 'string', required: false, minLength: 2, maxLength: 50, trim: true },
  lastName:         { type: 'string', required: false, minLength: 2, maxLength: 50, trim: true },
  email:            { type: 'email',  required: false },
  phone:            { type: 'string', required: false },
  grade:            { type: 'string', required: false, maxLength: 20 },
  department:       { type: 'string', required: false, maxLength: 100 },
  enrollmentStatus: { type: 'string', required: false, enum: ['active', 'inactive', 'graduated', 'suspended'] },
  gpa:              { type: 'number', required: false, min: 0, max: 4.0 },
  subjects:         { type: 'array',  required: false },
  guardianName:     { type: 'string', required: false },
  guardianPhone:    { type: 'string', required: false },
};

export const querySchema: Schema = {
  page:             { type: 'number', required: false, min: 1, default: 1 },
  limit:            { type: 'number', required: false, min: 1, max: 100, default: 10 },
  sortBy:           { type: 'string', required: false, enum: ['firstName', 'lastName', 'createdAt', 'gpa', 'enrollmentNumber'], default: 'createdAt' },
  sortOrder:        { type: 'string', required: false, enum: ['asc', 'desc'], default: 'desc' },
  search:           { type: 'string', required: false },
  department:       { type: 'string', required: false },
  enrollmentStatus: { type: 'string', required: false, enum: ['active', 'inactive', 'graduated', 'suspended'] },
  grade:            { type: 'string', required: false },
};
