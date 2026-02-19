/**
 *
 * Reldens - PhysicalEffect Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const PhysicalEffect = require('../../../lib/types/physical-effect');
const { Modifier, ModifierConst } = require('@reldens/modifiers');
const SkillsConst = require('../../../lib/constants');
const SkillsEvents = require('../../../lib/skills-events');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');
const { MockTarget } = require('../../fixtures/mocks/mock-target');

describe('PhysicalEffect', () => {
    let mockOwner;
    let mockTarget;

    beforeEach(() => {
        mockOwner = new MockOwner();
        mockOwner.executePhysicalSkill = async () => {};
        mockTarget = new MockTarget();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with physical effect type', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.type, SkillsConst.SKILL.TYPE.PHYSICAL_EFFECT);
        });

        it('should set parent type to effect', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.parentType, SkillsConst.SKILL.TYPE.EFFECT);
        });

        it('should set isReady to true when all properties valid', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.isReady, true);
        });

        it('should set isReady to false when magnitude missing', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when objectWidth missing', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when objectHeight missing', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when executePhysicalSkill missing', () => {
            let ownerWithoutMethod = new MockOwner();
            let skillData = {
                key: 'test-physical-effect',
                owner: ownerWithoutMethod,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set magnitude property', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 150,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.magnitude, 150);
        });

        it('should set objectWidth property', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 20,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.objectWidth, 20);
        });

        it('should set objectHeight property', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 25,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.objectHeight, 25);
        });

        it('should set validateTargetOnHit to false by default', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.validateTargetOnHit, false);
        });

        it('should set validateTargetOnHit when provided', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [],
                validateTargetOnHit: true
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.validateTargetOnHit, true);
        });

        it('should inherit effect properties', () => {
            let modifier = new Modifier({
                key: 'speed-buff',
                propertyKey: 'stats/speed',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [modifier]
            };
            let skill = new PhysicalEffect(skillData);
            assert.ok(Array.isArray(skill.targetEffects));
            assert.strictEqual(skill.targetEffects.length, 1);
        });
    });

    describe('runSkillLogic', () => {
        it('should return false when target out of range', async () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                range: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            mockOwner.position = {x: 0, y: 0};
            mockTarget.position = {x: 100, y: 100};
            let result = await skill.runSkillLogic();
            assert.strictEqual(result, false);
        });

        it('should execute physical skill when in range', async () => {
            let executed = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                executed = true;
            };
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            await skill.runSkillLogic();
            assert.strictEqual(executed, true);
        });

        it('should return false after executing physical skill', async () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            let result = await skill.runSkillLogic();
            assert.strictEqual(result, false);
        });

        it('should pass target and skill to executePhysicalSkill', async () => {
            let receivedTarget = null;
            let receivedSkill = null;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                receivedTarget = target;
                receivedSkill = skill;
            };
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            await skill.runSkillLogic();
            assert.strictEqual(receivedTarget, mockTarget);
            assert.strictEqual(receivedSkill, skill);
        });
    });

    describe('executeOnHit', () => {
        it('should fire physical effect hit event', async () => {
            let eventFired = false;
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            skill.listenEvent(SkillsEvents.SKILL_PHYSICAL_EFFECT_HIT, async () => {
                eventFired = true;
            }, 'testListener', skill.getOwnerEventKey());
            await skill.executeOnHit(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should apply modifiers to target', async () => {
            let modifier = new Modifier({
                key: 'atk-buff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 20
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [modifier]
            };
            let skill = new PhysicalEffect(skillData);
            let initialAtk = mockTarget.stats.atk;
            await skill.executeOnHit(mockTarget);
            assert.strictEqual(mockTarget.stats.atk, initialAtk + 20);
        });

        it('should validate target when validateTargetOnHit is true', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [],
                validateTargetOnHit: true
            };
            let skill = new PhysicalEffect(skillData);
            let result = await skill.executeOnHit(differentTarget);
            assert.strictEqual(result, false);
        });

        it('should skip validation when validateTargetOnHit is false', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let modifier = new Modifier({
                key: 'def-buff',
                propertyKey: 'stats/def',
                operation: ModifierConst.OPS.INC,
                value: 15
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [modifier],
                validateTargetOnHit: false
            };
            let skill = new PhysicalEffect(skillData);
            let initialDef = mockTarget.stats.def;
            await skill.executeOnHit(differentTarget);
            assert.strictEqual(mockTarget.stats.def, initialDef + 15);
        });

        it('should call parent runSkillLogic', async () => {
            let modifier = new Modifier({
                key: 'mp-buff',
                propertyKey: 'stats/mp',
                operation: ModifierConst.OPS.INC,
                value: 25
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                range: 0,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: [modifier]
            };
            let skill = new PhysicalEffect(skillData);
            let initialMp = mockTarget.stats.mp;
            await skill.executeOnHit(mockTarget);
            assert.strictEqual(mockTarget.stats.mp, initialMp + 25);
        });

        it('should handle empty targetEffects array', async () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            await skill.executeOnHit(mockTarget);
        });
    });

    describe('Integration', () => {
        it('should handle complete physical effect flow', async () => {
            let physicalSkillExecuted = false;
            let hitExecuted = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                physicalSkillExecuted = true;
                await skill.executeOnHit(target);
            };
            let modifier = new Modifier({
                key: 'hp-buff',
                propertyKey: 'stats/hp',
                operation: ModifierConst.OPS.INC,
                value: 25
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: [modifier]
            };
            let skill = new PhysicalEffect(skillData);
            skill.listenEvent(SkillsEvents.SKILL_PHYSICAL_EFFECT_HIT, async () => {
                hitExecuted = true;
            }, 'hitListener', skill.getOwnerEventKey());
            let initialHp = mockTarget.stats.hp;
            await skill.runSkillLogic();
            assert.strictEqual(physicalSkillExecuted, true);
            assert.strictEqual(hitExecuted, true);
            assert.strictEqual(mockTarget.stats.hp, initialHp + 25);
        });

        it('should apply multiple modifiers', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let modifiers = [
                new Modifier({
                    key: 'atk-buff',
                    propertyKey: 'stats/atk',
                    operation: ModifierConst.OPS.INC,
                    value: 10
                }),
                new Modifier({
                    key: 'def-buff',
                    propertyKey: 'stats/def',
                    operation: ModifierConst.OPS.INC,
                    value: 8
                })
            ];
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: modifiers
            };
            let skill = new PhysicalEffect(skillData);
            let initialAtk = mockTarget.stats.atk;
            let initialDef = mockTarget.stats.def;
            await skill.runSkillLogic();
            assert.strictEqual(mockTarget.stats.atk, initialAtk + 10);
            assert.strictEqual(mockTarget.stats.def, initialDef + 8);
        });

        it('should handle critical modifiers', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let modifier = new Modifier({
                key: 'mp-buff',
                propertyKey: 'stats/mp',
                operation: ModifierConst.OPS.INC,
                value: 20
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: [modifier],
                criticalChance: 100,
                criticalMultiplier: 2
            };
            let skill = new PhysicalEffect(skillData);
            let initialMp = mockTarget.stats.mp;
            await skill.runSkillLogic();
            assert.strictEqual(mockTarget.stats.mp, initialMp + (20 * 2));
        });

        it('should broadcast effect event', async () => {
            let eventFired = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            skill.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, async () => {
                eventFired = true;
            }, 'effectListener', skill.getOwnerEventKey());
            await skill.runSkillLogic();
            assert.strictEqual(eventFired, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero magnitude', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 0,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.magnitude, 0);
            assert.strictEqual(skill.isReady, true);
        });

        it('should handle zero object dimensions', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 0,
                objectHeight: 0,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.objectWidth, 0);
            assert.strictEqual(skill.objectHeight, 0);
            assert.strictEqual(skill.isReady, true);
        });

        it('should handle large magnitude values', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 999999,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.magnitude, 999999);
        });

        it('should handle decimal magnitude', () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                magnitude: 150.75,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            assert.strictEqual(skill.magnitude, 150.75);
        });

        it('should handle null target in runSkillLogic', async () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: null,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            await assert.rejects(async () => {
                await skill.runSkillLogic();
            });
        });

        it('should handle target without stats property', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let targetWithoutStats = {
                id: 'test-target',
                getPosition: () => ({x: 0, y: 0}),
                position: {x: 0, y: 0}
            };
            let modifier = new Modifier({
                key: 'new-stat',
                propertyKey: 'stats/newStat',
                operation: ModifierConst.OPS.SET_VALUE,
                value: 100
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: targetWithoutStats,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: [modifier]
            };
            let skill = new PhysicalEffect(skillData);
            await assert.rejects(async () => {
                await skill.runSkillLogic();
            });
        });

        it('should handle modifier operations on undefined properties', async () => {
            let modifier = new Modifier({
                key: 'undefined-buff',
                propertyKey: 'stats/undefinedProp',
                operation: ModifierConst.OPS.INC,
                value: 50
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [modifier]
            };
            let skill = new PhysicalEffect(skillData);
            await skill.executeOnHit(mockTarget);
            assert.strictEqual(mockTarget.stats.undefinedProp, 50);
        });
    });

    describe('executeOnHit - lastState on Validation Failure', () => {
        it('should set lastState when validateTargetOnHit fails', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [],
                validateTargetOnHit: true
            };
            let skill = new PhysicalEffect(skillData);
            await skill.executeOnHit(differentTarget);
            assert.ok(skill.lastState);
        });
    });

    describe('executeOnHit - Parent Throws During Execution', () => {
        it('should handle when parent runSkillLogic throws error', async () => {
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                range: 100,
                targetEffects: []
            };
            let skill = new PhysicalEffect(skillData);
            mockTarget.getPosition = () => {
                throw new Error('Parent error');
            };
            await assert.rejects(async () => {
                await skill.executeOnHit(mockTarget);
            });
        });
    });

    describe('executeOnHit - Critical Multiplier from executeOnHit Path', () => {
        it('should apply critical multiplier when called from executeOnHit', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let modifier = new Modifier({
                key: 'stamina-buff',
                propertyKey: 'stats/stamina',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                targetEffects: [modifier],
                criticalChance: 100,
                criticalMultiplier: 3
            };
            let skill = new PhysicalEffect(skillData);
            skill.isCritical = () => true;
            let initialStamina = mockTarget.stats.stamina;
            await skill.runSkillLogic();
            assert.strictEqual(mockTarget.stats.stamina, initialStamina + 30);
        });
    });

    describe('executeOnHit - Multiple Hits on Same Target', () => {
        it('should handle multiple executeOnHit calls on same target', async () => {
            let modifier = new Modifier({
                key: 'mp-buff',
                propertyKey: 'stats/mp',
                operation: ModifierConst.OPS.INC,
                value: 5
            });
            let skillData = {
                key: 'test-physical-effect',
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                targetEffects: [modifier],
                criticalChance: 0
            };
            let skill = new PhysicalEffect(skillData);
            let initialMp = mockTarget.stats.mp;
            await skill.executeOnHit(mockTarget);
            await skill.executeOnHit(mockTarget);
            await skill.executeOnHit(mockTarget);
            assert.strictEqual(mockTarget.stats.mp, initialMp + 15);
        });
    });
});
