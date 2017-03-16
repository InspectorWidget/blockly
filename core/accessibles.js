/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Copyright 2016 InspectorWidget.
 * https://github.com/InspectorWidget
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utility functions for handling accessibles (forked from variables).
 * @author gmail.com:christian.frisson (Christian Frisson)
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Accessibles');

goog.require('Blockly.Blocks');
goog.require('Blockly.constants');
goog.require('Blockly.Workspace');
goog.require('goog.string');


/**
 * Category to separate accessible names from procedures and generated functions.
 */
Blockly.Accessibles.NAME_TYPE = 'ACCESSIBLE';

/**
 * Find all user-created accessibles.
 * @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
 * @return {!Array.<string>} Array of accessible names.
 */
Blockly.Accessibles.allUsedAccessibles = function(root) {
  var blocks;
  if (root instanceof Blockly.Block) {
    // Root is Block.
    blocks = root.getDescendants();
  } else if (root.getAllBlocks) {
    // Root is Workspace.
    blocks = root.getAllBlocks();
  } else {
    throw 'Not Block or Workspace: ' + root;
  }
  var accessibleHash = Object.create(null);
  // Iterate through every block and add each accessible to the hash.
  for (var x = 0; x < blocks.length; x++) {
    var blockAccessibles = blocks[x].getAccessibles();
    if (blockAccessibles) {
      for (var y = 0; y < blockAccessibles.length; y++) {
        var accessibleName = blockAccessibles[y];
        // Variable name may be null if the block is only half-built.
        if (accessibleName) {
          accessibleHash[accessibleName.toLowerCase()] = accessibleName;
        }
      }
    }
  }
  // Flatten the hash into a list.
  var accessibleList = [];
  for (var name in accessibleHash) {
    accessibleList.push(accessibleHash[name]);
  }
  return accessibleList;
};

/**
 * Find all instances of the specified accessible and rename them.
 * @param {string} oldName Accessible to rename.
 * @param {string} newName New accessible name.
 * @param {!Blockly.Workspace} workspace Workspace rename accessibles in.
 */
Blockly.Accessibles.allAccessibles = function(root) {
  if (root instanceof Blockly.Block) {
    // Root is Block.
    console.warn('Deprecated call to Blockly.Accessibles.allAccessibles ' +
                 'with a block instead of a workspace.  You may want ' +
                 'Blockly.Accessibles.allUsedAccessibles');
  }
  return root.accessibleList;
};

