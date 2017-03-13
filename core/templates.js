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
 * @fileoverview Utility functions for handling templates (forked from templates).
 * @author gmail.com:christian.frisson (Christian Frisson)
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Templates');

goog.require('Blockly.Blocks');
goog.require('Blockly.constants');
goog.require('Blockly.Workspace');
goog.require('goog.string');


/**
 * Category to separate template names from procedures and generated functions.
 */
Blockly.Templates.NAME_TYPE = 'TEMPLATE';

/**
 * Find all user-created templates.
 * @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
 * @return {!Array.<string>} Array of template names.
 */
Blockly.Templates.allUsedTemplates = function(root) {
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
  var templateHash = Object.create(null);
  // Iterate through every block and add each template to the hash.
  for (var x = 0; x < blocks.length; x++) {
    var blockTemplates = blocks[x].getTemplates();
    if (blockTemplates) {
      for (var y = 0; y < blockTemplates.length; y++) {
        var templateName = blockTemplates[y];
        // Variable name may be null if the block is only half-built.
        if (templateName) {
          templateHash[templateName.toLowerCase()] = templateName;
        }
      }
    }
  }
  // Flatten the hash into a list.
  var templateList = [];
  for (var name in templateHash) {
    templateList.push(templateHash[name]);
  }
  return templateList;
};

/**
 * Find all instances of the specified template and rename them.
 * @param {string} oldName Template to rename.
 * @param {string} newName New template name.
 * @param {!Blockly.Workspace} workspace Workspace rename templates in.
 */
Blockly.Templates.allTemplates = function(root) {
  if (root instanceof Blockly.Block) {
    // Root is Block.
    console.warn('Deprecated call to Blockly.Templates.allTemplates ' +
                 'with a block instead of a workspace.  You may want ' +
                 'Blockly.Templates.allUsedTemplates');
  }
  return root.templateList;
};

/**
 * Construct the blocks required by the flyout for the template category.
 * @param {!Blockly.Workspace} workspace The workspace contianing templates.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Templates.flyoutCategory = function(workspace) {
  var templateList = workspace.templateList;
  templateList.sort(goog.string.caseInsensitiveCompare);

  var xmlList = [];
  var button = goog.dom.createDom('button');
  button.setAttribute('text', Blockly.Msg.NEW_TEMPLATE);
  button.setAttribute('callbackKey', 'CREATE_TEMPLATE');

  workspace.registerButtonCallback('CREATE_TEMPLATE', function(button) {
    Blockly.Templates.createTemplate(button.getTargetWorkspace());
  });

  xmlList.push(button);

  if (templateList.length > 0) {
    if (Blockly.Blocks['templates_set']) {
      var gap = Blockly.Blocks['math_change'] ? 8 : 24;
      var blockText = '<xml>' +
            '<block type="templates_set" gap="' + gap + '">' +
            '<field name="TEMPLATE">' + templateList[0] + '</field>' +
            '</block>' +
            '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }
    if (Blockly.Blocks['math_change']) {
      var gap = Blockly.Blocks['templates_get'] ? 20 : 8;
      var blockText = '<xml>' +
          '<block type="math_change" gap="' + gap + '">' +
          '<field name="TEMPLATE">' + templateList[0] + '</field>' +
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

    for (var i = 0; i < templateList.length; i++) {
      if (Blockly.Blocks['templates_get']) {
        var blockText = '<xml>' +
            '<block type="templates_get" gap="8">' +
            '<field name="TEMPLATE">' + templateList[i] + '</field>' +
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
* Return a new template name that is not yet being used. This will try to
* generate single letter template names in the range 'i' to 'z' to start with.
* If no unique name is located it will try 'i' to 'z', 'a' to 'h',
* then 'i2' to 'z2' etc.  Skip 'l'.
 * @param {!Blockly.Workspace} workspace The workspace to be unique in.
* @return {string} New template name.
*/
Blockly.Templates.generateUniqueName = function(workspace) {
  var templateList = workspace.templateList;
  var newName = '';
  if (templateList.length) {
    var nameSuffix = 1;
    var letters = 'ijkmnopqrstuvwxyzabcdefgh';  // No 'l'.
    var letterIndex = 0;
    var potName = letters.charAt(letterIndex);
    while (!newName) {
      var inUse = false;
      for (var i = 0; i < templateList.length; i++) {
        if (templateList[i].toLowerCase() == potName) {
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
 * Create a new template on the given workspace.
 * @param {!Blockly.Workspace} workspace The workspace on which to create the
 *     template.
 * @param {function(?string=)=} opt_callback A callback. It will
 *     be passed an acceptable new template name, or null if change is to be
 *     aborted (cancel button), or undefined if an existing template was chosen.
 */
Blockly.Templates.createTemplate = function(workspace, opt_callback) {
  var promptAndCheckWithAlert = function(defaultName) {
    Blockly.Templates.promptName(Blockly.Msg.NEW_TEMPLATE_TITLE, defaultName,
      function(text) {
        if (text) {
          if (workspace.templateIndexOf(text) != -1) {
            Blockly.alert(Blockly.Msg.TEMPLATE_ALREADY_EXISTS.replace('%1',
                text.toLowerCase()),
                function() {
                  promptAndCheckWithAlert(text);  // Recurse
                });
          } else {
            workspace.createTemplate(text);
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
 * Prompt the user for a new template name.
 * @param {string} promptText The string of the prompt.
 * @param {string} defaultText The default value to show in the prompt's field.
 * @param {function(?string)} callback A callback. It will return the new
 *     template name, or null if the user picked something illegal.
 */
Blockly.Templates.promptName = function(promptText, defaultText, callback) {
  Blockly.prompt(promptText, defaultText, function(newTemplate) {
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    if (newTemplate) {
      newTemplate = newTemplate.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
      if (newTemplate == Blockly.Msg.RENAME_TEMPLATE ||
          newTemplate == Blockly.Msg.NEW_TEMPLATE) {
        // Ok, not ALL names are legal...
        newTemplate = null;
      }
    }
    callback(newTemplate);
  });
};
