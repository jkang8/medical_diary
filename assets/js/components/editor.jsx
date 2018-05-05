import React, { Component } from 'react';
import { Map } from 'immutable';
import TodoBlock from './todo_block.jsx';

import {
  Editor,
  EditorState,
  DefaultDraftBlockRenderMap,
  RichUtils
} from 'draft-js';

export default class NoteBookListEditor extends Component {
  constructor (props) {
    super(props);

    this.blockRenderMap = Map({
      [TODO_BLOCK]: {
        element: 'div'
      }
    }).merge(DefaultDraftBlockRenderMap);

    this.state = {
      editorState: EditorState.createEmpty()
    };

    this.onChange = (editorState) => this.setState({editorState});

    this.getEditorState = () => this.state.editorState;

    this.blockRendererFn = getBlockRendererFn(this.getEditorState, this.onChange);

    this.handleBeforeInput = this.handleBeforeInput.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
  }

  componentDidMount() {
    this.refs.editor.focus();
  }

  blockStyleFn(block) {
    switch(block.getType()) {
      case TODO_BLOCK:
        return 'block block-todo';
      default:
        return 'block';
    }
  }

  handleBeforeInput(str) {
    if (str !== ']') {
      return false;
    }
    const { editorState } = this.state;
    // Get the selection
    const selection = editorState.getSelection();

    // get the current block
    const currentBlock = editorState.getCurrentContent()
      .getBlockForKey(selection.getStartKey());
    const blockType = currentBlock.getType();
    const blockLength = currentBlock.getLength();
    if (blockLength === 1 && currentBlock.getText() === '[') {
      this.onChange(resetBlockType(editorState, blockType !== TODO_BLOCK ? TODO_BLOCK : 'unstyled'));
      return true;
    }
    return false;
  }

  handleKeyCommand(command) {
    const { editorState } = this.state;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  render() {
    return <Editor
      ref="editor"
      placeholder="Write here. Type [ ] to add a todo..."
      editorState={this.state.editorState}
      onChange={this.onChange}
      blockRenderMap={this.blockRenderMap}
      blockRendererFn={this.blockRendererFn}
      blockStyleFn={this.blockStyleFn}
      handleBeforeInput={this.handleBeforeInput}
      handleKeyCommand={this.handleKeyCommand}
    />
  }
}


const TODO_BLOCK = 'todo';

function getBlockRendererFn(getEditorState, onChange) {
  return block => {
    const type = block.getType();
    switch(type) {
      case TODO_BLOCK:
        return {
          component: TodoBlock,
          props: {
            getEditorState,
            onchange,
          }
        };
      default:
        return null;
    }
  }
}

function getDefaultBlockData(blockType, initialData={}) {
  switch(blockType) {
    case TODO_BLOCK: return {checked:false};
    default: return initialData;
  }
}

function resetBlockType(editorState, newType='unstyled') {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const key = selectionState.getStartKey();
  const blockMap = contentState.getBlockMap();
  const block = blockMap.get(key);
  let newText = '';
  const text = block.getText();
  if (block.getLength() >= 2) {
    newText = text.substr(1);
  }
  const newBlock = block.merge({
    text: newText,
    type: newType,
    data: getDefaultBlockData(newType)
  });
  const newContentState = contentState.merge({
    blockMap: blockMap.set(key, newBlock),
    selectionAfter: selectionState.merge({
      anchorOffset: 0,
      focusOffset: 0
    })
  });
  return EditorState.push(editorState, newContentState, 'change-block-type');
}