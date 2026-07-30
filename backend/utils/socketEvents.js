let ioInstance = null;

/**
 * Set the Socket.io instance
 * @param {Server} io - Socket.io server instance
 */
function setIO(io) {
  ioInstance = io;
}

/**
 * Get the Socket.io instance
 * @returns {Server} Socket.io server instance
 */
function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
}

/**
 * Emit an event to a specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 */
function emitToRoom(room, event, data) {
  getIO().to(room).emit(event, data);
}

/**
 * Emit an event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 */
function emitToUser(userId, event, data) {
  getIO().to(`user_${userId}`).emit(event, data);
}

/**
 * Emit an event to an entire organization
 * @param {string} orgId - Organization ID
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 */
function emitToOrg(orgId, event, data) {
  getIO().to(`org_${orgId}`).emit(event, data);
}

/**
 * Emit an alert event to organization's alert room
 * @param {string} orgId - Organization ID
 * @param {string} event - Event name (e.g., 'alertCreated')
 * @param {any} data - Alert data
 */
function emitAlertEvent(orgId, event, data) {
  getIO().to(`alerts_org_${orgId}`).emit(event, data);
}

/**
 * Emit an incident event to organization's incident room
 * @param {string} orgId - Organization ID
 * @param {string} event - Event name (e.g., 'incidentCreated')
 * @param {any} data - Incident data
 */
function emitIncidentEvent(orgId, event, data) {
  getIO().to(`incidents_org_${orgId}`).emit(event, data);
}

/**
 * Emit a dashboard event to organization's dashboard room
 * @param {string} orgId - Organization ID
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 */
function emitDashboardEvent(orgId, event, data) {
  getIO().to(`dashboard_org_${orgId}`).emit(event, data);
}

module.exports = {
  setIO,
  getIO,
  emitToRoom,
  emitToUser,
  emitToOrg,
  emitAlertEvent,
  emitIncidentEvent,
  emitDashboardEvent
};