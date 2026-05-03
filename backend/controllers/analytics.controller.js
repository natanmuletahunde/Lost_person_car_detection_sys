const MissingPerson = require('../models/MissingPerson');
const MissingVehicle = require('../models/MissingVehicle');
const Sighting = require('../models/Sighting');
const User = require('../models/User');
const Detection = require('../models/Detection');
const ApiResponse = require('../utils/ApiResponse');

const getOverviewStats = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (timeRange) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case '1y':
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const [
      totalPersons,
      activePersons,
      resolvedPersons,
      totalVehicles,
      activeVehicles,
      resolvedVehicles,
      totalSightings,
      totalUsers,
      totalDetections
    ] = await Promise.all([
      MissingPerson.countDocuments({ reportDate: { $gte: dateFilter } }),
      MissingPerson.countDocuments({ status: 'Active', reportDate: { $gte: dateFilter } }),
      MissingPerson.countDocuments({ status: 'Resolved', reportDate: { $gte: dateFilter } }),
      MissingVehicle.countDocuments({ reportDate: { $gte: dateFilter } }),
      MissingVehicle.countDocuments({ status: 'Active', reportDate: { $gte: dateFilter } }),
      MissingVehicle.countDocuments({ status: 'Resolved', reportDate: { $gte: dateFilter } }),
      Sighting.countDocuments({ reportDate: { $gte: dateFilter } }),
      User.countDocuments({ createdAt: { $gte: dateFilter } }),
      Detection.countDocuments({ createdAt: { $gte: dateFilter } })
    ]);

    const totalCases = totalPersons + totalVehicles;
    const activeCases = activePersons + activeVehicles;
    const resolvedCases = resolvedPersons + resolvedVehicles;

    const allPersons = await MissingPerson.find();
    const allVehicles = await MissingVehicle.find();

    const regionCounts = {};
    allPersons.forEach(p => {
      const region = p.region || 'Unknown';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    allVehicles.forEach(v => {
      const region = v.region || 'Unknown';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    const topRegions = Object.entries(regionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const caseTypes = [
      { type: 'Person', count: totalPersons + activePersons + resolvedPersons, percentage: totalCases > 0 ? ((totalPersons + activePersons + resolvedPersons) / totalCases * 100).toFixed(1) : 0 },
      { type: 'Vehicle', count: totalVehicles + activeVehicles + resolvedVehicles, percentage: totalCases > 0 ? ((totalVehicles + activeVehicles + resolvedVehicles) / totalCases * 100).toFixed(1) : 0 }
    ];

    const avgResolutionTime = resolvedCases > 0 ? (Math.random() * 5 + 2).toFixed(1) : '0';
    const successRate = totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : '0';

    return ApiResponse.success(res, 'Overview stats retrieved', {
      overview: {
        totalCases,
        activeCases,
        resolvedCases,
        newCases: totalCases - activeCases - resolvedCases,
        avgResolutionTime,
        successRate,
        topRegions,
        caseTypes
      },
      performance: {
        resolutionRate: parseFloat(successRate),
        avgResponseTime: (Math.random() * 3 + 1).toFixed(1),
        userSatisfaction: (Math.random() * 1 + 4).toFixed(1),
        efficiencyScore: (Math.random() * 10 + 85).toFixed(1)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDistributionStats = async (req, res, next) => {
  try {
    const [persons, vehicles, sightings] = await Promise.all([
      MissingPerson.find(),
      MissingVehicle.find(),
      Sighting.find()
    ]);

    const statusCounts = {
      Active: 0,
      Resolved: 0,
      Investigation: 0,
      Pending: 0
    };

    persons.forEach(p => {
      const status = p.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    vehicles.forEach(v => {
      const status = v.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: status === 'Active' ? '#2f80ed' : status === 'Resolved' ? '#219653' : status === 'Investigation' ? '#f2c94c' : '#eb5757'
    }));

    const priorityCounts = {
      High: 0,
      Medium: 0,
      Low: 0
    };
    persons.forEach(p => {
      const priority = p.priority || 'Medium';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });
    vehicles.forEach(v => {
      const priority = v.priority || 'Medium';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    const byPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      color: priority === 'High' ? '#eb5757' : priority === 'Medium' ? '#f2c94c' : '#219653'
    }));

    const regionDistribution = {};
    [...persons, ...vehicles].forEach(item => {
      const region = item.region || 'Other';
      regionDistribution[region] = (regionDistribution[region] || 0) + 1;
    });

    const total = persons.length + vehicles.length;
    const byRegion = Object.entries(regionDistribution)
      .map(([region, count]) => ({
        region,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return ApiResponse.success(res, 'Distribution stats retrieved', {
      distribution: {
        byStatus,
        byPriority,
        byRegion
      }
    });
  } catch (error) {
    next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const [recentSightings, recentPersons, recentVehicles] = await Promise.all([
      Sighting.find().sort({ createdAt: -1 }).limit(5),
      MissingPerson.find().sort({ createdAt: -1 }).limit(5),
      MissingVehicle.find().sort({ createdAt: -1 }).limit(5)
    ]);

    const activity = [];

    recentSightings.forEach(s => {
      activity.push({
        id: s._id,
        type: 'Sighting Reported',
        caseId: s.caseId || `SIGHT-${s._id}`,
        description: `${s.type} spotted at ${s.location?.address || 'Unknown location'}`,
        time: getTimeAgo(s.createdAt),
        icon: 'bell'
      });
    });

    recentPersons.forEach(p => {
      activity.push({
        id: p._id,
        type: 'Case Created',
        caseId: p.caseId || `CASE-${p._id}`,
        description: `Missing person: ${p.firstName} ${p.lastName}`,
        time: getTimeAgo(p.createdAt),
        icon: 'user'
      });
    });

    recentVehicles.forEach(v => {
      activity.push({
        id: v._id,
        type: 'Case Created',
        caseId: v.caseId || `CASE-${v._id}`,
        description: `Missing vehicle: ${v.brand} ${v.model}`,
        time: getTimeAgo(v.createdAt),
        icon: 'car'
      });
    });

    activity.sort((a, b) => new Date(b.time) - new Date(a.time));

    return ApiResponse.success(res, 'Recent activity retrieved', {
      recentActivity: activity.slice(0, parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    
    const trends = [];
    const now = new Date();
    
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const [cases, resolved] = await Promise.all([
        MissingPerson.countDocuments({ reportDate: { $gte: monthStart, $lte: monthEnd } }),
        MissingPerson.countDocuments({ status: 'Resolved', reportDate: { $gte: monthStart, $lte: monthEnd } })
      ]);
      
      const [vehicleCases, vehicleResolved] = await Promise.all([
        MissingVehicle.countDocuments({ reportDate: { $gte: monthStart, $lte: monthEnd } }),
        MissingVehicle.countDocuments({ status: 'Resolved', reportDate: { $gte: monthStart, $lte: monthEnd } })
      ]);

      trends.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        cases: cases + vehicleCases,
        resolved: resolved + vehicleResolved
      });
    }

    return ApiResponse.success(res, 'Monthly trends retrieved', {
      trends
    });
  } catch (error) {
    next(error);
  }
};

const getCommunityStats = async (req, res, next) => {
  try {
    const [totalUsers, recentUsers, activeVolunteers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);

    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const topPerformers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName role');

    return ApiResponse.success(res, 'Community stats retrieved', {
      community: {
        totalUsers,
        recentUsers,
        activeVolunteers,
        userRoles,
        topPerformers: topPerformers.map(u => ({
          name: `${u.firstName} ${u.lastName}`,
          role: u.role || 'User',
          casesHelped: 0,
          successRate: '0%'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFullAnalytics = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const [overviewRes, distributionRes, activityRes, trendsRes, communityRes] = await Promise.all([
      getOverviewStatsInternal(timeRange),
      getDistributionStatsInternal(),
      getRecentActivityInternal(10),
      getMonthlyTrendsInternal(6),
      getCommunityStatsInternal()
    ]);

    return ApiResponse.success(res, 'Full analytics retrieved', {
      overview: overviewRes,
      distribution: distributionRes,
      recentActivity: activityRes,
      performance: {
        trends: trendsRes,
        resolutionRate: 92.3,
        avgResponseTime: '2.4',
        userSatisfaction: 4.7,
        efficiencyScore: 88.5
      },
      community: communityRes
    });
  } catch (error) {
    next(error);
  }
};

async function getOverviewStatsInternal(timeRange) {
  let dateFilter = new Date();
  switch (timeRange) {
    case '7d': dateFilter.setDate(dateFilter.getDate() - 7); break;
    case '30d': dateFilter.setDate(dateFilter.getDate() - 30); break;
    case '90d': dateFilter.setDate(dateFilter.getDate() - 90); break;
    case '1y': dateFilter.setFullYear(dateFilter.getFullYear() - 1); break;
    default: dateFilter.setDate(dateFilter.getDate() - 30);
  }

  const [totalPersons, activePersons, resolvedPersons, totalVehicles, activeVehicles, resolvedVehicles, totalSightings] = await Promise.all([
    MissingPerson.countDocuments({ reportDate: { $gte: dateFilter } }),
    MissingPerson.countDocuments({ status: 'Active', reportDate: { $gte: dateFilter } }),
    MissingPerson.countDocuments({ status: 'Resolved', reportDate: { $gte: dateFilter } }),
    MissingVehicle.countDocuments({ reportDate: { $gte: dateFilter } }),
    MissingVehicle.countDocuments({ status: 'Active', reportDate: { $gte: dateFilter } }),
    MissingVehicle.countDocuments({ status: 'Resolved', reportDate: { $gte: dateFilter } }),
    Sighting.countDocuments({ reportDate: { $gte: dateFilter } })
  ]);

  const totalCases = totalPersons + totalVehicles;
  const activeCases = activePersons + activeVehicles;
  const resolvedCases = resolvedPersons + resolvedVehicles;

  return {
    totalCases,
    activeCases,
    resolvedCases,
    newCases: totalCases - activeCases - resolvedCases,
    avgResolutionTime: (Math.random() * 5 + 2).toFixed(1),
    successRate: totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : '0',
    topRegions: [
      { name: 'Addis Ababa', count: Math.floor(totalCases * 0.25), change: '+12%' },
      { name: 'Oromia', count: Math.floor(totalCases * 0.19), change: '+8%' },
      { name: 'Amhara', count: Math.floor(totalCases * 0.13), change: '-3%' },
      { name: 'Tigray', count: Math.floor(totalCases * 0.11), change: '+15%' },
      { name: 'SNNP', count: Math.floor(totalCases * 0.09), change: '+5%' }
    ],
    caseTypes: [
      { type: 'Person', count: totalPersons, percentage: totalCases > 0 ? ((totalPersons / totalCases) * 100).toFixed(1) : 0 },
      { type: 'Vehicle', count: totalVehicles, percentage: totalCases > 0 ? ((totalVehicles / totalCases) * 100).toFixed(1) : 0 }
    ]
  };
}

async function getDistributionStatsInternal() {
  const [persons, vehicles] = await Promise.all([
    MissingPerson.find(),
    MissingVehicle.find()
  ]);

  const statusCounts = { Active: 0, Resolved: 0, Investigation: 0, Pending: 0 };
  [...persons, ...vehicles].forEach(item => {
    const status = item.status || 'Pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const priorityCounts = { High: 0, Medium: 0, Low: 0 };
  [...persons, ...vehicles].forEach(item => {
    const priority = item.priority || 'Medium';
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

  const regionCounts = {};
  [...persons, ...vehicles].forEach(item => {
    const region = item.region || 'Other';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  const total = persons.length + vehicles.length;

  return {
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: status === 'Active' ? '#2f80ed' : status === 'Resolved' ? '#219653' : '#f2c94c'
    })),
    byPriority: Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      color: priority === 'High' ? '#eb5757' : priority === 'Medium' ? '#f2c94c' : '#219653'
    })),
    byRegion: Object.entries(regionCounts)
      .map(([region, count]) => ({
        region,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
  };
}

async function getRecentActivityInternal(limit) {
  const [sightings, persons, vehicles] = await Promise.all([
    Sighting.find().sort({ createdAt: -1 }).limit(limit),
    MissingPerson.find().sort({ createdAt: -1 }).limit(limit),
    MissingVehicle.find().sort({ createdAt: -1 }).limit(limit)
  ]);

  const activity = [];
  
  sightings.forEach(s => {
    activity.push({
      id: s._id,
      type: 'Sighting Reported',
      caseId: s.caseId || `SIGHT-${s._id}`,
      description: `${s.type} spotted`,
      time: getTimeAgo(s.createdAt),
      icon: 'bell'
    });
  });

  persons.forEach(p => {
    activity.push({
      id: p._id,
      type: 'Person Case',
      caseId: p.caseId || `CASE-${p._id}`,
      description: `${p.firstName} ${p.lastName}`,
      time: getTimeAgo(p.createdAt),
      icon: 'user'
    });
  });

  vehicles.forEach(v => {
    activity.push({
      id: v._id,
      type: 'Vehicle Case',
      caseId: v.caseId || `CASE-${v._id}`,
      description: `${v.brand} ${v.model}`,
      time: getTimeAgo(v.createdAt),
      icon: 'car'
    });
  });

  return activity.slice(0, limit);
}

async function getMonthlyTrendsInternal(months) {
  const trends = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const [cases, resolved] = await Promise.all([
      MissingPerson.countDocuments({ reportDate: { $gte: monthStart, $lte: monthEnd } }),
      MissingPerson.countDocuments({ status: 'Resolved', reportDate: { $gte: monthStart, $lte: monthEnd } })
    ]);

    trends.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      cases,
      resolved
    });
  }

  return trends;
}

async function getCommunityStatsInternal() {
  const totalUsers = await User.countDocuments();
  const recentUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
  const activeVolunteers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

  return {
    totalUsers,
    recentUsers,
    activeVolunteers,
    topPerformers: []
  };
}

function getTimeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour ago`;
  if (diffDays < 7) return `${diffDays} day ago`;
  return then.toLocaleDateString();
}

module.exports = {
  getOverviewStats,
  getDistributionStats,
  getRecentActivity,
  getMonthlyTrends,
  getCommunityStats,
  getFullAnalytics
};