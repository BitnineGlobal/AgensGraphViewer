/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button, Form, Input, Modal, Space,
} from 'antd';

export const NewEdgeModal = (
  {
    open, setOpen, setCommand,
  },
) => {
  const [form] = Form.useForm();
  const [formValues] = useState();

  /**
   * Transforms a json into a cypher query.
   *
   * @param {json} jsonInput - a json with edge label, origin and target ID,
   * and edge properties as keys.
   *
   * @returns {string} cypherQuery - the given json transformed into a CREATE
   * edge statement as a string in opencypher format.
   */
  const createCypherQuery = (jsonInput) => {
    const edgeLabel = jsonInput['Edge label'];
    const oID = jsonInput.OriginID;
    const tID = jsonInput.TargetID;
    const edgeProperties = jsonInput['Edge properties'];
    let propString = '';
    if (edgeProperties && edgeProperties.length > 0) {
      const propsArray = edgeProperties.map((prop) => `${prop.Key}: '${prop.Value}'`);
      propString = `{ ${propsArray.join(', ')} }`;
    }
    const cypherQuery = `MATCH (a), (b)
    WHERE id(a) = ${oID}
    AND
    id(b) = ${tID}
    CREATE (a)-[r:${edgeLabel} ${propString}]->(b)
    RETURN a, r, b`;
    return cypherQuery;
  };

  /**
   * Function activated when clicked OK on the create edge form.
   * Calls createCypherQuery and sends query to the editor field.
   * Then closes the modal window.
   *
   * @param {json} jsonFormValues - Form data in json format.
   */
  const onCreate = (jsonFormValues) => {
    setCommand(createCypherQuery(jsonFormValues));
    setOpen(false);
  };

  return (
    <>
      <pre>{JSON.stringify(formValues, null, 2)}</pre>
      <Modal
        open={open}
        title="Create a new edge"
        okText="Submit query"
        cancelText="Cancel"
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
        }}
        onCancel={() => setOpen(false)}
        modalRender={(dom) => (
          <Form
            name="dynamic_form_nest_item"
            form={form}
            onFinish={(values) => onCreate(values, setOpen, setCommand)}
            style={{
              maxWidth: 600,
            }}
            autoComplete="on"
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="Edge label"
          rules={[
            {
              required: true,
              message: 'Missing edge label',
            },
          ]}
        >
          <Input placeholder="Edge label" />
        </Form.Item>

        <Space>
          <Form.Item
            name="OriginID"
            rules={[
              {
                required: true,
                message: 'Missing origin node ID',
              },
            ]}
          >
            <Input placeholder="Origin node ID" />
          </Form.Item>

          <Form.Item
            name="TargetID"
            rules={[
              {
                required: true,
                message: 'Missing destination node ID',
              },
            ]}
          >
            <Input placeholder="Destination node ID" />
          </Form.Item>
        </Space>

        <Form.List name="Edge properties">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{
                    display: 'flex',
                    marginBottom: 8,
                  }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'Key']}
                    rules={[
                      {
                        required: true,
                        message: 'Missing property key',
                      },
                    ]}
                  >
                    <Input placeholder="Property key" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'Value']}
                    rules={[
                      {
                        required: true,
                        message: 'Missing property value',
                      },
                    ]}
                  >
                    <Input placeholder="Property value" />
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add field
                </Button>
              </Form.Item>

            </>
          )}

        </Form.List>
      </Modal>
    </>
  );
};
NewEdgeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  setCommand: PropTypes.func.isRequired,
};

export default NewEdgeModal;
