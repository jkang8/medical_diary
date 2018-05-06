import React, { Component } from 'react';
import { render } from 'react-dom';
import {
  EditorState
} from 'draft-js';

import {
  BulletJournalEditor, getBlockRendererFn
} from './components/editor.jsx';
import '../sass/main.scss';

let csrftoken = csrfToken();

function csrfToken() {
  return (function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      let cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        let cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  })('csrftoken');
}

function csrfSafeMethod(method) {
  return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
}

$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  }
});

class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      counter: 1
    };
  }
  render() {
    return (
      <div>
        <h1>Header!</h1>
        <span>Counter is at: { this.state.counter }</span>
        <BulletJournalEditor matchers={[
          [matchTodo, handleTodo]
        ]}
                             blockRendererFn={getBlockRendererFn}
        />
      </div>
    );
  }
}

render(
  <MyComponent />,
  document.getElementById("app")
);


const TODO_BLOCK = 'todo';

function matchTodo(str, currentBlock) {
  return str.match(/^\[\]$/);
}
function handleTodo(match_result, editorState, currentBlock) {
  const newType = currentBlock.getType() !== TODO_BLOCK ? TODO_BLOCK : 'unstyled';
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

function getDefaultBlockData(blockType, initialData={}) {
  switch(blockType) {
    case TODO_BLOCK: return {checked:false};
    default: return initialData;
  }
}
