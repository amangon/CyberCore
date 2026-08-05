const Report = require('../models/Report');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all reports with filtering, sorting, pagination
 * @route   GET /api/reports
 * @access  Private
 */
exports.getReports = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, category, status, search, sort } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (req.user.organization) {
    filter.organization = req.user.organization;
  }
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { reportId: { $regex: search, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
    severity: { severity: 1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  const [reports, total] = await Promise.all([
    Report.find(filter).sort(sortOrder).skip(skip).limit(limitNum).lean(),
    Report.countDocuments(filter),
  ]);

  const data = reports.map((r) => ({
    id: r._id.toString(),
    reportId: r.reportId,
    title: r.title,
    description: r.description || '',
    category: r.category || 'Executive',
    status: r.status || 'Draft',
    severity: r.severity || 'medium',
    format: r.format || 'PDF',
    author: r.author || '',
    department: r.department || '',
    tags: r.tags || [],
    isArchived: r.isArchived || false,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data,
  });
});

/**
 * @desc    Get a single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
exports.getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id).lean();

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      id: report._id.toString(),
      reportId: report.reportId,
      title: report.title,
      description: report.description || '',
      category: report.category || 'Executive',
      status: report.status || 'Draft',
      severity: report.severity || 'medium',
      format: report.format || 'PDF',
      author: report.author || '',
      department: report.department || '',
      tags: report.tags || [],
      payload: report.payload || null,
      isArchived: report.isArchived || false,
      publishedAt: report.publishedAt ? report.publishedAt.toISOString() : null,
      createdAt: report.createdAt ? report.createdAt.toISOString() : null,
      updatedAt: report.updatedAt ? report.updatedAt.toISOString() : null,
    },
  });
});

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private
 */
exports.createReport = asyncHandler(async (req, res, next) => {
  const { title, description, category, status, severity, format, author, department, tags, payload } = req.body;

  if (!title) {
    return next(new ErrorResponse('Report title is required', 400));
  }

  const report = await Report.create({
    title,
    description: description || '',
    category: category || 'Executive',
    status: status || 'Draft',
    severity: severity || 'medium',
    format: format || 'PDF',
    author: author || (req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : ''),
    department: department || '',
    tags: Array.isArray(tags) ? tags : [],
    payload: payload || {},
    organization: req.user.organization,
    createdBy: req.user.id,
    publishedAt: status === 'Completed' ? new Date() : null,
  });

  res.status(201).json({
    success: true,
    data: {
      id: report._id.toString(),
      reportId: report.reportId,
      title: report.title,
      description: report.description || '',
      category: report.category,
      status: report.status,
      severity: report.severity,
      format: report.format,
      author: report.author || '',
      department: report.department || '',
      tags: report.tags || [],
      isArchived: report.isArchived || false,
      publishedAt: report.publishedAt ? report.publishedAt.toISOString() : null,
      createdAt: report.createdAt ? report.createdAt.toISOString() : null,
      updatedAt: report.updatedAt ? report.updatedAt.toISOString() : null,
    },
  });
});

/**
 * @desc    Update a report
 * @route   PUT /api/reports/:id
 * @access  Private
 */
exports.updateReport = asyncHandler(async (req, res, next) => {
  let report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  const fieldsToUpdate = {};
  [
    'title', 'description', 'category', 'status', 'severity',
    'format', 'author', 'department', 'tags', 'payload'
  ].forEach((field) => {
    if (req.body[field] !== undefined) {
      fieldsToUpdate[field] = req.body[field];
    }
  });

  if (fieldsToUpdate.status === 'Completed' && report.status !== 'Completed') {
    fieldsToUpdate.publishedAt = new Date();
  }

  report = await Report.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: {
      id: report._id.toString(),
      reportId: report.reportId,
      title: report.title,
      description: report.description || '',
      category: report.category,
      status: report.status,
      severity: report.severity,
      format: report.format,
      author: report.author || '',
      department: report.department || '',
      tags: report.tags || [],
      isArchived: report.isArchived || false,
      publishedAt: report.publishedAt ? report.publishedAt.toISOString() : null,
      createdAt: report.createdAt ? report.createdAt.toISOString() : null,
      updatedAt: report.updatedAt ? report.updatedAt.toISOString() : null,
    },
  });
});

/**
 * @desc    Delete a report
 * @route   DELETE /api/reports/:id
 * @access  Private
 */
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findByIdAndDelete(req.params.id);

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { message: 'Report deleted successfully' },
  });
});

/**
 * @desc    Archive / restore a report
 * @route   PUT /api/reports/:id/archive
 * @access  Private
 */
exports.archiveReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  const isArchived = req.body.isArchived !== undefined ? Boolean(req.body.isArchived) : true;
  report.isArchived = isArchived;
  if (isArchived) {
    report.status = 'Archived';
  } else if (report.status === 'Archived') {
    report.status = 'Draft';
  }
  await report.save();

  res.status(200).json({
    success: true,
    data: {
      id: report._id.toString(),
      reportId: report.reportId,
      title: report.title,
      category: report.category,
      status: report.status,
      severity: report.severity,
      isArchived: report.isArchived || false,
      updatedAt: report.updatedAt ? report.updatedAt.toISOString() : null,
    },
  });
});

/**
 * @desc    Get report stats for KPIs
 * @route   GET /api/reports/stats
 * @access  Private
 */
exports.getReportStats = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.user.organization) {
    filter.organization = req.user.organization;
  }

  const [total, completed, scheduled, failed, archived, totalReports, recent] = await Promise.all([
    Report.countDocuments({ ...filter, status: 'Completed' }),
    Report.countDocuments({ ...filter, status: 'Completed' }),
    Report.countDocuments({ ...filter, status: 'Scheduled' }),
    Report.countDocuments({ ...filter, status: 'Failed' }),
    Report.countDocuments({ ...filter, isArchived: true }),
    Report.countDocuments(filter),
    Report.find(filter).sort({ createdAt: -1 }).limit(1).lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      total: totalReports,
      completed,
      scheduled,
      failed,
      archived,
      lastGenerated: recent[0]?.createdAt ? recent[0].createdAt.toISOString() : null,
    },
  });
});
