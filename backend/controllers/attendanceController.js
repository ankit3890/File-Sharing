const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Mark attendance for current day
// @route   POST /api/attendance/mark
// @access  Private
const markAttendance = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // Local date YYYY-MM-DD

        const existing = await Attendance.findOne({ userId, date });
        if (existing) {
            const statusMsg = existing.status === 'pending' ? 'already submitted and awaiting approval' : 'already marked for today';
            return res.status(400).json({ message: `Attendance ${statusMsg}` });
        }

        const attendance = await Attendance.create({
            userId,
            date,
            status: 'pending'
        });

        if (req.logAction) {
            await req.logAction({
                action: 'MARK_ATTENDANCE',
                details: `User ${req.user.userId} marked attendance for ${date}`
            });
        }

        res.status(201).json(attendance);
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user attendance history
// @route   GET /api/attendance/my
// @access  Private
const getUserAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all attendance records (Admin only)
// @route   GET /api/attendance/all
// @access  Private/Admin
const getAllAttendance = async (req, res, next) => {
    try {
        const { startDate, endDate, userId, status } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        if (userId && userId !== 'all') query.userId = userId;
        if (status && status !== 'all' && status !== 'not_marked') query.status = status;

        // Fetch actual attendance records
        const attendance = await Attendance.find(query)
            .populate('userId', 'userId')
            .populate('reviewedBy', 'userId')
            .sort({ date: -1 });

        const isAllUsersSelected = (!userId || userId === 'all');
        const now = new Date();
        const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const effectiveStartDate = startDate || localToday;
        const effectiveEndDate = endDate || effectiveStartDate;

        if (isAllUsersSelected) {
            const allUsers = await User.find({ role: 'user' }).select('userId');
            const today = new Date().toISOString().split('T')[0];
            
            // Generate list of dates to check
            const datesToCheck = [];
            let curr = new Date(effectiveStartDate);
            let last = new Date(effectiveEndDate);
            let safety = 0;
            while (curr <= last && safety < 31) {
                datesToCheck.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
                safety++;
            }

            // Create a lookup for existing records: Map<Date, Set<UserId>>
            const existingLookup = new Map();
            attendance.forEach(rec => {
                const d = rec.date;
                if (!existingLookup.has(d)) existingLookup.set(d, new Set());
                existingLookup.get(d).add(rec.userId?._id?.toString() || rec.userId?.toString());
            });

            const virtualRecords = [];
            datesToCheck.forEach(dateStr => {
                const markedUserIds = existingLookup.get(dateStr) || new Set();
                const dateObj = new Date(dateStr);
                const isSunday = dateObj.getDay() === 0;
                const isPast = dateStr < localToday;

                allUsers.forEach(u => {
                    if (!markedUserIds.has(u._id.toString())) {
                        let status = 'not_marked';
                        if (isPast && !isSunday) {
                            status = 'rejected'; // Auto-mark as absent
                        }

                        virtualRecords.push({
                            _id: `virtual-${u._id}-${dateStr}`,
                            userId: u,
                            date: dateStr,
                            status: status,
                            isVirtual: true,
                            autoAbsent: isPast && !isSunday,
                            isSunday
                        });
                    }
                });
            });

            // Combine and Re-sort by date DESC
            let combined = [...attendance];
            if (!status || status === 'all' || status === 'not_marked') {
                const filteredVirtual = status === 'not_marked' 
                    ? virtualRecords.filter(v => v.status === 'not_marked')
                    : virtualRecords;
                combined = [...combined, ...filteredVirtual];
            } else if (status === 'rejected') {
                // Also include auto-absent virtual records in rejected filter
                combined = [...combined, ...virtualRecords.filter(v => v.status === 'rejected')];
            }

            combined.sort((a, b) => b.date.localeCompare(a.date));

            // If specifically filtering for 'not_marked', only return relevant virtual ones
            if (status === 'not_marked') {
                return res.json(virtualRecords.filter(v => v.status === 'not_marked'));
            }

            return res.json(combined);
        }

        res.json(attendance);
    } catch (error) {
        next(error);
    }
};

