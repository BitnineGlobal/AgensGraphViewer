/*
 * Copyright 2020 Bitnine Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Modal } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEyeSlash,
  faLockOpen,
  faProjectDiagram,
  faCodeCompare,
} from '@fortawesome/free-solid-svg-icons';

/* https://js.cytoscape.org/ */
import cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

/* https://github.com/cytoscape/cytoscape.js-edgehandles */
import edgehandles from 'cytoscape-edgehandles';

import COSEBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import klay from 'cytoscape-klay';
import euler from 'cytoscape-euler';
import avsdf from 'cytoscape-avsdf';
import spread from 'cytoscape-spread';
import { initLocation, seletableLayouts } from './CytoscapeLayouts';
import { stylesheet } from './CytoscapeStyleSheet';
import { generateCytoscapeElement } from '../../features/cypher/CypherUtil';

import ehConfig from './EdgehandlesConfig';

import cxtmenu from '../../lib/cytoscape-cxtmenu-bitnine';
import styles from '../frame/Frame.module.scss';
import NewEdgeModal from '../modals/containers/NewEdgeModal';

cytoscape.use(COSEBilkent);
cytoscape.use(cola);
cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(euler);
cytoscape.use(avsdf);
cytoscape.use(spread);
cytoscape.use(cxtmenu);
cytoscape.use(edgehandles);

/**
 * The drawn graph canvas from cytoscape library.
 * It appears when a query is sent through the editor box.
 *
 * @param {object} elements - the nodes and edges visually drawn on the canvas.
 * @param {object} cytoscapeObject - the instance of cytoscape containing all
 * info to draw the graph.
 * @param {object} setCytoscapeObject - function to change the state of the
 * cytoscape instance.
 *
 * @returns {ReactDOM}
 */
