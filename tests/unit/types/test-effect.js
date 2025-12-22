/**
 *
 * Reldens - Effect Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Effect = require('../../../lib/types/effect');
const SkillsConst = require('../../../lib/constants');
const SkillsEvents = require('../../../lib/skills-events');
const { Modifier, ModifierConst } = require('@reldens/modifiers');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');
const { MockTarget } = require('../../fixtures/mocks/mock-target');
const { BaseSkillsFixtures } = require('../../fixtures/skills/base-skills');

describe('Effect', () => {
    let mockOwner;
    let mockTarget;

    beforeEach(() => {
        mockOwner = new MockOwner();
        mockTarget = new MockTarget();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with effect type', () => {
            let effectData = {...BaseSkillsFixtures.effectSkill, owner: mockOwner};
            let effect = new Effect(effectData);
            assert.strictEqual(effect.type, SkillsConst.SKILL.TYPE.EFFECT);
        });

        it('should set isReady to false when targetEffects is missing', () => {
            let effectData = {key: 'test-effect', owner: mockOwner};
            let effect = new Effect(effectData);
            assert.strictEqual(effect.isReady, false);
        });

        it('should initialize with targetEffects', () => {
            let modifier = new Modifier({
                key: 'atk-buff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 5
            });
            let effectData = {
                key: 'test-effect',
                owner: mockOwner,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            assert.ok(Array.isArray(effect.targetEffects));
            assert.strictEqual(effect.targetEffects.length, 1);
        });

        it('should initialize with empty targetEffects array', () => {
            let effectData = {
                key: 'test-effect',
                owner: mockOwner,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            assert.ok(Array.isArray(effect.targetEffects));
            assert.strictEqual(effect.targetEffects.length, 0);
        });
    });

    describe('runSkillLogic', () => {
        it('should return false when out of range', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 10,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let result = await effect.runSkillLogic();
            assert.strictEqual(result, false);
            assert.strictEqual(effect.lastState, SkillsConst.SKILL_STATES.OUT_OF_RANGE);
        });

        it('should apply modifiers when in range', async () => {
            let modifier = new Modifier({
                key: 'atk-buff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let initialAtk = mockTarget.stats.atk;
            await effect.runSkillLogic();
            assert.ok(mockTarget.stats.atk !== initialAtk);
            assert.strictEqual(effect.lastState, SkillsConst.SKILL_STATES.APPLIED_EFFECTS);
        });

        it('should set lastState to APPLYING_EFFECTS', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            await effect.runSkillLogic();
            assert.strictEqual(effect.lastState, SkillsConst.SKILL_STATES.APPLIED_EFFECTS);
        });

        it('should fire SKILL_EFFECT_TARGET_MODIFIERS event', async () => {
            let eventFired = false;
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => {
                eventFired = true;
            }, 'effect-test');
            await effect.runSkillLogic();
            assert.strictEqual(eventFired, true);
        });
    });

    describe('Error Conditions', () => {
        it('should handle null target', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = null;
            let result = await effect.runSkillLogic();
            assert.strictEqual(result, false);
        });

        it('should handle undefined target', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = undefined;
            let result = await effect.runSkillLogic();
            assert.strictEqual(result, false);
        });

        it('should handle null targetEffects', () => {
            let effectData = {
                key: 'test-effect',
                owner: mockOwner,
                targetEffects: null
            };
            let effect = new Effect(effectData);
            assert.strictEqual(effect.isReady, false);
        });

        it('should handle undefined targetEffects', () => {
            let effectData = {
                key: 'test-effect',
                owner: mockOwner
            };
            let effect = new Effect(effectData);
            assert.strictEqual(effect.isReady, false);
        });
    });

    describe('Edge Cases - Range', () => {
        it('should handle zero range', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            await effect.runSkillLogic();
            assert.strictEqual(effect.lastState, SkillsConst.SKILL_STATES.APPLIED_EFFECTS);
        });

        it('should handle negative range', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: -10,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            await effect.runSkillLogic();
            assert.ok(typeof effect.lastState === 'string');
        });

        it('should handle very large range', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 10000,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            await effect.runSkillLogic();
            assert.strictEqual(effect.lastState, SkillsConst.SKILL_STATES.APPLIED_EFFECTS);
        });
    });

    describe('Edge Cases - Modifiers', () => {
        it('should handle multiple modifiers', async () => {
            let modifier1 = new Modifier({
                key: 'atk-buff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 5
            });
            let modifier2 = new Modifier({
                key: 'def-buff',
                propertyKey: 'stats/def',
                operation: ModifierConst.OPS.INC,
                value: 3
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: [modifier1, modifier2]
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let initialAtk = mockTarget.stats.atk;
            let initialDef = mockTarget.stats.def;
            await effect.runSkillLogic();
            assert.ok(mockTarget.stats.atk !== initialAtk);
            assert.ok(mockTarget.stats.def !== initialDef);
        });

        it('should handle modifier with DEC operation', async () => {
            let modifier = new Modifier({
                key: 'atk-debuff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.DEC,
                value: 5
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let initialAtk = mockTarget.stats.atk;
            await effect.runSkillLogic();
            assert.ok(mockTarget.stats.atk < initialAtk);
        });

        it('should handle modifier with SET operation', async () => {
            let modifier = new Modifier({
                key: 'atk-set',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.SET,
                value: 100
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            await effect.runSkillLogic();
            assert.strictEqual(mockTarget.stats.atk, 100);
        });

        it('should handle modifier with zero value', async () => {
            let modifier = new Modifier({
                key: 'atk-zero',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 0
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let initialAtk = mockTarget.stats.atk;
            await effect.runSkillLogic();
            assert.strictEqual(mockTarget.stats.atk, initialAtk);
        });

        it('should handle modifier with negative value', async () => {
            let modifier = new Modifier({
                key: 'atk-negative',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: -5
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let initialAtk = mockTarget.stats.atk;
            await effect.runSkillLogic();
            assert.ok(mockTarget.stats.atk !== initialAtk);
        });
    });

    describe('Event System - Parameter Variations', () => {
        it('should fire event with removeKey only', async () => {
            let eventFired = false;
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => {
                eventFired = true;
            }, 'remove-key');
            await effect.runSkillLogic();
            assert.strictEqual(eventFired, true);
        });

        it('should fire event with masterKey', async () => {
            let eventFired = false;
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            let masterKey = effect.getOwnerEventKey();
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => {
                eventFired = true;
            }, 'sub-key', masterKey);
            await effect.runSkillLogic();
            assert.strictEqual(eventFired, true);
        });

        it('should fire event without any keys', async () => {
            let eventFired = false;
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => {
                eventFired = true;
            });
            await effect.runSkillLogic();
            assert.strictEqual(eventFired, true);
        });

        it('should handle multiple listeners', async () => {
            let count = 0;
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            effect.target = mockTarget;
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => { count++; }, 'key1');
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => { count++; }, 'key2');
            effect.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, () => { count++; }, 'key3');
            await effect.runSkillLogic();
            assert.strictEqual(count, 3);
        });
    });

    describe('Integration with Skill Base Class', () => {
        it('should work with execute method', async () => {
            let modifier = new Modifier({
                key: 'hp-buff',
                propertyKey: 'stats/hp',
                operation: ModifierConst.OPS.INC,
                value: 20
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                castTime: 0,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            let initialHp = mockTarget.stats.hp;
            let result = await effect.execute(mockTarget);
            assert.strictEqual(result, true);
            assert.ok(mockTarget.stats.hp !== initialHp);
        });

        it('should handle castTime with effects', async () => {
            mockTarget.stats.stamina = 100;
            let modifier = new Modifier({
                key: 'stamina-buff',
                propertyKey: 'stats/stamina',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                castTime: 100,
                targetEffects: [modifier]
            };
            let effect = new Effect(effectData);
            await effect.execute(mockTarget);
            await TestHelpers.sleep(150);
            assert.ok(mockTarget.stats.stamina > 100);
        });

        it('should handle skillDelay', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                range: 0,
                castTime: 0,
                skillDelay: 1000,
                targetEffects: []
            };
            let effect = new Effect(effectData);
            await effect.execute(mockTarget);
            let result = effect.validate();
            assert.strictEqual(effect.canActivate, false);
        });
    });

    describe('Constructor - Null/Undefined Owner', () => {
        it('should handle null owner', () => {
            let effectData = {...BaseSkillsFixtures.effectSkill, owner: null};
            assert.throws(
                () => new Effect(effectData),
                TypeError
            );
        });

        it('should handle undefined owner', () => {
            let effectData = {...BaseSkillsFixtures.effectSkill};
            delete effectData.owner;
            assert.throws(
                () => new Effect(effectData),
                TypeError
            );
        });
    });

    describe('runSkillLogic - Critical Chance on Modifiers', () => {
        it('should apply critical multiplier to modifiers', async () => {
            let modifier = new Modifier({
                key: 'atk-buff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                targetEffects: [modifier],
                criticalChance: 100,
                criticalMultiplier: 2,
                range: 0,
                castTime: 0
            };
            let effect = new Effect(effectData);
            effect.isCritical = () => true;
            let initialAtk = mockTarget.stats.atk;
            await effect.execute(mockTarget);
            assert.ok(mockTarget.stats.atk > initialAtk + 10);
        });
    });

    describe('runSkillLogic - Empty Modifiers Behavior', () => {
        it('should handle empty modifiers array', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                targetEffects: [],
                range: 0,
                castTime: 0
            };
            let effect = new Effect(effectData);
            let result = await effect.execute(mockTarget);
            assert.strictEqual(result, true);
        });

        it('should handle null targetEffects', async () => {
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                targetEffects: null,
                range: 0
            };
            let effect = new Effect(effectData);
            let result = await effect.execute(mockTarget);
            assert.ok(typeof result === 'boolean');
        });
    });

    describe('runSkillLogic - Modifier Order Dependency', () => {
        it('should apply modifiers in order', async () => {
            let modifier1 = new Modifier({
                key: 'set-atk',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.SET,
                value: 20
            });
            let modifier2 = new Modifier({
                key: 'mult-atk',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.MUL,
                value: 2
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                targetEffects: [modifier1, modifier2],
                range: 0,
                criticalChance: 0,
                castTime: 0
            };
            let effect = new Effect(effectData);
            await effect.execute(mockTarget);
            assert.strictEqual(mockTarget.stats.atk, 40);
        });
    });

    describe('runSkillLogic - Return Value Consistency', () => {
        it('should return true on successful effect application', async () => {
            let modifier = new Modifier({
                key: 'hp-buff',
                propertyKey: 'stats/hp',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let effectData = {
                ...BaseSkillsFixtures.effectSkill,
                owner: mockOwner,
                targetEffects: [modifier],
                range: 0,
                castTime: 0
            };
            let effect = new Effect(effectData);
            let result = await effect.execute(mockTarget);
            assert.strictEqual(result, true);
        });
    });
});