// @desc    Update attendance status (Admin only)
// @route   PUT /api/attendance/:id/status
// @access  Private/Admin
const updateAttendanceStatus = async (req, res, next) => {
    try {
        const { status, adminRemark } = req.body;
        const recordId = req.params.id;
        let attendance;

        // Check if this is a virtual record (admin marking for someone who hasn't submitted)
        if (recordId.startsWith('virtual-')) {
            const parts = recordId.split('-');
            // Format: virtual-USERID-YYYY-MM-DD
            const actualUserId = parts[1];
            const targetDate = parts.slice(2).join('-'); // Reconstruct YYYY-MM-DD
            
            // Check if they happened to submit in the meantime
            attendance = await Attendance.findOne({ userId: actualUserId, date: targetDate });
            
            if (!attendance) {
                // Create new record for the specific target date
                attendance = new Attendance({
                    userId: actualUserId,
                    date: targetDate,
                    status,
                    adminRemark
                });
            }
        } else {
            attendance = await Attendance.findById(recordId);
        }

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        attendance.status = status;
        attendance.adminRemark = adminRemark !== undefined ? adminRemark : attendance.adminRemark;
        attendance.reviewedBy = req.user._id;
        attendance.reviewedAt = Date.now();

        await attendance.save();
        
        // Re-populate for response consistency
        await attendance.populate('userId', 'userId');

        if (req.logAction) {
            await req.logAction({
                action: 'UPDATE_ATTENDANCE_STATUS',
                targetUser: attendance.userId._id,
                details: `Admin ${req.user.userId} updated attendance status for ${attendance.userId.userId} on ${attendance.date} to ${status}`
            });
        }

        res.json(attendance);
    } catch (error) {
        next(error);
    }
};