const CypherResultCytoscapeChart = ({
  elements,
  cytoscapeObject,
  setCytoscapeObject,
  cytoscapeLayout,
  maxDataOfGraph,
  onElementsMouseover,
  addLegendData,
}) => {
  const [cytoscapeMenu, setCytoscapeMenu] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [open, setOpen] = useState(false);
  const [oID, setOriginID] = useState(null);
  const [tID, setTargetID] = useState(null);

  let edgeHandlesInstance;

  /**
   * Modal alert opened when there's no data to 'extend' on node. The action
   * happens when the user selects the 'graph' icon in a node's right click
   * context menu.
   */
  const info = () => {
    Modal.info({
      content: (
        <div>
          <p>No data to extend</p>
        </div>
      ),
      onOk() {},
    });
  };

  /**
   * Add events to cytoscape elements: nodes or edges.
   *
   * @param {object} targetElements - a cytoscapeObject.elements("label"),
   * containing the nodes and edges inside the cytoscapeObject.
   */
  const addEventOnElements = (targetElements) => {
    targetElements.bind('mouseover', (e) => {
      onElementsMouseover({ type: 'elements', data: e.target.data() });
      e.target.addClass('highlight');
    });
    targetElements.bind('mouseout', (e) => {
      if (cytoscapeObject.elements(':selected').length === 0) {
        onElementsMouseover({
          type: 'background',
          data: {
            nodeCount: cytoscapeObject.nodes().size(),
            edgeCount: cytoscapeObject.edges().size(),
          },
        });
      } else {
        onElementsMouseover({
          type: 'elements',
          data: cytoscapeObject.elements(':selected')[0].data(),
        });
      }
      e.target.removeClass('highlight');
    });
    targetElements.bind('click', (e) => {
      const ele = e.target;
      if (ele.selected() && ele.isNode()) {
        if (cytoscapeObject.nodes(':selected').size() === 1) {
          ele
            .neighborhood()
            .selectify()
            .select()
            .unselectify();
        } else {
          cytoscapeObject
            .nodes(':selected')
            .filter(`[id != "${ele.id()}"]`)
            .neighborhood()
            .selectify()
            .select()
            .unselectify();
        }
      } else {
        cytoscapeObject
          .elements(':selected')
          .unselect()
          .selectify();
      }
    });
    cytoscapeObject.bind('click', (e) => {
      if (e.target === cytoscapeObject) {
        cytoscapeObject
          .elements(':selected')
          .unselect()
          .selectify();
        onElementsMouseover({
          type: 'background',
          data: {
            nodeCount: cytoscapeObject.nodes().size(),
            edgeCount: cytoscapeObject.edges().size(),
          },
        });
      }
    });
    /**
     * EdgeHandles event:
     * When completing drawing connection between nodes,
     * pop up modal to enter edge label and properties.
     *
     * @param {object} event - 'ehcomplete' event. Has many attributes,
     * including 'position: {x: float, y: float}'.
     * @param {object} sourceNode - node at the beggining of the edge.
     * @param {object} targetNode - node at the tip of the edge.
     * @param {object} addedEdge - newly drawn edge, represented in red.
     */
    cytoscapeObject.on('ehcomplete',
      (event, sourceNode, targetNode) => {
        setOriginID(sourceNode.data().id);
        setTargetID(targetNode.data().id);
        setOpen(true);
        // TODO if form is closed, cancel new edge?
      });
  };

  /**
   * Add elements on cytoscape canvas.
   * This function is activated when selecting the function to 'extend' a node
   * through the right-click context menu.
   */
  const addElements = (centerId, d) => {
    const generatedData = generateCytoscapeElement(d.rows, maxDataOfGraph, true);
    if (generatedData.elements.nodes.length === 0) {
      return info;
    }
    cytoscapeObject.elements().lock();
    cytoscapeObject.add(generatedData.elements);

    const newlyAddedEdges = cytoscapeObject.edges('.new');
    const newlyAddedTargets = newlyAddedEdges.targets();
    const newlyAddedSources = newlyAddedEdges.sources();
    const rerenderTargets = newlyAddedEdges.union(newlyAddedTargets).union(newlyAddedSources);

    const centerPosition = { ...cytoscapeObject.nodes().getElementById(centerId).position() };

    cytoscapeObject.elements().unlock();

    rerenderTargets.layout(seletableLayouts.concentric).run();

    const centerMovedPosition = { ...cytoscapeObject.nodes().getElementById(centerId).position() };
    const xGap = centerMovedPosition.x - centerPosition.x;
    const yGap = centerMovedPosition.y - centerPosition.y;

    rerenderTargets.forEach((ele) => {
      const pos = ele.position();
      ele.position({ x: pos.x - xGap, y: pos.y - yGap });
    });

    addEventOnElements(cytoscapeObject.elements('new'));

    addLegendData(generatedData.legend);
    rerenderTargets.removeClass('new');
    return 0;
  };

  /**
   * Node's context menu actions.
   * Triggered when changes occur in 'cytoscapeObject' and 'cytoscapeMenu'.
   * The context menu opens when the user right-clicks a node in the cytoscape
   * canvas.
   */
  useEffect(() => {
    if (cytoscapeMenu === null && cytoscapeObject !== null) {
      const cxtMenuConf = {
        /**
         * @param {Object} ele - node or edge inside the cytoscape canvas.
         */
        menuRadius(ele) {
          return ele.cy().zoom() <= 1 ? 55 : 70;
        },
        selector: 'node',
        commands: [

          /**
           * Lock icon: make the node go back to its initial place.
           */
          {
            content: ReactDOMServer.renderToString(
              (<FontAwesomeIcon icon={faLockOpen} size="lg" />),
            ),
            select(ele) {
              ele.animate({ position: initLocation[ele.id()] });
            },
          },

          /**
           * Make all the node's hidden connections appear
           */
          {
            content: ReactDOMServer.renderToString(
              (<FontAwesomeIcon icon={faProjectDiagram} size="lg" />),
            ),
            select(ele) {
              fetch('/api/v1/cypher',
                {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ cmd: `MATCH (S)-[R]-(T) WHERE id(S) = '${ele.id()}' RETURN S, R, T` }),
                })
                .then((res) => res.json())
                .then((data) => {
                  addElements(ele.id(), data);
                });
            },
          },

          /**
           * Remove element from the canvas
           */
          {
            content: ReactDOMServer.renderToString(
              (<FontAwesomeIcon icon={faEyeSlash} size="lg" />),
            ),
            select(ele) {
              ele.remove();
            },
          },

          /**
           * Action for when you click on the 'X' that's in the
           * right click context menu.
           */
          {
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faCodeCompare} size="lg" />,
            ),
            select(ele) {
              // On selecting the edge connecting function
              if (edgeHandlesInstance) {
                edgeHandlesInstance.enableDrawMode(ele);
              }
              /* when you finish the connection... */
            },
          },
        ],
        fillColor: 'rgba(210, 213, 218, 1)',
        activeFillColor: 'rgba(166, 166, 166, 1)',
        activePadding: 0,
        indicatorSize: 0,
        separatorWidth: 4,
        spotlightPadding: 3,
        minSpotlightRadius: 11,
        maxSpotlightRadius: 99,
        openMenuEvents: 'cxttap',
        itemColor: '#2A2C34',
        itemTextShadowColor: 'transparent',
        zIndex: 9999,
        atMouse: false,
      };
      setCytoscapeMenu(cytoscapeObject.cxtmenu(cxtMenuConf));
    }
  }, [cytoscapeObject, cytoscapeMenu]);

  /**
   * Creating a new instance of the cytoscape canvas.
   * Activated when a query is sent or when changing the layout of the graph.
   */
  useEffect(() => {
    if (cytoscapeLayout && cytoscapeObject) {
      const selectedLayout = seletableLayouts[cytoscapeLayout];
      selectedLayout.animate = true;
      selectedLayout.fit = true;
      cytoscapeObject.minZoom(1e-1);
      cytoscapeObject.maxZoom(1.5);
      cytoscapeObject.layout(selectedLayout).run();
      cytoscapeObject.maxZoom(5);
      if (!initialized) {
        edgeHandlesInstance = cytoscapeObject.edgehandles({ ehConfig });
        addEventOnElements(cytoscapeObject.elements());
        setInitialized(true);
      }
    }
  }, [cytoscapeObject, cytoscapeLayout]);

  const cyCallback = useCallback((newCytoscapeObject) => {
    if (cytoscapeObject) return;
    setCytoscapeObject(newCytoscapeObject);
  }, [cytoscapeObject]);

  return (
    <div>
      <CytoscapeComponent
        elements={CytoscapeComponent.normalizeElements(elements)}
        stylesheet={stylesheet}
        cy={cyCallback}
        className={styles.NormalChart}
        wheelSensitivity={0.2}
      />
      <NewEdgeModal
        open={open}
        setOpen={setOpen}
        originID={oID}
        targetID={tID}
      />
    </div>
  );
};

CypherResultCytoscapeChart.propTypes = {
  elements: PropTypes.shape({
    nodes: PropTypes.arrayOf(PropTypes.shape({
      // eslint-disable-next-line react/forbid-prop-types
      data: PropTypes.any,
    })),
    edges: PropTypes.arrayOf(PropTypes.shape({
      // eslint-disable-next-line react/forbid-prop-types
      data: PropTypes.any,
    })),
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  setCytoscapeObject: PropTypes.func.isRequired,
  cytoscapeLayout: PropTypes.string.isRequired,
  maxDataOfGraph: PropTypes.number.isRequired,
  onElementsMouseover: PropTypes.func.isRequired,
  addLegendData: PropTypes.func.isRequired,
};
CypherResultCytoscapeChart.defaultProps = {
  cytoscapeObject: null,
};

export default CypherResultCytoscapeChart;
