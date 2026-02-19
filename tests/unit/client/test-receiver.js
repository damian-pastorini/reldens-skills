/**
 *
 * Reldens - Receiver Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Receiver = require('../../../lib/client/receiver');
const SkillConst = require('../../../lib/constants');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');

describe('Receiver', () => {
    let mockOwner;

    beforeEach(() => {
        mockOwner = new MockOwner();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with owner', () => {
            let receiver = new Receiver({owner: mockOwner});
            assert.ok(receiver);
            assert.strictEqual(typeof receiver.actions, 'object');
        });

        it('should log error when owner is undefined', () => {
            let receiver = new Receiver({});
            assert.ok(receiver);
            assert.ok(typeof receiver.actions === 'object');
        });

        it('should log error when owner has no getPosition method', () => {
            let invalidOwner = {id: 'test'};
            let receiver = new Receiver({owner: invalidOwner});
            assert.ok(receiver);
            assert.ok(typeof receiver.actions === 'object');
        });

        it('should use custom actions when provided', () => {
            let customActions = {customAction: 'customMethod'};
            let receiver = new Receiver({owner: mockOwner, actions: customActions});
            assert.ok(receiver.actions.customAction);
            assert.strictEqual(receiver.actions.customAction, 'customMethod');
        });

        it('should skip default methods when avoidDefaults is true', () => {
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: true});
            assert.strictEqual(Object.keys(receiver.actions).length, 0);
        });

        it('should set default methods when avoidDefaults is false', () => {
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: false});
            assert.ok(Object.keys(receiver.actions).length > 0);
        });
    });

    describe('setDefaultMethods', () => {
        it('should map all action constants to method names', () => {
            let receiver = new Receiver({owner: mockOwner});
            assert.strictEqual(receiver.actions[SkillConst.ACTION_INIT_LEVEL_SET_START], 'onInitLevelSetStart');
            assert.strictEqual(receiver.actions[SkillConst.ACTION_INIT_LEVEL_SET_END], 'onInitLevelSetEnd');
            assert.strictEqual(receiver.actions[SkillConst.ACTION_INIT_CLASS_PATH_END], 'onInitClassPathEnd');
            assert.strictEqual(receiver.actions[SkillConst.ACTION_LEVEL_UP], 'onLevelUp');
            assert.strictEqual(receiver.actions[SkillConst.ACTION_LEVEL_DOWN], 'onLevelDown');
            assert.strictEqual(receiver.actions[SkillConst.ACTION_SKILL_BEFORE_CAST], 'onSkillBeforeCast');
            assert.strictEqual(receiver.actions[SkillConst.ACTION_SKILL_ATTACK_APPLY_DAMAGE], 'onSkillAttackApplyDamage');
        });

        it('should map all 29 default actions', () => {
            let receiver = new Receiver({owner: mockOwner});
            assert.strictEqual(Object.keys(receiver.actions).length, 29);
        });
    });

    describe('processMessage', () => {
        it('should return false for invalid message prefix', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: 'invalid.action'};
            let result = receiver.processMessage(message);
            assert.strictEqual(result, false);
        });

        it('should return false when action not found in actions', () => {
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: true});
            let message = {act: SkillConst.ACTIONS_PREF+'unknownAction'};
            let result = receiver.processMessage(message);
            assert.strictEqual(result, false);
        });

        it('should return false when mapped method does not exist', () => {
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: true});
            receiver.actions[SkillConst.ACTIONS_PREF+'test'] = 'nonExistentMethod';
            let message = {act: SkillConst.ACTIONS_PREF+'test'};
            let result = receiver.processMessage(message);
            assert.strictEqual(result, false);
        });

        it('should call mapped method when valid', () => {
            let called = false;
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: true});
            receiver.actions[SkillConst.ACTION_LEVEL_UP] = 'onLevelUp';
            receiver.onLevelUp = (message) => {
                called = true;
            };
            let message = {act: SkillConst.ACTION_LEVEL_UP, data: {lvl: 2}};
            receiver.processMessage(message);
            assert.strictEqual(called, true);
        });

        it('should pass message to mapped method', () => {
            let receivedMessage = null;
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: true});
            receiver.actions[SkillConst.ACTION_LEVEL_UP] = 'onLevelUp';
            receiver.onLevelUp = (message) => {
                receivedMessage = message;
            };
            let message = {act: SkillConst.ACTION_LEVEL_UP, data: {lvl: 2}};
            receiver.processMessage(message);
            assert.deepStrictEqual(receivedMessage, message);
        });
    });

    describe('isValidMessage', () => {
        it('should return true for valid message with correct prefix', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: SkillConst.ACTIONS_PREF+'test'};
            assert.strictEqual(receiver.isValidMessage(message), true);
        });

        it('should return false for message with wrong prefix', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: 'wrong.prefix.test'};
            assert.strictEqual(receiver.isValidMessage(message), false);
        });

        it('should return false for message with prefix not at beginning', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: 'prefix'+SkillConst.ACTIONS_PREF+'test'};
            assert.strictEqual(receiver.isValidMessage(message), false);
        });

        it('should validate all default action constants', () => {
            let receiver = new Receiver({owner: mockOwner});
            let validActions = [
                SkillConst.ACTION_INIT_LEVEL_SET_START,
                SkillConst.ACTION_INIT_CLASS_PATH_END,
                SkillConst.ACTION_LEVEL_UP,
                SkillConst.ACTION_SKILL_BEFORE_CAST
            ];
            for(let action of validActions){
                let message = {act: action};
                assert.strictEqual(receiver.isValidMessage(message), true);
            }
        });
    });

    describe('Integration - Method Mapping', () => {
        it('should handle multiple message processing', () => {
            let callCount = 0;
            let receiver = new Receiver({owner: mockOwner, avoidDefaults: true});
            receiver.actions[SkillConst.ACTION_LEVEL_UP] = 'onLevelUp';
            receiver.actions[SkillConst.ACTION_LEVEL_DOWN] = 'onLevelDown';
            receiver.onLevelUp = () => { callCount++; };
            receiver.onLevelDown = () => { callCount++; };
            receiver.processMessage({act: SkillConst.ACTION_LEVEL_UP});
            receiver.processMessage({act: SkillConst.ACTION_LEVEL_DOWN});
            assert.strictEqual(callCount, 2);
        });

        it('should handle method override', () => {
            let customCalled = false;
            let receiver = new Receiver({owner: mockOwner});
            receiver.onLevelUp = (message) => {
                customCalled = true;
            };
            let message = {act: SkillConst.ACTION_LEVEL_UP};
            receiver.processMessage(message);
            assert.strictEqual(customCalled, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty actions object', () => {
            let receiver = new Receiver({owner: mockOwner, actions: {}, avoidDefaults: true});
            assert.strictEqual(Object.keys(receiver.actions).length, 0);
        });

        it('should handle null message', () => {
            let receiver = new Receiver({owner: mockOwner});
            assert.throws(() => {
                receiver.processMessage(null);
            });
        });

        it('should handle message without act property', () => {
            let receiver = new Receiver({owner: mockOwner});
            assert.throws(() => {
                receiver.processMessage({data: 'test'});
            });
        });

        it('should handle empty string action', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: ''};
            let result = receiver.processMessage(message);
            assert.strictEqual(result, false);
        });
    });

    describe('processMessage - Null/Undefined Data', () => {
        it('should handle message with null data property', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: SkillConst.ACTION_LEVEL_UP, data: null};
            receiver.processMessage(message);
            assert.ok(receiver);
        });

        it('should handle message with undefined data property', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: SkillConst.ACTION_LEVEL_UP};
            receiver.processMessage(message);
            assert.ok(receiver);
        });
    });

    describe('processMessage - Error Handling Consistency', () => {
        it('should handle invalid action names gracefully', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {act: 'invalid.action', data: {}};
            receiver.processMessage(message);
            assert.ok(receiver);
        });
    });

    describe('isValidMessage - Message.act Undefined', () => {
        it('should return false when message.act is undefined', () => {
            let receiver = new Receiver({owner: mockOwner});
            let message = {data: {}};
            assert.throws(() => receiver.isValidMessage(message), TypeError);
        });
    });
});
