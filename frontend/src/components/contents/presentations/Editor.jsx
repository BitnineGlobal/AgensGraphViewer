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

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import uuid from 'react-uuid';
import PropTypes from 'prop-types';
import AlertContainers from '../../alert/containers/AlertContainers';
import CodeMirror from '../../editor/containers/CodeMirrorWapperContainer';
import { setting } from '../../../conf/config';

const Editor = ({
  setCommand,
  command,
  addFrame,
  trimFrame,
  addAlert,
  alertList,
  database,
  executeCypherQuery,
  addCommandHistory,
  // addCommandFavorites,
}) => {
  const dispatch = useDispatch();
  const [alerts, setAlerts] = useState([]);

  const clearCommand = () => {
    setCommand('');
  };

  const onClick = () => {
    const refKey = uuid();
    if (command.toUpperCase().startsWith(':PLAY')) {
      dispatch(() => addFrame(command, 'Contents', refKey));
    } else if (command.toUpperCase().startsWith(':CSV')) {
      dispatch(() => addFrame(command, 'CSV', refKey));
    } else if (command.toUpperCase() === ':SERVER STATUS') {
      dispatch(() => trimFrame('ServerStatus'));
      dispatch(() => addFrame(command, 'ServerStatus', refKey));
    } else if (database.status === 'disconnected' && command.toUpperCase() === ':SERVER DISCONNECT') {
      dispatch(() => trimFrame('ServerDisconnect'));
      dispatch(() => trimFrame('ServerConnect'));
      dispatch(() => addAlert('ErrorNoDatabaseConnected'));
      dispatch(() => addFrame(command, 'ServerDisconnect', refKey));
    } else if (database.status === 'disconnected' && command.toUpperCase() === ':SERVER CONNECT') {
      if (!setting.closeWhenDisconnect) {
        dispatch(() => trimFrame('ServerConnect'));
        dispatch(() => addFrame(':server connect', 'ServerConnect'));
      }
    } else if (database.status === 'disconnected' && command.toUpperCase().match('(MATCH|CREATE).*')) {
      dispatch(() => trimFrame('ServerConnect'));
      dispatch(() => addAlert('ErrorNoDatabaseConnected'));
      dispatch(() => addFrame(command, 'ServerConnect', refKey));
    } else if (database.status === 'connected' && command.toUpperCase() === ':SERVER DISCONNECT') {
      dispatch(() => trimFrame('ServerDisconnect'));
      dispatch(() => addAlert('NoticeServerDisconnected'));
      dispatch(() => addFrame(command, 'ServerDisconnect', refKey));
    } else if (database.status === 'connected' && command.toUpperCase() === ':SERVER CONNECT') {
      if (!setting.connectionStatusSkip) {
        dispatch(() => trimFrame('ServerStatus'));
        dispatch(() => addAlert('NoticeAlreadyConnected'));
        dispatch(() => addFrame(command, 'ServerStatus', refKey));
      }
    } else if (database.status === 'connected') {
      const reqStringValue = command;
      dispatch(() => executeCypherQuery([refKey, reqStringValue]).then((response) => {
        if (response.type === 'cypher/executeCypherQuery/fulfilled') {
          addFrame(reqStringValue, 'CypherResultFrame', refKey);
        } else if (response.type === 'cypher/executeCypherQuery/rejected') {
          addFrame(reqStringValue, 'CypherResultFrame', refKey);
          dispatch(() => addAlert('ErrorCypherQuery'));
        }
      }));
    }
    dispatch(() => addCommandHistory(command));
    clearCommand();
  };

  useEffect(() => {
    setAlerts(
      alertList.map((alert) => (
        <AlertContainers
          key={alert.alertProps.key}
          alertKey={alert.alertProps.key}
          alertName={alert.alertName}
          errorMessage={alert.alertProps.errorMessage}
        />
      )),
    );
  }, [alertList]);

  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      <div className="editor">
        <div className="container-fluid editor-area card-header">
          <div className="input-group input-style">
            <div style={{
              height: '60px',
              width: '60px',
              color: '#ffffff',
              textAlign: 'left',
              lineHeight: '30px',
            }}
            >
              <span>
                Query
                <br />
                Editor
              </span>
            </div>
            <div
              className="form-control col-11 editor-code-wrapper"
              style={{ height: '100px' }}
            >
              <CodeMirror
                onClick={onClick}
                value={command}
                onChange={setCommand}
              />
            </div>
            <div className="input-group-append ml-auto editor-button-wrapper" id="editor-buttons">
              <button className={command ? 'btn show-eraser' : 'btn hide-eraser'} type="button" id="eraser" aria-label="Clear" onClick={() => clearCommand()}>
                <i className="icon-eraser" />
              </button>
              <button
                className="frame-head-button btn btn-link"
                type="button"
                aria-label="Run Query"
                onClick={() => onClick()}
                title="Run Query"
              >
                <i className="icon-play" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {alerts}
    </div>
  );
};

Editor.propTypes = {
  setCommand: PropTypes.func.isRequired,
  command: PropTypes.string.isRequired,
  addFrame: PropTypes.func.isRequired,
  trimFrame: PropTypes.func.isRequired,
  addAlert: PropTypes.func.isRequired,
  alertList: PropTypes.arrayOf(PropTypes.shape({
    alertName: PropTypes.string.isRequired,
    alertProps: PropTypes.shape({
      key: PropTypes.string.isRequired,
      alertType: PropTypes.string.isRequired,
      errorMessage: PropTypes.string.isRequired,
    }),
  })).isRequired,
  database: PropTypes.shape({
    status: PropTypes.string.isRequired,
    host: PropTypes.string.isRequired,
  }).isRequired,
  executeCypherQuery: PropTypes.func.isRequired,
  addCommandHistory: PropTypes.func.isRequired,
  // addCommandFavorites: PropTypes.func.isRequired,
};

export default Editor;
