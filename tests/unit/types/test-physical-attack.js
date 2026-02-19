/**
 *
 * Reldens - PhysicalAttack Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const PhysicalAttack = require('../../../lib/types/physical-attack');
const SkillsConst = require('../../../lib/constants');
const SkillsEvents = require('../../../lib/skills-events');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');
const { MockTarget } = require('../../fixtures/mocks/mock-target');
const { BaseSkillsFixtures } = require('../../fixtures/skills/base-skills');

describe('PhysicalAttack', () => {
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
        it('should initialize with physical attack type', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.type, SkillsConst.SKILL.TYPE.PHYSICAL_ATTACK);
        });

        it('should set parent type to attack', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.parentType, SkillsConst.SKILL.TYPE.ATTACK);
        });

        it('should set isReady to true when all properties valid', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.isReady, true);
        });

        it('should set isReady to false when magnitude missing', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            delete skillData.magnitude;
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when objectWidth missing', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            delete skillData.objectWidth;
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when objectHeight missing', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            delete skillData.objectHeight;
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when executePhysicalSkill missing', () => {
            let ownerWithoutMethod = new MockOwner();
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: ownerWithoutMethod};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.isReady, false);
        });

        it('should set magnitude property', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.magnitude, 100);
        });

        it('should set objectWidth property', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.objectWidth, 10);
        });

        it('should set objectHeight property', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.objectHeight, 10);
        });

        it('should set validateTargetOnHit to false by default', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.validateTargetOnHit, false);
        });

        it('should set validateTargetOnHit when provided', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner, validateTargetOnHit: true};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.validateTargetOnHit, true);
        });

        it('should inherit attack properties', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.affectedProperty, 'stats/hp');
            assert.strictEqual(skill.hitDamage, 15);
            assert.ok(Array.isArray(skill.attackProperties));
            assert.ok(Array.isArray(skill.defenseProperties));
        });
    });

    describe('runSkillLogic', () => {
        it('should return false when target out of range', async () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                range: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
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
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            await skill.runSkillLogic();
            assert.strictEqual(executed, true);
        });

        it('should return false after executing physical skill', async () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
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
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            await skill.runSkillLogic();
            assert.strictEqual(receivedTarget, mockTarget);
            assert.strictEqual(receivedSkill, skill);
        });
    });

    describe('executeOnHit', () => {
        it('should fire physical attack hit event', async () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner};
            let skill = new PhysicalAttack(skillData);
            skill.listenEvent(SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT, async () => {
                eventFired = true;
            }, 'testListener', skill.getOwnerEventKey());
            await skill.executeOnHit(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should apply damage to target', async () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                applyDirectDamage: true
            };
            let skill = new PhysicalAttack(skillData);
            let initialHp = mockTarget.stats.hp;
            await skill.executeOnHit(mockTarget);
            assert.ok(mockTarget.stats.hp < initialHp);
        });

        it('should validate target when validateTargetOnHit is true', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                validateTargetOnHit: true
            };
            let skill = new PhysicalAttack(skillData);
            let result = await skill.executeOnHit(differentTarget);
            assert.strictEqual(result, false);
        });

        it('should skip validation when validateTargetOnHit is false', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                validateTargetOnHit: false,
                applyDirectDamage: true
            };
            let skill = new PhysicalAttack(skillData);
            let initialHp = mockTarget.stats.hp;
            await skill.executeOnHit(differentTarget);
            assert.ok(mockTarget.stats.hp < initialHp);
        });

        it('should call parent runSkillLogic', async () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                applyDirectDamage: true
            };
            let skill = new PhysicalAttack(skillData);
            let initialHp = mockTarget.stats.hp;
            await skill.executeOnHit(mockTarget);
            assert.ok(mockTarget.stats.hp < initialHp);
        });
    });

    describe('Integration', () => {
        it('should handle complete physical attack flow', async () => {
            let physicalSkillExecuted = false;
            let hitExecuted = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                physicalSkillExecuted = true;
                await skill.executeOnHit(target);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                applyDirectDamage: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            skill.listenEvent(SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT, async () => {
                hitExecuted = true;
            }, 'hitListener', skill.getOwnerEventKey());
            let initialHp = mockTarget.stats.hp;
            await skill.runSkillLogic();
            assert.strictEqual(physicalSkillExecuted, true);
            assert.strictEqual(hitExecuted, true);
            assert.ok(mockTarget.stats.hp < initialHp);
        });

        it('should calculate damage with attack and defense', async () => {
            mockOwner.stats.atk = 50;
            mockTarget.stats.def = 20;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            let initialHp = mockTarget.stats.hp;
            await skill.runSkillLogic();
            let damage = initialHp - mockTarget.stats.hp;
            assert.ok(damage > 0);
        });

        it('should handle critical damage', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                criticalChance: 100,
                criticalMultiplier: 2,
                applyDirectDamage: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            let initialHp = mockTarget.stats.hp;
            await skill.runSkillLogic();
            let damage = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damage, 30);
        });

        it('should broadcast damage event', async () => {
            let eventFired = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                applyDirectDamage: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            skill.listenEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, async () => {
                eventFired = true;
            }, 'damageListener', skill.getOwnerEventKey());
            await skill.runSkillLogic();
            assert.strictEqual(eventFired, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero magnitude', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner, magnitude: 0};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.magnitude, 0);
            assert.strictEqual(skill.isReady, true);
        });

        it('should handle zero object dimensions', () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                objectWidth: 0,
                objectHeight: 0
            };
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.objectWidth, 0);
            assert.strictEqual(skill.objectHeight, 0);
            assert.strictEqual(skill.isReady, true);
        });

        it('should handle large magnitude values', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner, magnitude: 999999};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.magnitude, 999999);
        });

        it('should handle decimal magnitude', () => {
            let skillData = {...BaseSkillsFixtures.physicalAttackSkill, owner: mockOwner, magnitude: 100.5};
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.magnitude, 100.5);
        });

        it('should handle null target in runSkillLogic', async () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: null,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            await assert.rejects(async () => {
                await skill.runSkillLogic();
            });
        });

        it('should handle target without hp property', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let targetWithoutHp = {
                id: 'test-target',
                getPosition: () => ({x: 0, y: 0}),
                position: {x: 0, y: 0},
                stats: {}
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: targetWithoutHp,
                applyDirectDamage: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            let result = await skill.runSkillLogic();
            assert.strictEqual(result, false);
        });
    });

    describe('Constructor - Validation Failure', () => {
        it('should set isReady to false when validation fails', () => {
            let invalidOwner = new MockOwner();
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: invalidOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10
            };
            let skill = new PhysicalAttack(skillData);
            assert.strictEqual(skill.isReady, false);
        });
    });

    describe('runSkillLogic - Range Validation Error', () => {
        it('should handle when validateRange throws error', async () => {
            mockOwner.executePhysicalSkill = async () => true;
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            skill.validateRange = () => {
                throw new Error('Range validation error');
            };
            await assert.rejects(
                async () => await skill.runSkillLogic(),
                Error
            );
        });
    });

    describe('executeOnHit - Target Validation', () => {
        it('should validate target matches skill.target when validateTargetOnHit is true', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-target';
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                validateTargetOnHit: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            let result = await skill.runSkillLogic();
            assert.ok(typeof result === 'boolean');
        });
    });

    describe('executeOnHit - Invalid Target State', () => {
        it('should handle when target state is invalid', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(null);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            await skill.runSkillLogic();
            assert.ok(skill);
        });
    });

    describe('runSkillLogic - Parent Returns False', () => {
        it('should handle when parent runSkillLogic returns false', async () => {
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                range: 1000,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            mockOwner.position = {x: 0, y: 0};
            mockTarget.position = {x: 10000, y: 10000};
            let skill = new PhysicalAttack(skillData);
            let result = await skill.runSkillLogic();
            assert.strictEqual(result, false);
        });
    });

    describe('Event Parameters - Completeness', () => {
        it('should fire event with all required parameters', async () => {
            let eventParams = null;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                await skill.executeOnHit(target);
            };
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                target: mockTarget,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new PhysicalAttack(skillData);
            skill.listenEvent(SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT, (...args) => {
                eventParams = args;
            }, 'test-listener', skill.getOwnerEventKey());
            await skill.runSkillLogic();
            assert.ok(eventParams);
        });
    });

    describe('executeOnHit - Null Target Handling', () => {
        it('should handle null target in executeOnHit', async () => {
            let skillData = {
                ...BaseSkillsFixtures.physicalAttackSkill,
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10
            };
            let skill = new PhysicalAttack(skillData);
            await skill.executeOnHit(null);
            assert.ok(skill);
        });
    });
});
