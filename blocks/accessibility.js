'use strict';
goog.provide('Blockly.Blocks.InspectorWidget.Accessibility');
Blockly.Blocks.InspectorWidget.Accessibility.HUE = 210;
/**
 * Block for accessibility matching.
 * @this Blockly.Block
 */
Blockly.Blocks['match_accessible'] = {
    init: function () {
        this.jsonInit({
            "message0": 'matchAccessible(%1)'
            , "args0": [
                {
                    "type": "field_accessible"
                    , "name": "ACCESSIBLE"
                    , "accessible": 'accessible'
                }
            ]
            , "tooltip": "Match accessible over the video(s)."
            , "helpUrl": "http://www.github.com/InspectorWidget/InspectorWidget"
            , "inputsInline": true
            , "previousStatement": null
            , "nextStatement": null
        , });
        this.setColour(Blockly.Blocks.InspectorWidget.Accessibility.HUE);
    }
    , /**
     * Return all accessibles referenced by this block.
     * @return {!Array.<string>} List of template names.
     * @this Blockly.Block
     */
    getAccessibles: function () {
        return [this.getFieldValue('ACCESSIBLE')];
    }
    , /**
     * Notification that an accessible is renaming.
     * If the name matches one of this block's accessibles, rename it.
     * @param {string} oldName Previous name of accessible.
     * @param {string} newName Renamed accessible.
     * @this Blockly.Block
     */
    renameAccessible: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('ACCESSIBLE'))) {
            this.setFieldValue(newName, 'ACCESSIBLE');
        }
    }
    , /*contextMenuType_: 'accessibles_get',
           customContextMenu: Blockly.Blocks['accessibles_get'].customContextMenu*/
};
/**
 * Block for accessibility extraction.
 * @this Blockly.Block
 */
var ACCESSIBILITY_ACTIONS = [
        ["getFocusApplication", 'getFocusApplication']
        , ["getFocusWindow", 'getFocusWindow']
        , ["getPointedWidget", 'getPointedWidget']
        , ["trackApplicationSnapshot", 'trackApplicationSnapshot']
    , ];
var ACCESSIBILITY_TOOLTIPS = {
    'getFocusApplication': "get application in focus"
    , 'getFocusWindow': "get window in focus"
    , 'getPointedWidget': "get pointed widget"
    , 'trackApplicationSnapshot': "track application snapshot"
, };
Blockly.Blocks['accessibility_actions'] = {
    /**
     * Block for text extraction.
     * @this Blockly.Block
     */
    init: function () {
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(ACCESSIBILITY_ACTIONS, function (option) {
            this.sourceBlock_.updateShape_(option);
        }), 'MODE')
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Assign 'this' to a variables for use in the tooltip closure below.
        var thisBlock = this;
        this.setTooltip(function () {
            var op = thisBlock.getFieldValue('MODE');
            return ACCESSIBILITY_TOOLTIPS[op];
        });
        this.setHelpUrl('https://github.com/InspectorWidget/InspectorWidget');
        this.setColour(Blockly.Blocks.InspectorWidget.Accessibility.HUE);
        if (ACCESSIBILITY_ACTIONS.length > 0) {
            this.updateShape_(ACCESSIBILITY_ACTIONS[0][1]);
        }
    }
    , /**
     * Create XML to represent the text detection type.
     * @return {Element} XML storage element.
     * @this Blockly.Block
     */
    mutationToDom: function () {
        var container = document.createElement('mutation');
        var input = this.getFieldValue('MODE');
        for (var f = 0; f < ACCESSIBILITY_ACTIONS.length; f++) {
            if (input === ACCESSIBILITY_ACTIONS[f][1]) {
                container.setAttribute('input_', ACCESSIBILITY_ACTIONS[f][1]);
                return container;
            }
        }
        return container;
    }
    , /**
     * Parse XML to restore the extraction test.
     * @param {!Element} xmlElement XML storage element.
     * @this Blockly.Block
     */
    domToMutation: function (xmlElement) {
        var input = xmlElement.getAttribute('input_');
        for (var f = 0; f < ACCESSIBILITY_ACTIONS.length; f++) {
            if (input === ACCESSIBILITY_ACTIONS[f][1]) {
                this.updateShape_(ACCESSIBILITY_ACTIONS[f][1]);
                return;
            }
        }
    }
    , /**
     * Modify this block along the extraction test.
     * @param {String} extraction test name.
     * @private
     * @this Blockly.Block
     */
    updateShape_: function (test) {
        var testValueInputExists = this.getInput('TEST_VALUE');
        if (testValueInputExists) {
            this.removeInput('TEST_VALUE');
        }
        var parenthesesExists = this.getInput('PARENTHESES');
        if (parenthesesExists) {
            this.removeInput('PARENTHESES');
        }
        if (test === 'getFocusApplication' || test === 'getFocusWindow' || test === 'getPointedWidget' || test === 'trackApplicationSnapshot') {
            // add input for 1 variable
            this.appendDummyInput('TEST_VALUE').appendField(new Blockly.FieldAccessible('accessible'), 'ACCESSIBLE').appendField(new Blockly.FieldLabel(' = '));
            this.moveInputBefore('TEST_VALUE', 'ACTION');
            this.appendDummyInput('PARENTHESES').appendField(new Blockly.FieldLabel('()'));
        }
        else {
            // TODO: better handle error here
            console.log('Error for block accessibility_action: updating shape for detection type ' + test + ' unhandled.');
        }
    }
    , /**
     * Return all variables referenced by this block.
     * @return {!Array.<string>} List of variable names.
     * @this Blockly.Block
     */
    getAccessibles: function () {
        return [this.getFieldValue('ACCESSIBLE')];
    }
    , /**
     * Notification that a variable is renaming.
     * If the name matches one of this block's variables, rename it.
     * @param {string} oldName Previous name of variable.
     * @param {string} newName Renamed variable.
     * @this Blockly.Block
     */
    renameAccessible: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('ACCESSIBLE'))) {
            this.setFieldValue(newName, 'ACCESSIBLE');
        }
    }
};
