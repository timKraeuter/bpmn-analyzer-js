/**
 * Shared test utilities for quick-fixes tests
 */

/**
 * Helper to create a mock shape with default properties
 * @param {Object} overrides - Properties to override on the mock shape
 * @returns {Object} A mock BPMN shape object
 */
export function createMockShape(overrides = {}) {
  return {
    id: overrides.id || "shape_1",
    x: overrides.x || 100,
    y: overrides.y || 100,
    width: overrides.width || 100,
    height: overrides.height || 80,
    type: overrides.type || "bpmn:Task",
    incoming: overrides.incoming || [],
    outgoing: overrides.outgoing || [],
    parent: overrides.parent || null,
    businessObject: overrides.businessObject || {
      $type: overrides.type || "bpmn:Task",
    },
    label: overrides.label || null,
    ...overrides,
  };
}

/**
 * Helper to create a mock connection (sequence flow)
 * @param {Object} overrides - Properties to override on the mock connection
 * @returns {Object} A mock BPMN connection object
 */
export function createMockConnection(overrides = {}) {
  return {
    id: overrides.id || "flow_1",
    type: overrides.type || "bpmn:SequenceFlow",
    source: overrides.source || null,
    target: overrides.target || null,
    waypoints: overrides.waypoints || [],
    ...overrides,
  };
}
