import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  // ═══ COURSES CRUD ═══

  async create(
    data: Partial<Course>,
    instructorId: string,
  ): Promise<CourseDocument> {
    return this.courseModel.create({
      ...data,
      instructor: new Types.ObjectId(instructorId),
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    instructor?: string;
  }): Promise<{
    data: CourseDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const filter: any = { isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.instructor)
      filter.instructor = new Types.ObjectId(query.instructor);
    if (query.search) filter.$text = { $search: query.search };

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await Promise.all([
      this.courseModel
        .find(filter)
        .populate('instructor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.courseModel.countDocuments(filter),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<CourseDocument> {
    const course = await this.courseModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .populate('instructor', 'name email avatar');
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(
    id: string,
    data: Partial<Course>,
    userId: string,
    role: string,
  ): Promise<CourseDocument> {
    const course = await this.findById(id);
    if (
      role !== 'admin' &&
      role !== 'super_admin' &&
      course.instructor.toString() !== userId
    )
      throw new ForbiddenException('Not authorized');
    Object.assign(course, data);
    return course.save();
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const course = await this.findById(id);
    if (
      role !== 'admin' &&
      role !== 'super_admin' &&
      course.instructor.toString() !== userId
    )
      throw new ForbiddenException('Not authorized');
    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();
  }

  // ═══ ENROLLMENTS ═══

  async enroll(userId: string, courseId: string): Promise<EnrollmentDocument> {
    const course = await this.findById(courseId);
    if (course.status !== 'published')
      throw new ForbiddenException('Course not available');

    const existing = await this.enrollmentModel.findOne({
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
    });
    if (existing) return existing;

    const enrollment = await this.enrollmentModel.create({
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
    });

    await this.courseModel.updateOne(
      { _id: course._id },
      { $inc: { enrollmentCount: 1 } },
    );

    return enrollment;
  }

  async getMyEnrollments(
    userId: string,
    query: { status?: string; page?: number; limit?: number },
  ): Promise<{ data: EnrollmentDocument[]; total: number }> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query.status) filter.status = query.status;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await Promise.all([
      this.enrollmentModel
        .find(filter)
        .populate({
          path: 'courseId',
          select: 'title titleAr thumbnail category level duration instructor',
          populate: { path: 'instructor', select: 'name avatar' },
        })
        .sort({ lastAccessedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.enrollmentModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  async updateProgress(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument> {
    const enrollment = await this.enrollmentModel.findOne({
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const course = await this.findById(courseId);

    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    const totalLessons = course.sections.reduce(
      (sum, s) => sum + s.lessons.length,
      0,
    );
    enrollment.progress = totalLessons
      ? Math.round((enrollment.completedLessons.length / totalLessons) * 100)
      : 0;
    enrollment.lastAccessedAt = new Date();

    if (enrollment.progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    return enrollment.save();
  }

  // ═══ DASHBOARD STATS ═══

  async getUserStats(userId: string): Promise<{
    enrolledCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalHours: number;
    averageProgress: number;
    certificates: number;
  }> {
    const uid = new Types.ObjectId(userId);

    const [enrollments, completedCount] = await Promise.all([
      this.enrollmentModel.find({ userId: uid }),
      this.enrollmentModel.countDocuments({ userId: uid, status: 'completed' }),
    ]);

    const totalHours = Math.round(
      enrollments.reduce((sum, e) => sum + (e.totalTimeSpent || 0), 0) / 60,
    );
    const avgProgress = enrollments.length
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.progress, 0) /
            enrollments.length,
        )
      : 0;

    return {
      enrolledCourses: enrollments.length,
      completedCourses: completedCount,
      inProgressCourses: enrollments.filter((e) => e.status === 'active')
        .length,
      totalHours,
      averageProgress: avgProgress,
      certificates: completedCount,
    };
  }

  // ═══ ADMIN STATS ═══

  async getAdminStats(): Promise<{
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    completionRate: number;
    topCourses: any[];
    recentEnrollments: any[];
  }> {
    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      topCourses,
      recentEnrollments,
    ] = await Promise.all([
      this.courseModel.countDocuments({ isDeleted: false }),
      this.courseModel.countDocuments({
        isDeleted: false,
        status: 'published',
      }),
      this.enrollmentModel.countDocuments(),
      this.enrollmentModel.countDocuments({ status: 'completed' }),
      this.courseModel
        .find({ isDeleted: false })
        .sort({ enrollmentCount: -1 })
        .limit(5)
        .select('title titleAr enrollmentCount rating'),
      this.enrollmentModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email avatar')
        .populate('courseId', 'title titleAr'),
    ]);

    return {
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completionRate: totalEnrollments
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0,
      topCourses,
      recentEnrollments,
    };
  }
}
