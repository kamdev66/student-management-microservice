import { Student, IStudent, EnrollmentStatus } from "../models/student.model";
import { FilterQuery, SortOrder } from "mongoose";

export interface StudentFilter {
  department?: string;
  enrollmentStatus?: EnrollmentStatus;
  grade?: string;
  search?: string;
  gpaMin?: number;
  gpaMax?: number;
}

export interface PaginationOpts {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class StudentRepository {
  async create(data: Partial<IStudent>): Promise<IStudent> {
    return new Student(data).save();
  }

  async findAll(
    filter: StudentFilter,
    opts: PaginationOpts,
  ): Promise<PaginatedResult<IStudent>> {
    const query: FilterQuery<IStudent> = {};

    if (filter.department) {
      query.department = filter.department;
    }

    if (filter.enrollmentStatus) {
      query.enrollmentStatus = filter.enrollmentStatus;
    }

    if (filter.grade) {
      query.grade = filter.grade;
    }

    if (filter.gpaMin !== undefined || filter.gpaMax !== undefined) {
      query.gpa = {};
      if (filter.gpaMin !== undefined) {
        (query.gpa as any).$gte = filter.gpaMin;
      }
      if (filter.gpaMax !== undefined) {
        (query.gpa as any).$lte = filter.gpaMax;
      }
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const skip = (opts.page - 1) * opts.limit;

    const sort: Record<string, SortOrder> = {
      [opts.sortBy]: opts.sortOrder === "asc" ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      Student.find(query)
        .sort(sort)
        .skip(skip)
        .limit(opts.limit)
        .lean<IStudent[]>() // ✅ correct
        .exec(),
      Student.countDocuments(query),
    ]);

    return {
      data,
      total,
      page: opts.page,
      limit: opts.limit,
      totalPages: Math.ceil(total / opts.limit),
    };
  }

  findById(id: string): Promise<IStudent | null> {
    return Student.findById(id).exec();
  }

  findByEmail(email: string): Promise<IStudent | null> {
    return Student.findOne({ email: email.toLowerCase() }).exec();
  }

  update(id: string, data: Partial<IStudent>): Promise<IStudent | null> {
    return Student.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).exec();
  }

  delete(id: string): Promise<IStudent | null> {
    return Student.findByIdAndDelete(id).exec();
  }

  async exists(filter: FilterQuery<IStudent>): Promise<boolean> {
    return !!(await Student.exists(filter));
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
  }> {
    const [total, byStatus, byDepartment] = await Promise.all([
      Student.countDocuments(),
      Student.aggregate([
        { $group: { _id: "$enrollmentStatus", count: { $sum: 1 } } },
      ]),
      Student.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s: any) => [s._id, s.count])),
      byDepartment: Object.fromEntries(
        byDepartment.map((d: any) => [d._id, d.count]),
      ),
    };
  }
}

export const studentRepository = new StudentRepository();
