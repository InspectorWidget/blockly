/**
 * @license
 * Visual Blocks Language
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
 * @fileoverview Generating JavaScript for accessible blocks (forked from variable blocks).
 * @author gmail.com:christian.frisson (Christian Frisson)
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.JavaScript.accessibles');

goog.require('Blockly.JavaScript');


Blockly.JavaScript['accessibles_get'] = function(block) {
  // Accessible getter.
  var code = Blockly.JavaScript.accessibleDB_.getName(block.getFieldValue('ACCESSIBLE'),
      Blockly.Accessibles.NAME_TYPE);
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['accessibles_set'] = function(block) {
// Variable setter.
var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
                                               Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
var x = block.getFieldValue('X');
var y = block.getFieldValue('Y');
var w = block.getFieldValue('W');
var h = block.getFieldValue('H');
var v = block.getFieldValue('VIDEO');
var t = block.getFieldValue('TIME');
var varName = Blockly.JavaScript.accessibleDB_.getName(
    block.getFieldValue('ACCESSIBLE'), Blockly.Accessibles.NAME_TYPE);
return varName + ' = accessible(' + x + ',' + y + ',' + w + ',' + h + ',\'' + v + '\',' + t + ');\n';
};