// @desc    Download attendance report (Admin only)
// @route   GET /api/attendance/report/download
// @access  Private/Admin
const downloadReport = async (req, res, next) => {
    try {
        const { startDate, endDate, userId, status } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        if (userId && userId !== 'all') query.userId = userId;
        if (status && status !== 'all' && status !== 'not_marked') query.status = status;

        const records = await Attendance.find(query)
            .populate('userId', 'userId')
            .populate('reviewedBy', 'userId')
            .sort({ userId: 1, date: 1 });

        // Logic for Virtual Records (Matches getAllAttendance)
        let finalRecords = [...records];
        const isAllUsersSelected = (!userId || userId === 'all');
        
        if (isAllUsersSelected) {
            const allUsers = await User.find({ role: 'user' }).select('userId');
            const now = new Date();
            const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const effectiveStartDate = startDate || localToday;
            const effectiveEndDate = endDate || effectiveStartDate;

            // Generate list of dates to check (Limit to 31 days)
            const datesToCheck = [];
            let curr = new Date(effectiveStartDate);
            let last = new Date(effectiveEndDate);
            let safety = 0;
            while (curr <= last && safety < 31) {
                datesToCheck.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
                safety++;
            }

            const existingLookup = new Map();
            records.forEach(rec => {
                const d = rec.date;
                if (!existingLookup.has(d)) existingLookup.set(d, new Set());
                existingLookup.get(d).add(rec.userId?._id?.toString() || rec.userId?.toString());
            });

            const virtualRecords = [];
            datesToCheck.forEach(dateStr => {
                const markedUserIds = existingLookup.get(dateStr) || new Set();
                const dateObj = new Date(dateStr);
                const isSunday = dateObj.getDay() === 0;
                const isPast = dateStr < localToday;

                allUsers.forEach(u => {
                    if (!markedUserIds.has(u._id.toString())) {
                        let vStatus = 'not_marked';
                        if (isPast && !isSunday) vStatus = 'rejected';

                        virtualRecords.push({
                            userId: u,
                            date: dateStr,
                            status: vStatus,
                            isVirtual: true,
                            autoAbsent: isPast && !isSunday,
                            isSunday,
                            markedAt: null,
                            reviewedBy: null,
                            adminRemark: isPast && !isSunday ? 'System Auto-Marked (Absent)' : (isSunday ? 'Weekly Holiday' : '')
                        });
                    }
                });
            });

            if (!status || status === 'all' || status === 'not_marked') {
                const filteredVirtual = status === 'not_marked' 
                    ? virtualRecords.filter(v => v.status === 'not_marked')
                    : virtualRecords;
                finalRecords = [...finalRecords, ...filteredVirtual];
            } else if (status === 'rejected') {
                finalRecords = [...finalRecords, ...virtualRecords.filter(v => v.status === 'rejected')];
            }
        }

        // Re-sort final records for output consistency
        finalRecords.sort((a, b) => b.date.localeCompare(a.date) || (a.userId?.userId || '').localeCompare(b.userId?.userId || ''));

        // Calculate Summaries
        const summaries = {};
        finalRecords.forEach(r => {
            const uid = r.userId?.userId || 'Unknown';
            if (!summaries[uid]) {
                summaries[uid] = { total: 0, present: 0, pending: 0, rejected: 0, missing: 0 };
            }
            summaries[uid].total++;
            if (r.status === 'approved') summaries[uid].present++;
            else if (r.status === 'pending') summaries[uid].pending++;
            else if (r.status === 'rejected') summaries[uid].rejected++;
            else if (r.status === 'not_marked') summaries[uid].missing++;
        });

        const rangeText = (startDate || endDate) ? ` (${startDate || ''} to ${endDate || ''})` : '';
        let csv = '';

        // If Single User Summary
        if (userId && userId !== 'all' && Object.keys(summaries).length === 1) {
            const uid = Object.keys(summaries)[0];
            const s = summaries[uid];
            const percent = s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : '0.00';
            csv += `User,${uid}\n`;
            csv += `Report Period,${startDate || 'All Time'} to ${endDate || 'Present'}\n`;
            csv += `Total Days,${s.total}\n`;
            csv += `Total Present,${s.present}\n`;
            csv += `Total Absent/Rejected,${s.rejected}\n`;
            csv += `Not Marked/Holiday,${s.missing}\n`;
            csv += `Attendance Percentage,${percent}%\n\n`;
        } else {
            csv += `Attendance Summary - All Users${rangeText}\n`;
            csv += `User ID,Total Days,Total Present,Total Absent/Rejected,Not Marked,Percentage\n`;
            Object.keys(summaries).forEach(uid => {
                const s = summaries[uid];
                const percent = s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : '0.00';
                csv += `${uid},${s.total},${s.present},${s.rejected},${s.missing},${percent}%\n`;
            });
            csv += `\n`;
        }

        // Data Table
        csv += 'Day-Wise Detailed Attendance Report\n';
        csv += 'User ID,Date,Status,Marked At,Reviewed By,Admin Remark\n';
        finalRecords.forEach(r => {
            let markedAtFormatted = 'N/A';
            if (r.markedAt) {
                const d = new Date(r.markedAt);
                markedAtFormatted = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
            
            const dateParts = r.date.split('-');
            const displayDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : r.date;

            csv += `"${r.userId?.userId || 'Unknown'}","${displayDate}","${r.status}","${markedAtFormatted}","${r.reviewedBy?.userId || (r.isVirtual ? 'System' : '')}","${r.adminRemark || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);

        if (req.logAction) {
            await req.logAction({
                action: 'DOWNLOAD_ATTENDANCE_REPORT',
                details: `Admin ${req.user.userId} downloaded attendance report inclusive of virtual records`
            });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    markAttendance,
    getUserAttendance,
    getAllAttendance,
    updateAttendanceStatus,
    downloadReport
};