/**
 * Construct the blocks required by the flyout for the accessible category.
 * @param {!Blockly.Workspace} workspace The workspace contianing accessibles.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Accessibles.flyoutCategory = function(workspace) {
  var accessibleList = workspace.accessibleList;
  accessibleList.sort(goog.string.caseInsensitiveCompare);

  var xmlList = [];
  var button = goog.dom.createDom('button');
  button.setAttribute('text', Blockly.Msg.NEW_ACCESSIBLE);
  button.setAttribute('callbackKey', 'CREATE_ACCESSIBLE');

  workspace.registerButtonCallback('CREATE_ACCESSIBLE', function(button) {
    Blockly.Accessibles.createAccessible(button.getTargetWorkspace());
  });

  xmlList.push(button);

  if (accessibleList.length > 0) {
    if (Blockly.Blocks['accessibles_set']) {
      var gap = Blockly.Blocks['math_change'] ? 8 : 24;
      var blockText = '<xml>' +
            '<block type="accessibles_set" gap="' + gap + '">' +
            '<field name="ACCESSIBLE">' + accessibleList[0] + '</field>' +
            '</block>' +
            '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }
    if (Blockly.Blocks['math_change']) {
      var gap = Blockly.Blocks['accessibles_get'] ? 20 : 8;
      var blockText = '<xml>' +
          '<block type="math_change" gap="' + gap + '">' +
          '<field name="ACCESSIBLE">' + accessibleList[0] + '</field>' +
          '<value name="DELTA">' +
          '<shadow type="math_number">' +
          '<field name="NUM">1</field>' +
          '</shadow>' +
          '</value>' +
          '</block>' +
          '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }

    for (var i = 0; i < accessibleList.length; i++) {
      if (Blockly.Blocks['accessibles_get']) {
        var blockText = '<xml>' +
            '<block type="accessibles_get" gap="8">' +
            '<field name="ACCESSIBLE">' + accessibleList[i] + '</field>' +
            '</block>' +
            '</xml>';
        var block = Blockly.Xml.textToDom(blockText).firstChild;
        xmlList.push(block);
      }
    }
  }
  return xmlList;
};

/**
* Return a new accessible name that is not yet being used. This will try to
* generate single letter accessible names in the range 'i' to 'z' to start with.
* If no unique name is located it will try 'i' to 'z', 'a' to 'h',
* then 'i2' to 'z2' etc.  Skip 'l'.
 * @param {!Blockly.Workspace} workspace The workspace to be unique in.
* @return {string} New accessible name.
*/
Blockly.Accessibles.generateUniqueName = function(workspace) {
  var accessibleList = workspace.accessibleList;
  var newName = '';
  if (accessibleList.length) {
    var nameSuffix = 1;
    var letters = 'ijkmnopqrstuvwxyzabcdefgh';  // No 'l'.
    var letterIndex = 0;
    var potName = letters.charAt(letterIndex);
    while (!newName) {
      var inUse = false;
      for (var i = 0; i < accessibleList.length; i++) {
        if (accessibleList[i].toLowerCase() == potName) {
          // This potential name is already used.
          inUse = true;
          break;
        }
      }
      if (inUse) {
        // Try the next potential name.
        letterIndex++;
        if (letterIndex == letters.length) {
          // Reached the end of the character sequence so back to 'i'.
          // a new suffix.
          letterIndex = 0;
          nameSuffix++;
        }
        potName = letters.charAt(letterIndex);
        if (nameSuffix > 1) {
          potName += nameSuffix;
        }
      } else {
        // We can use the current potential name.
        newName = potName;
      }
    }
  } else {
    newName = 'i';
  }
  return newName;
};

/**
 * Create a new accessible on the given workspace.
 * @param {!Blockly.Workspace} workspace The workspace on which to create the
 *     accessible.
 * @param {function(?string=)=} opt_callback A callback. It will
 *     be passed an acceptable new accessible name, or null if change is to be
 *     aborted (cancel button), or undefined if an existing accessible was chosen.
 */
Blockly.Accessibles.createAccessible = function(workspace, opt_callback) {
  var promptAndCheckWithAlert = function(defaultName) {
    Blockly.Accessibles.promptName(Blockly.Msg.NEW_ACCESSIBLE_TITLE, defaultName,
      function(text) {
        if (text) {
          if (workspace.accessibleIndexOf(text) != -1) {
            Blockly.alert(Blockly.Msg.ACCESSIBLE_ALREADY_EXISTS.replace('%1',
                text.toLowerCase()),
                function() {
                  promptAndCheckWithAlert(text);  // Recurse
                });
          } else {
            workspace.createAccessible(text);
            if (opt_callback) {
              opt_callback(text);
            }
          }
        } else {
          // User canceled prompt without a value.
          if (opt_callback) {
            opt_callback(null);
          }
        }
      });
  };
  promptAndCheckWithAlert('');
};

/**
 * Prompt the user for a new accessible name.
 * @param {string} promptText The string of the prompt.
 * @param {string} defaultText The default value to show in the prompt's field.
 * @param {function(?string)} callback A callback. It will return the new
 *     accessible name, or null if the user picked something illegal.
 */
Blockly.Accessibles.promptName = function(promptText, defaultText, callback) {
  Blockly.prompt(promptText, defaultText, function(newAccessible) {
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    if (newAccessible) {
      newAccessible = newAccessible.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
      if (newAccessible == Blockly.Msg.RENAME_ACCESSIBLE ||
          newAccessible == Blockly.Msg.NEW_ACCESSIBLE) {
        // Ok, not ALL names are legal...
        newAccessible = null;
      }
    }
    callback(newAccessible);
  });
};
