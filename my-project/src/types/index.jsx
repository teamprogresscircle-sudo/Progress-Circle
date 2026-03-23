/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [avatar]
 * @property {number} points
 * @property {number} streak
 * @property {string} joinedAt
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} [description]
 * @property {'low' | 'medium' | 'high'} priority
 * @property {'pending' | 'in_progress' | 'completed'} status
 * @property {string} [deadline]
 * @property {string} createdAt
 * @property {string} [completedAt]
 */

/**
 * @typedef {Object} Habit
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} [description]
 * @property {number} streak
 * @property {string[]} completedDates
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Goal
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} [description]
 * @property {number} progress
 * @property {string} [targetDate]
 * @property {'active' | 'completed' | 'paused'} status
 * @property {string} createdAt
 * @property {string} [completedAt]
 */

/**
 * @typedef {Object} LeaderboardEntry
 * @property {User} user
 * @property {number} rank
 * @property {number} weeklyPoints
 */