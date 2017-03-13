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
 * @fileoverview Template input field (forked from variable input field).
 * @author gmail.com:christian.frisson (Christian Frisson), fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldTemplate');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Msg');
goog.require('Blockly.Templates');
goog.require('goog.asserts');
goog.require('goog.string');

/**
 * Class for a template's dropdown field.
 * @param {?string} varname The default name for the template.  If null,
 *     a unique template name will be generated.
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.
 * @extends {Blockly.FieldDropdown}
 * @constructor
 */
Blockly.FieldTemplate = function(varname, opt_validator) {
  Blockly.FieldTemplate.superClass_.constructor.call(this,
      Blockly.FieldTemplate.dropdownCreate, opt_validator);
  this.setValue(varname || '');
};
goog.inherits(Blockly.FieldTemplate, Blockly.FieldDropdown);

/**
 * The menu item index for the rename template option.
 * @type {number}
 * @private
 */
Blockly.FieldTemplate.prototype.renameTemplateItemIndex_ = -1;

/**
 * The menu item index for the delete variable option.
 * @type {number}
 * @private
 */
Blockly.FieldTemplate.prototype.deleteTemplateItemIndex_ = -1;

/**
 * The menu item index for the new variable option.
 * @type {number}
 * @private
 */
Blockly.FieldTemplate.prototype.newTemplateItemIndex_ = -1;

/**
 * Install this dropdown on a block.
 */
Blockly.FieldTemplate.prototype.init = function(block) {
  if (this.fieldGroup_) {
    // Dropdown has already been initialized once.
    return;
  }
  Blockly.FieldTemplate.superClass_.init.call(this);
  if (!this.getValue()) {
    // Templates without names get uniquely named for this workspace.
    var workspace =
        this.sourceBlock_.isInFlyout ?
            this.sourceBlock_.workspace.targetWorkspace :
            this.sourceBlock_.workspace;
    this.setValue(Blockly.Templates.generateUniqueName(workspace));
  }
  // If the selected variable doesn't exist yet, create it.
  // For instance, some blocks in the toolbox have variable dropdowns filled
  // in by default.
  if (!this.sourceBlock_.isInFlyout) {
    this.sourceBlock_.workspace.createTemplate(this.getValue());
  }
};

/**
 * Attach this field to a block.
 * @param {!Blockly.Block} block The block containing this field.
 */
Blockly.FieldTemplate.prototype.setSourceBlock = function(block) {
  goog.asserts.assert(!block.isShadow(),
      'Template fields are not allowed to exist on shadow blocks.');
  Blockly.FieldTemplate.superClass_.setSourceBlock.call(this, block);
};

/**
 * Get the template name (use a templateDB to convert into a real name).
 * Unline a regular dropdown, variables are literal and have no neutral value.
 * @return {string} Current text.
 */
Blockly.FieldTemplate.prototype.getValue = function() {
  return this.getText();
};

/**
 * Set the template name.
 * @param {string} newValue New text.
 */
Blockly.FieldTemplate.prototype.setValue = function(newValue) {
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
        this.sourceBlock_, 'field', this.name, this.value_, newValue));
  }
  this.value_ = newValue;
  this.setText(newValue);
};

/**
 * Callback to be overloaded
 * Triggered once a new template has been created with Blockly.
 */
Blockly.FieldTemplate.prototype.defineTemplateCallback = function(caller,name) {
}

/**
 * Return a sorted list of template names for template dropdown menus.
 * Include a special option at the end for creating a new template name.
 * @return {!Array.<string>} Array of template names.
 * @this {!Blockly.FieldTemplate}
 */
Blockly.FieldTemplate.dropdownCreate = function() {
  if (this.sourceBlock_ && this.sourceBlock_.workspace) {
    // Get a copy of the list, so that adding rename and new variable options
    // doesn't modify the workspace's list.
    var templateList = this.sourceBlock_.workspace.templateList.slice(0);
  } else {
    var templateList = [];
  }
  // Ensure that the currently selected template is an option.
  var name = this.getText();
  if (name && templateList.indexOf(name) == -1) {
    templateList.push(name);
  }
  templateList.sort(goog.string.caseInsensitiveCompare);

  this.renameTemplateItemIndex_ = templateList.length;
  templateList.push(Blockly.Msg.RENAME_TEMPLATE);

  this.deleteTemplateItemIndex_ = templateList.length;
  templateList.push(Blockly.Msg.DELETE_TEMPLATE.replace('%1', name));

  this.newTemplateItemIndex_ = templateList.length;
  templateList.push(Blockly.Msg.NEW_TEMPLATE);
  // Templates are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var i = 0; i < templateList.length; i++) {
    options[i] = [templateList[i], templateList[i]];
  }
  return options;
};

/**
 * Handle the selection of an item in the variable dropdown menu.
 * Special case the 'Rename variable...' and 'Delete variable...' options.
 * In the rename case, prompt the user for a new name.
 * @param {!goog.ui.Menu} menu The Menu component clicked.
 * @param {!goog.ui.MenuItem} menuItem The MenuItem selected within menu.
 */
Blockly.FieldTemplate.prototype.onItemSelected = function(menu, menuItem) {
  var itemText = menuItem.getValue();
  if (this.sourceBlock_) {
    var workspace = this.sourceBlock_.workspace;
    if (this.renameTemplateItemIndex_ >= 0 &&
        menu.getChildAt(this.renameTemplateItemIndex_) === menuItem) {
      // Rename variable.
      var oldName = this.getText();
      Blockly.hideChaff();
      Blockly.Templates.promptName(
          Blockly.Msg.RENAME_TEMPLATE_TITLE.replace('%1', oldName), oldName,
          function(newName) {
            if (newName) {
              workspace.renameTemplate(oldName, newName);
            }
          });
      return;
    } else if (this.newTemplateItemIndex_ >= 0 &&
        menu.getChildAt(this.newTemplateItemIndex_) === menuItem) {
          var self = this;
          Blockly.Templates.promptName(
              Blockly.Msg.NEW_TEMPLATE_TITLE, '',
              function(newName) {
                if (newName) {
                  workspace.createTemplate(newName)
                  var newTemplateIndex = workspace.templateIndexOf(newName);
                  if(newTemplateIndex != -1){
                    self.setValue(newName);
                    self.defineTemplateCallback(self,newName);
                  }
                }
                return;
              });
              return;
    } else if (this.deleteTemplateItemIndex_ >= 0 &&
        menu.getChildAt(this.deleteTemplateItemIndex_) === menuItem) {
      // Delete variable.
      workspace.deleteTemplate(this.getText());
      return;
    }


    // Call any validation function, and allow it to override.
    itemText = this.callValidator(itemText);
  }
  if (itemText !== null) {
    this.setValue(itemText);
  }
};
