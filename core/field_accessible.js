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
 * @fileoverview Accessible input field (forked from variable input field).
 * @author gmail.com:christian.frisson (Christian Frisson), fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldAccessible');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Msg');
goog.require('Blockly.Accessibles');
goog.require('goog.asserts');
goog.require('goog.string');

/**
 * Class for a accessible's dropdown field.
 * @param {?string} varname The default name for the accessible.  If null,
 *     a unique accessible name will be generated.
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.
 * @extends {Blockly.FieldDropdown}
 * @constructor
 */
Blockly.FieldAccessible = function(varname, opt_validator) {
  Blockly.FieldAccessible.superClass_.constructor.call(this,
      Blockly.FieldAccessible.dropdownCreate, opt_validator);
  this.setValue(varname || '');
};
goog.inherits(Blockly.FieldAccessible, Blockly.FieldDropdown);

/**
 * The menu item index for the rename accessible option.
 * @type {number}
 * @private
 */
Blockly.FieldAccessible.prototype.renameAccessibleItemIndex_ = -1;

/**
 * The menu item index for the delete variable option.
 * @type {number}
 * @private
 */
Blockly.FieldAccessible.prototype.deleteAccessibleItemIndex_ = -1;

/**
 * The menu item index for the new variable option.
 * @type {number}
 * @private
 */
Blockly.FieldAccessible.prototype.newAccessibleItemIndex_ = -1;

/**
 * Install this dropdown on a block.
 */
Blockly.FieldAccessible.prototype.init = function(block) {
  if (this.fieldGroup_) {
    // Dropdown has already been initialized once.
    return;
  }
  Blockly.FieldAccessible.superClass_.init.call(this);
  if (!this.getValue()) {
    // Accessibles without names get uniquely named for this workspace.
    var workspace =
        this.sourceBlock_.isInFlyout ?
            this.sourceBlock_.workspace.targetWorkspace :
            this.sourceBlock_.workspace;
    this.setValue(Blockly.Accessibles.generateUniqueName(workspace));
  }
  // If the selected variable doesn't exist yet, create it.
  // For instance, some blocks in the toolbox have variable dropdowns filled
  // in by default.
  if (!this.sourceBlock_.isInFlyout) {
    this.sourceBlock_.workspace.createAccessible(this.getValue());
  }
};

/**
 * Attach this field to a block.
 * @param {!Blockly.Block} block The block containing this field.
 */
Blockly.FieldAccessible.prototype.setSourceBlock = function(block) {
  goog.asserts.assert(!block.isShadow(),
      'Accessible fields are not allowed to exist on shadow blocks.');
  Blockly.FieldAccessible.superClass_.setSourceBlock.call(this, block);
};

/**
 * Get the accessible name (use a accessibleDB to convert into a real name).
 * Unline a regular dropdown, variables are literal and have no neutral value.
 * @return {string} Current text.
 */
Blockly.FieldAccessible.prototype.getValue = function() {
  return this.getText();
};

/**
 * Set the accessible name.
 * @param {string} newValue New text.
 */
Blockly.FieldAccessible.prototype.setValue = function(newValue) {
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
        this.sourceBlock_, 'field', this.name, this.value_, newValue));
  }
  this.value_ = newValue;
  this.setText(newValue);
};

/**
 * Callback to be overloaded
 * Triggered once a new accessible has been created with Blockly.
 */
Blockly.FieldAccessible.prototype.defineAccessibleCallback = function(caller,name) {
}

/**
 * Return a sorted list of accessible names for accessible dropdown menus.
 * Include a special option at the end for creating a new accessible name.
 * @return {!Array.<string>} Array of accessible names.
 * @this {!Blockly.FieldAccessible}
 */
Blockly.FieldAccessible.dropdownCreate = function() {
  if (this.sourceBlock_ && this.sourceBlock_.workspace) {
    // Get a copy of the list, so that adding rename and new variable options
    // doesn't modify the workspace's list.
    var accessibleList = this.sourceBlock_.workspace.accessibleList.slice(0);
  } else {
    var accessibleList = [];
  }
  // Ensure that the currently selected accessible is an option.
  var name = this.getText();
  if (name && accessibleList.indexOf(name) == -1) {
    accessibleList.push(name);
  }
  accessibleList.sort(goog.string.caseInsensitiveCompare);

  this.renameAccessibleItemIndex_ = accessibleList.length;
  accessibleList.push(Blockly.Msg.RENAME_ACCESSIBLE);

  this.deleteAccessibleItemIndex_ = accessibleList.length;
  accessibleList.push(Blockly.Msg.DELETE_ACCESSIBLE.replace('%1', name));

  this.newAccessibleItemIndex_ = accessibleList.length;
  accessibleList.push(Blockly.Msg.NEW_ACCESSIBLE);
  // Accessibles are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var i = 0; i < accessibleList.length; i++) {
    options[i] = [accessibleList[i], accessibleList[i]];
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
Blockly.FieldAccessible.prototype.onItemSelected = function(menu, menuItem) {
  var itemText = menuItem.getValue();
  if (this.sourceBlock_) {
    var workspace = this.sourceBlock_.workspace;
    if (this.renameAccessibleItemIndex_ >= 0 &&
        menu.getChildAt(this.renameAccessibleItemIndex_) === menuItem) {
      // Rename variable.
      var oldName = this.getText();
      Blockly.hideChaff();
      Blockly.Accessibles.promptName(
          Blockly.Msg.RENAME_ACCESSIBLE_TITLE.replace('%1', oldName), oldName,
          function(newName) {
            if (newName) {
              workspace.renameAccessible(oldName, newName);
            }
          });
      return;
    } else if (this.newAccessibleItemIndex_ >= 0 &&
        menu.getChildAt(this.newAccessibleItemIndex_) === menuItem) {
          var self = this;
          Blockly.Accessibles.promptName(
              Blockly.Msg.NEW_ACCESSIBLE_TITLE, '',
              function(newName) {
                if (newName) {
                  workspace.createAccessible(newName)
                  var newAccessibleIndex = workspace.accessibleIndexOf(newName);
                  if(newAccessibleIndex != -1){
                    self.setValue(newName);
                    self.defineAccessibleCallback(self,newName);
                  }
                }
                return;
              });
              return;
    } else if (this.deleteAccessibleItemIndex_ >= 0 &&
        menu.getChildAt(this.deleteAccessibleItemIndex_) === menuItem) {
      // Delete variable.
      workspace.deleteAccessible(this.getText());
      return;
    }


    // Call any validation function, and allow it to override.
    itemText = this.callValidator(itemText);
  }
  if (itemText !== null) {
    this.setValue(itemText);
  }
};
