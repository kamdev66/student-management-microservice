import mongoose, { Document, Schema } from 'mongoose';

export enum Gender { MALE = 'male', FEMALE = 'female', OTHER = 'other' }
export enum EnrollmentStatus {
  ACTIVE = 'active', INACTIVE = 'inactive',
  GRADUATED = 'graduated', SUSPENDED = 'suspended'
}

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string; lastName: string; email: string; phone?: string;
  dateOfBirth: Date; gender: Gender;
  address?: { street: string; city: string; state: string; country: string; zipCode: string };
  enrollmentNumber: string; grade: string; department: string;
  enrollmentStatus: EnrollmentStatus; gpa?: number; subjects: string[];
  guardianName?: string; guardianPhone?: string;
  createdBy: string; updatedBy?: string;
  createdAt: Date; updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  firstName:   { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  lastName:    { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String },
  dateOfBirth: { type: Date, required: true },
  gender:      { type: String, enum: Object.values(Gender), required: true },
  address:     { street: String, city: String, state: String, country: String, zipCode: String },
  enrollmentNumber: { type: String, unique: true },
  grade:       { type: String, required: true },
  department:  { type: String, required: true },
  enrollmentStatus: { type: String, enum: Object.values(EnrollmentStatus), default: EnrollmentStatus.ACTIVE },
  gpa:         { type: Number, min: 0, max: 4.0 },
  subjects:    { type: [String], default: [] },
  guardianName: String, guardianPhone: String,
  createdBy:   { type: String, required: true },
  updatedBy:   String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

StudentSchema.virtual('fullName').get(function() { return this.firstName + ' ' + this.lastName; });
// StudentSchema.index({ email: 1 });
StudentSchema.index({ department: 1 });
StudentSchema.index({ enrollmentStatus: 1 });
StudentSchema.index({ firstName: 'text', lastName: 'text', email: 'text', department: 'text' });

StudentSchema.pre('save', async function(next) {
  if (!this.enrollmentNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Student').countDocuments();
    this.enrollmentNumber = 'STU-' + year + '-' + String(count + 1).padStart(5, '0');
  }
  next();
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
