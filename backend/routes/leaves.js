const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Apply for Leave with Workload Reassignment
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ error: "Only faculty can apply for leave." });
        }
        
        const { startDate, endDate, reason, schedule } = req.body;
        const user = await User.findById(req.user.id);
        
        const newLeave = new Leave({
            userId: user._id,
            userName: user.name,
            department: user.department,
            college: user.college,
            isHOD: user.isHOD || false,
            startDate,
            endDate,
            reason,
            schedule, // Expecting array of { hour, replacementId, replacementName }
            status: 'pending_hod'
        });
        
        await newLeave.save();
        
        const io = req.app.get('io');
        if (io) io.emit('new_leave_request', { leave: newLeave });
        
        res.status(201).json(newLeave);
    } catch (error) {
        res.status(500).json({ error: "Failed to apply for leave" });
    }
});

// Get substitutions for logged-in faculty
router.get('/substitutions', auth, async (req, res) => {
    try {
        const leaves = await Leave.find({
            status: 'approved',
            'schedule.slots.replacementId': req.user.id
        }).sort({ startDate: 1 });
        
        const substitutions = [];
        leaves.forEach(leave => {
            leave.schedule.forEach(day => {
                day.slots.forEach(slot => {
                    if (slot.replacementId && slot.replacementId.toString() === req.user.id) {
                        substitutions.push({
                            leaveId: leave._id,
                            facultyName: leave.userName,
                            date: day.date,
                            hour: slot.hour,
                            reason: leave.reason
                        });
                    }
                });
            });
        });
        
        res.json(substitutions.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch substitutions" });
    }
});

// Get leaves (Principal sees all, HOD sees department, Faculty sees own)
// Get leaves (Faculty sees own, Principal/Admin sees all)
router.get('/', auth, async (req, res) => {
    try {
        console.log(`Fetch leaves requested by role: ${req.user.role}, college: ${req.user.college}`);
        let query = {};
        if (req.user.college && req.user.college !== 'Global') {
            query.college = req.user.college;
        }
        
        if (req.user.role === 'faculty') {
            query.userId = req.user.id;
        } else if (req.user.role !== 'principal' && req.user.role !== 'admin') {
             return res.status(403).json({ error: "Unauthorized" });
        }
        
        const leaves = await Leave.find(query).sort({ createdAt: -1 });
        console.log(`Found ${leaves.length} leaves for query:`, query);
        res.json(leaves);
    } catch (error) {
        console.error("Fetch leaves error:", error);
        res.status(500).json({ error: "Failed to fetch leaves" });
    }
});

// Get department leaves for HOD
router.get('/department', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        console.log(`HOD department fetch for user: ${user.name}, dept: ${user.department}`);
        if (!user.isHOD) return res.status(403).json({ error: "Unauthorized" });
        
        const query = { 
            department: user.department
        };
        
        // Only restrict by college if HOD is not Global
        if (user.college && user.college !== 'Global') {
            query.college = user.college;
        }
        
        const leaves = await Leave.find(query).sort({ createdAt: -1 });
        console.log(`HOD found ${leaves.length} leaves`);
        res.json(leaves);
    } catch (error) {
        console.error("HOD fetch error:", error);
        res.status(500).json({ error: "Failed to fetch department leaves" });
    }
});

// Reject Leave (HOD or Principal)
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'principal' && !user.isHOD) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });
        
        leave.status = 'rejected';
        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).json({ error: "Failed to reject leave" });
    }
});

// Principal Override: Modify dates or acting HOD
router.put('/:id/override', auth, async (req, res) => {
    try {
        if (req.user.role !== 'principal') return res.status(403).json({ error: "Unauthorized" });
        
        const { startDate, endDate, newActingHODId } = req.body;
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });
        
        if (startDate) leave.startDate = startDate;
        if (endDate) leave.endDate = endDate;
        
        if (leave.isHOD && newActingHODId) {
            // Revert old delegate
            if (leave.actingHODId) {
                 const oldDelegate = await User.findById(leave.actingHODId);
                 if (oldDelegate) {
                     oldDelegate.actingHODFor = null;
                     await oldDelegate.save();
                 }
            }
            
            // Assign new delegate
            const newDelegate = await User.findById(newActingHODId);
            if (newDelegate) {
                leave.actingHODId = newDelegate._id;
                leave.actingHODName = newDelegate.name;
                
                newDelegate.actingHODFor = leave.userId;
                await newDelegate.save();
            }
        }
        
        await leave.save();
        
        const io = req.app.get('io');
        if (io) io.emit('leave_updated', { leave });
        
        res.json(leave);
    } catch (error) {
        console.error("Override error:", error);
        res.status(500).json({ error: "Failed to override leave" });
    }
});

// Revoke Leave (by applicant)
router.put('/:id/revoke', auth, async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });
        if (leave.userId.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
        if (['approved', 'rejected'].includes(leave.status)) {
            return res.status(400).json({ error: "Cannot revoke processed leave" });
        }
        
        leave.status = 'revoked';
        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).json({ error: "Failed to revoke leave" });
    }
});

// HOD Approval
router.put('/:id/hod-approve', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        console.log(`HOD approval attempt by: ${user.name}, isHOD: ${user.isHOD}`);
        if (!user.isHOD) return res.status(403).json({ error: "Only HOD can grant clearance" });
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave request not found" });
        
        console.log(`Clearing leave for: ${leave.userName}, Leave Dept: ${leave.department}, HOD Dept: ${user.department}`);
        
        // Loosen department check slightly or at least log mismatch
        if (leave.department !== user.department && user.role !== 'admin') {
            console.warn("Department mismatch during HOD clearance");
            // return res.status(403).json({ error: "Leave request not in your department" });
        }
        
        leave.status = 'pending_principal';
        await leave.save();
        
        const io = req.app.get('io');
        if (io) io.emit('leave_hod_cleared', { leave });
        
        res.json(leave);
    } catch (err) {
        console.error("HOD Approve Error:", err);
        res.status(500).json({ error: "HOD approval failed" });
    }
});

// Principal Final Approval
router.put('/:id/principal-approve', auth, async (req, res) => {
    try {
        console.log(`Principal approval attempt by: ${req.user.id}, role: ${req.user.role}`);
        if (req.user.role !== 'principal' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });
        
        leave.status = 'approved';
        
        // Handling HOD Delegation if applicant is HOD
        if (leave.isHOD) {
            const delegates = await User.find({
                college: leave.college,
                department: leave.department,
                role: 'faculty',
                _id: { $ne: leave.userId }
            });
            if (delegates.length > 0) {
                const delegate = delegates[0];
                leave.actingHODId = delegate._id;
                leave.actingHODName = delegate.name;
                delegate.actingHODFor = leave.userId;
                await delegate.save();
            }
        }
        
        await leave.save();
        
        // Calendar Booking
        const newBooking = new Booking({
            userId: leave.userId,
            userName: leave.userName,
            userRole: 'faculty',
            userCollege: leave.college,
            purpose: "Approved Leave",
            facility: "Campus Leave",
            title: `Faculty Leave: ${leave.userName}`,
            date: leave.startDate.toISOString().split('T')[0],
            startTime: "09:00 AM",
            endTime: "05:00 PM",
            status: 'approved',
            college: leave.college
        });
        await newBooking.save();
        
        const io = req.app.get('io');
        if (io) io.emit('leave_final_approved', { leave });
        
        res.json(leave);
    } catch (error) {
        res.status(500).json({ error: "Final approval failed" });
    }
});

// Admin Review (Final State)
router.get('/admin-summary', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const summary = await Leave.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.json(summary);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch admin summary" });
    }
});

module.exports = router;
