'use strict';
goog.provide('Blockly.JavaScript.InspectorWidget.Accessibility');
//goog.require('Blockly.InspectorWidget.JavaScript');
Blockly.JavaScript['match_accessible'] = function (block) {
    // Template setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'ACCESSIBLE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.JavaScript.accessibleDB_.getName(block.getFieldValue('ACCESSIBLE'), Blockly.Accessibles.NAME_TYPE);
    return 'matchAccessible(' + varName + ');\n';
};
Blockly.JavaScript['accessibility_actions'] = function (block) {
    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE'
        , /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/
        Blockly.JavaScript.ORDER_NONE) || 'false';
    var argument1; //= block.getFieldValue('TEMPLATE_NAME');
    var test = block.getFieldValue('MODE');
    var name = '';
    // Replace by function finding name in ACCESSIBILITY_ACTIONS
    if (test === 'getFocusApplication' || test === 'getFocusWindow' || test === 'getPointedWidget' || test === 'trackApplicationSnapshot') {
        name = test;
        argument1 = block.getFieldValue('ACCESSIBLE');
    }
    else {
        // TODO: better handle error here
        console.log('Error for block accessibility_action: JavaScript export for type ' + test + ' unhandled.');
    }
    return argument1 + "=" + name + '();\n';
};
