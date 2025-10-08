server/routes/analytics.js:

const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get comprehensive dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { timeRange = '30d', role } = req.query;
    const startDate = getStartDate(timeRange);

    // Parallel queries for better performance
    const [
      userStats,
      assessmentStats,
      competencyStats,
      activityTrends,
      performanceMetrics
    ] = await Promise.all([
      getUserStatistics(startDate, role),
      getAssessmentStatistics(startDate),
      getCompetencyStatistics(startDate),
      getActivityTrends(startDate),
      getPerformanceMetrics(startDate)
    ]);

    res.json({
      userStats,
      assessmentStats,
      competencyStats,
      activityTrends,
      performanceMetrics,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student progress analytics
router.get('/student-progress/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { timeRange = '90d' } = req.query;
    const startDate = getStartDate(timeRange);

    const progressData = await Analytics.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(studentId),
          type: 'assessment_performance',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            competency: '$data.competency',
            month: { $month: '$timestamp' },
            year: { $year: '$timestamp' }
          },
          avgScore: { $avg: '$data.score' },
          assessmentCount: { $sum: 1 },
          latestScore: { $last: '$data.score' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Calculate competency mastery levels
    const competencyMastery = await calculateCompetencyMastery(studentId);
    
    // Get learning path recommendations
    const recommendations = await generateLearningRecommendations(studentId, competencyMastery);

    res.json({
      progressData,
      competencyMastery,
      recommendations,
      studentId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get class performance analytics
router.get('/class-performance', auth, async (req, res) => {
  try {
    const { classId, subject, timeRange = '30d' } = req.query;
    const startDate = getStartDate(timeRange);

    const classPerformance = await Analytics.aggregate([
      {
        $match: {
          type: 'assessment_performance',
          timestamp: { $gte: startDate },
          ...(subject && { 'data.subject': subject })
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $group: {
          _id: '$data.competency',
          avgScore: { $avg: '$data.score' },
          studentCount: { $addToSet: '$userId' },
          assessmentCount: { $sum: 1 },
          scores: { $push: '$data.score' }
        }
      },
      {
        $addFields: {
          studentCount: { $size: '$studentCount' },
          standardDeviation: { $stdDevPop: '$scores' }
        }
      }
    ]);

    // Calculate grade distribution
    const gradeDistribution = await calculateGradeDistribution(startDate, subject);
    
    // Identify at-risk students
    const atRiskStudents = await identifyAtRiskStudents(startDate, subject);

    res.json({
      classPerformance,
      gradeDistribution,
      atRiskStudents,
      timeRange
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get real-time learning analytics
router.get('/real-time', auth, async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const realTimeData = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);

    // Current active users
    const activeUsers = await getActiveUsers();
    
    // Live assessment submissions
    const liveSubmissions = await getLiveSubmissions();

    res.json({
      realTimeData,
      activeUsers,
      liveSubmissions,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function getStartDate(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

async function getUserStatistics(startDate, role) {
  const matchCondition = { createdAt: { $gte: startDate } };
  if (role) matchCondition.role = role;

  return await User.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        avgCompetencyLevel: { $avg: { $avg: '$competencies.level' } }
      }
    }
  ]);
}

async function getAssessmentStatistics(startDate) {
  return await Assessment.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        avgSubmissions: { $avg: { $size: '$submissions' } },
        totalSubmissions: { $sum: { $size: '$submissions' } }
      }
    }
  ]);
}

async function calculateCompetencyMastery(studentId) {
  return await Analytics.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(studentId),
        type: 'assessment_performance'
      }
    },
    {
      $group: {
        _id: '$data.competency',
        latestScore: { $last: '$data.score' },
        avgScore: { $avg: '$data.score' },
        assessmentCount: { $sum: 1 },
        trend: {
          $push: {
            score: '$data.score',
            date: '$timestamp'
          }
        }
      }
    },
    {
      $addFields: {
        masteryLevel: {
          $switch: {
            branches: [
              { case: { $gte: ['$avgScore', 90] }, then: 'Advanced' },
              { case: { $gte: ['$avgScore', 75] }, then: 'Proficient' },
              { case: { $gte: ['$avgScore', 60] }, then: 'Developing' }
            ],
            default: 'Beginning'
          }
        }
      }
    }
  ]);
}

module.exports = router;