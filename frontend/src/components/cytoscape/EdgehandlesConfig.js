export const edgeHandlesConfig = {
  canConnect(sourceNode, targetNode) {
    // whether an edge can be created between source and target
    return sourceNode.same(targetNode);
  },
  edgeParams(sourceNode, targetNode) {
    // for edges between the specified source and target
    // return element object to be passed to cy.add() for edge
    return {};
  },
  // time spent hovering over a target node before it is
  // considered selected
  hoverDelay: 150,
  // when enabled, the edge can be drawn by just
  // moving close to a target node (can be confusing on compound graphs)
  snap: false,
  // the target node must be less than or equal to
  // this many pixels away from the cursor/finger
  snapThreshold: 50,
  // the number of times per
  // second (Hz) that snap checks done (lower is less expensive)
  snapFrequency: 15,
  // set events:no to edges during draws, prevents
  // mouseouts on compounds
  noEdgeEventsInDraw: true,
  // during an edge drawing gesture, disable browser gestures such
  // as two-finger trackpad swipe and pinch-to-zoom
  disableBrowserGestures: true,
};
export default edgeHandlesConfig;
