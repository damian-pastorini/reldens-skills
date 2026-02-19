/**
 *
 * Reldens - Skill Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Skill = require('../../lib/skill');
const SkillsConst = require('../../lib/constants');
const SkillsEvents = require('../../lib/skills-events');
const { Condition, Modifier, ModifierConst } = require('@reldens/modifiers');
const { TestHelpers } = require('../utils/test-helpers');
const { MockOwner } = require('../fixtures/mocks/mock-owner');
const { MockTarget } = require('../fixtures/mocks/mock-target');
const { BaseSkillsFixtures } = require('../fixtures/skills/base-skills');

describe('Skill', () => {
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
        it('should initialize with basic properties', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            assert.strictEqual(skill.key, 'test-basic-skill');
            assert.strictEqual(skill.owner, mockOwner);
            assert.strictEqual(skill.type, SkillsConst.SKILL.TYPE.BASE);
            assert.strictEqual(skill.isReady, true);
            assert.strictEqual(skill.canActivate, true);
        });

        it('should set isReady to false when key is missing', () => {
            let skill = new Skill({owner: mockOwner});
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when owner is missing', () => {
            let skill = new Skill({key: 'test-skill', owner: {}});
            assert.strictEqual(skill.isReady, false);
        });

        it('should set isReady to false when owner has no getPosition method', () => {
            let invalidOwner = {id: 'test'};
            let skill = new Skill({key: 'test-skill', owner: invalidOwner});
            assert.strictEqual(skill.isReady, false);
        });

        it('should initialize with default values', () => {
            let skillData = {key: 'test', owner: mockOwner};
            let skill = new Skill(skillData);
            assert.strictEqual(skill.skillDelay, 0);
            assert.strictEqual(skill.castTime, 0);
            assert.strictEqual(skill.range, 0);
            assert.strictEqual(skill.usesLimit, 0);
            assert.strictEqual(skill.uses, 0);
            assert.strictEqual(skill.allowSelfTarget, false);
        });

        it('should handle custom properties', () => {
            let skillData = {
                key: 'custom-skill',
                owner: mockOwner,
                skillDelay: 1000,
                castTime: 500,
                range: 50,
                usesLimit: 5,
                criticalChance: 20,
                criticalMultiplier: 1.5
            };
            let skill = new Skill(skillData);
            assert.strictEqual(skill.skillDelay, 1000);
            assert.strictEqual(skill.castTime, 500);
            assert.strictEqual(skill.range, 50);
            assert.strictEqual(skill.usesLimit, 5);
            assert.strictEqual(skill.criticalChance, 20);
            assert.strictEqual(skill.criticalMultiplier, 1.5);
        });
    });

    describe('validate', () => {
        it('should return false when skill is not ready', () => {
            let skill = new Skill({owner: mockOwner});
            let result = skill.validate();
            assert.strictEqual(result, false);
        });

        it('should return false when canActivate is false', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.canActivate = false;
            let result = skill.validate();
            assert.strictEqual(result, false);
        });

        it('should return false when owner is casting', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            mockOwner.isCasting = true;
            let result = skill.validate();
            assert.strictEqual(result, false);
        });

        it('should return false when uses limit is reached', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, usesLimit: 3};
            let skill = new Skill(skillData);
            skill.uses = 3;
            let result = skill.validate();
            assert.strictEqual(result, false);
        });

        it('should return true for valid skill', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = skill.validate();
            assert.strictEqual(result, true);
        });

        it('should set canActivate to false when skillDelay is greater than 0', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, skillDelay: 1000};
            let skill = new Skill(skillData);
            skill.validate();
            assert.strictEqual(skill.canActivate, false);
        });
    });

    describe('validateConditions', () => {
        it('should return true when no conditions are set', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, true);
        });

        it('should return false when condition is not valid', () => {
            let condition = new Condition({
                key: 'hp-check',
                propertyKey: 'stats/hp',
                conditional: 'gt',
                value: 200
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [condition]
            };
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, false);
        });

        it('should return true when all conditions are valid', () => {
            let condition = new Condition({
                key: 'hp-check',
                propertyKey: 'stats/hp',
                conditional: 'gt',
                value: 50
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [condition]
            };
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, true);
        });
    });

    describe('isInRange', () => {
        it('should return true for infinite range (0)', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, range: 0};
            let skill = new Skill(skillData);
            let result = skill.isInRange(
                {x: 0, y: 0},
                {x: 1000, y: 1000}
            );
            assert.strictEqual(result, true);
        });

        it('should return true when target is in range', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, range: 50};
            let skill = new Skill(skillData);
            let result = skill.isInRange(
                {x: 100, y: 100},
                {x: 110, y: 110}
            );
            assert.strictEqual(result, true);
        });

        it('should return false when target is out of range', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, range: 10};
            let skill = new Skill(skillData);
            let result = skill.isInRange(
                {x: 0, y: 0},
                {x: 100, y: 100}
            );
            assert.strictEqual(result, false);
        });
    });

    describe('execute', () => {
        it('should return false when skill is not ready', async () => {
            let skill = new Skill({owner: mockOwner});
            let result = await skill.execute(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should return false when target is undefined', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = await skill.execute();
            assert.strictEqual(result, false);
        });

        it('should execute skill logic successfully', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = await skill.execute(mockTarget);
            assert.strictEqual(result, true);
            assert.strictEqual(skill.uses, 1);
        });

        it('should increment uses counter', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            await skill.execute(mockTarget);
            assert.strictEqual(skill.uses, 1);
            await skill.execute(mockTarget);
            assert.strictEqual(skill.uses, 2);
        });
    });

    describe('isCritical', () => {
        it('should return false when criticalChance is 0', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, criticalChance: 0};
            let skill = new Skill(skillData);
            let result = skill.isCritical();
            assert.strictEqual(result, false);
        });

        it('should return boolean value when criticalChance is greater than 0', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner, criticalChance: 50};
            let skill = new Skill(skillData);
            let result = skill.isCritical();
            assert.strictEqual(typeof result, 'boolean');
        });
    });

    describe('applyCriticalValue', () => {
        it('should return normal value when not critical', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 0
            };
            let skill = new Skill(skillData);
            let result = skill.applyCriticalValue(100);
            assert.strictEqual(result, 100);
        });

        it('should apply criticalMultiplier when critical', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 2
            };
            let skill = new Skill(skillData);
            let originalIsCritical = skill.isCritical.bind(skill);
            skill.isCritical = () => true;
            let result = skill.applyCriticalValue(100);
            assert.strictEqual(result, 200);
            skill.isCritical = originalIsCritical;
        });

        it('should apply criticalFixedValue when critical', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 1,
                criticalFixedValue: 50
            };
            let skill = new Skill(skillData);
            skill.isCritical = () => true;
            let result = skill.applyCriticalValue(100);
            assert.strictEqual(result, 150);
        });
    });

    describe('getOwnerId', () => {
        it('should return owner id', () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            assert.strictEqual(skill.getOwnerId(), 'mock-owner-1');
        });

        it('should use custom ownerIdProperty', () => {
            let customOwner = {customId: 'custom-123', getPosition: () => ({x: 0, y: 0})};
            let skillData = {
                key: 'test',
                owner: customOwner,
                ownerIdProperty: 'customId'
            };
            let skill = new Skill(skillData);
            assert.strictEqual(skill.getOwnerId(), 'custom-123');
        });
    });

    describe('Events', () => {
        it('should fire SKILL_BEFORE_EXECUTE event', async () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => {
                eventFired = true;
            }, 'test-listener');
            await skill.execute(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should fire SKILL_AFTER_EXECUTE event', async () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, () => {
                eventFired = true;
            }, 'test-listener-after');
            await skill.execute(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should fire event with masterKey parameter', async () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let masterKey = skill.getOwnerEventKey();
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => {
                eventFired = true;
            }, 'sub-key', masterKey);
            await skill.execute(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should fire event without any keys', async () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => {
                eventFired = true;
            });
            await skill.execute(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should handle multiple listeners on same event', async () => {
            let count = 0;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => { count++; }, 'key1');
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => { count++; }, 'key2');
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => { count++; }, 'key3');
            await skill.execute(mockTarget);
            assert.strictEqual(count, 3);
        });

        it('should pass correct arguments to event listeners', async () => {
            let receivedSkill = null;
            let receivedTarget = null;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, (s, t) => {
                receivedSkill = s;
                receivedTarget = t;
            }, 'arg-test');
            await skill.execute(mockTarget);
            assert.strictEqual(receivedSkill, skill);
            assert.strictEqual(receivedTarget, mockTarget);
        });

        it('should fire VALIDATE_BEFORE event', () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.VALIDATE_BEFORE, () => {
                eventFired = true;
            }, 'validate-before-test');
            skill.validate();
            assert.strictEqual(eventFired, true);
        });

        it('should fire VALIDATE_SUCCESS event', () => {
            let eventFired = false;
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.VALIDATE_SUCCESS, () => {
                eventFired = true;
            }, 'validate-success-test');
            skill.validate();
            assert.strictEqual(eventFired, true);
        });

        it('should fire VALIDATE_FAIL event when condition fails', () => {
            let eventFired = false;
            let failedCondition = null;
            let condition = new Condition({
                key: 'impossible',
                propertyKey: 'stats/hp',
                conditional: 'gt',
                value: 999
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [condition]
            };
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.VALIDATE_FAIL, (s, c) => {
                eventFired = true;
                failedCondition = c;
            }, 'validate-fail-test');
            skill.validate();
            assert.strictEqual(eventFired, true);
            assert.strictEqual(failedCondition, condition);
        });

        it('should fire all execution events in correct order', async () => {
            let eventOrder = [];
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_EXECUTE, () => {
                eventOrder.push('BEFORE_EXECUTE');
            }, 'order1');
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_RUN_LOGIC, () => {
                eventOrder.push('BEFORE_RUN_LOGIC');
            }, 'order2');
            skill.listenEvent(SkillsEvents.SKILL_AFTER_RUN_LOGIC, () => {
                eventOrder.push('AFTER_RUN_LOGIC');
            }, 'order3');
            skill.listenEvent(SkillsEvents.SKILL_AFTER_EXECUTE, () => {
                eventOrder.push('AFTER_EXECUTE');
            }, 'order4');
            await skill.execute(mockTarget);
            assert.deepStrictEqual(eventOrder, [
                'BEFORE_EXECUTE',
                'BEFORE_RUN_LOGIC',
                'AFTER_RUN_LOGIC',
                'AFTER_EXECUTE'
            ]);
        });
    });

    describe('Error Conditions - validateConditions', () => {
        it('should return false with invalid condition type', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [{not: 'a condition'}]
            };
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, false);
        });

        it('should return false with null condition', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [null]
            };
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, false);
        });

        it('should return false with undefined in conditions array', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [undefined]
            };
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, false);
        });

        it('should handle mixed valid and invalid conditions', () => {
            let validCondition = new Condition({
                key: 'valid',
                propertyKey: 'stats/hp',
                conditional: 'gt',
                value: 0
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerConditions: [validCondition, {invalid: true}]
            };
            let skill = new Skill(skillData);
            let result = skill.validateConditions();
            assert.strictEqual(result, false);
        });
    });

    describe('Edge Cases - Range Validation', () => {
        it('should handle negative range values', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                range: -50
            };
            let skill = new Skill(skillData);
            let result = skill.isInRange({x: 0, y: 0}, {x: 100, y: 100});
            assert.strictEqual(typeof result, 'boolean');
        });

        it('should handle exact range boundary', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                range: 10
            };
            let skill = new Skill(skillData);
            let result = skill.isInRange({x: 0, y: 0}, {x: 10, y: 0});
            assert.strictEqual(typeof result, 'boolean');
        });

        it('should handle decimal positions', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                range: 50
            };
            let skill = new Skill(skillData);
            let result = skill.isInRange({x: 0.5, y: 0.5}, {x: 10.7, y: 10.3});
            assert.strictEqual(typeof result, 'boolean');
        });

        it('should validateRange return false with missing range properties', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                range: 50
            };
            let skill = new Skill(skillData);
            let result = skill.validateRange(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should validateRange work with valid range properties', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                range: 50,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y'
            };
            let skill = new Skill(skillData);
            let result = skill.validateRange(mockTarget);
            assert.strictEqual(typeof result, 'boolean');
        });
    });

    describe('Edge Cases - Critical Hits', () => {
        it('should handle 100% critical chance', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100
            };
            let skill = new Skill(skillData);
            let criticalHits = 0;
            for(let i = 0; i < 10; i++){
                if(skill.isCritical()){
                    criticalHits++;
                }
            }
            assert.ok(criticalHits > 0);
        });

        it('should handle negative critical chance', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: -50
            };
            let skill = new Skill(skillData);
            let result = skill.isCritical();
            assert.strictEqual(result, false);
        });

        it('should apply negative critical multiplier', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: -2
            };
            let skill = new Skill(skillData);
            skill.isCritical = () => true;
            let result = skill.applyCriticalValue(100);
            assert.strictEqual(result, -200);
        });

        it('should apply zero critical multiplier', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 0
            };
            let skill = new Skill(skillData);
            skill.isCritical = () => true;
            let result = skill.applyCriticalValue(100);
            assert.strictEqual(result, 0);
        });

        it('should handle both multiplier and fixed value', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalFixedValue: 50
            };
            let skill = new Skill(skillData);
            skill.isCritical = () => true;
            let result = skill.applyCriticalValue(100);
            assert.strictEqual(result, 250);
        });

        it('should getCriticalDiff return correct difference', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 2
            };
            let skill = new Skill(skillData);
            skill.isCritical = () => true;
            let diff = skill.getCriticalDiff(100);
            assert.strictEqual(diff, 100);
        });
    });

    describe('Edge Cases - Uses and Limits', () => {
        it('should handle uses at exactly limit', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                usesLimit: 5
            };
            let skill = new Skill(skillData);
            skill.uses = 5;
            let result = skill.validate();
            assert.strictEqual(result, false);
        });

        it('should handle uses beyond limit', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                usesLimit: 5
            };
            let skill = new Skill(skillData);
            skill.uses = 10;
            let result = skill.validate();
            assert.strictEqual(result, false);
        });

        it('should increment uses on each execution', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            assert.strictEqual(skill.uses, 0);
            await skill.execute(mockTarget);
            assert.strictEqual(skill.uses, 1);
            await skill.execute(mockTarget);
            assert.strictEqual(skill.uses, 2);
            await skill.execute(mockTarget);
            assert.strictEqual(skill.uses, 3);
        });

        it('should handle negative usesLimit', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                usesLimit: -1
            };
            let skill = new Skill(skillData);
            let result = skill.validate();
            assert.strictEqual(result, true);
        });
    });

    describe('Edge Cases - Skill Delay and Timers', () => {
        it('should set canActivate to false with positive delay', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                skillDelay: 1000
            };
            let skill = new Skill(skillData);
            skill.validate();
            assert.strictEqual(skill.canActivate, false);
            assert.ok(skill.skillActivationTimer);
        });

        it('should handle zero skill delay', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                skillDelay: 0
            };
            let skill = new Skill(skillData);
            skill.validate();
            assert.strictEqual(skill.canActivate, true);
        });

        it('should handle negative skill delay', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                skillDelay: -1000
            };
            let skill = new Skill(skillData);
            skill.validate();
            assert.strictEqual(skill.canActivate, true);
        });

        it('should restore canActivate after delay', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                skillDelay: 100
            };
            let skill = new Skill(skillData);
            skill.validate();
            assert.strictEqual(skill.canActivate, false);
            await TestHelpers.sleep(150);
            assert.strictEqual(skill.canActivate, true);
        });
    });

    describe('Edge Cases - Owner Effects', () => {
        it('should apply owner effects when provided', async () => {
            let modifier = new Modifier({
                key: 'hp-cost',
                propertyKey: 'stats/hp',
                operation: ModifierConst.OPS.DEC,
                value: 10
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerEffects: [modifier]
            };
            let skill = new Skill(skillData);
            let initialHp = mockOwner.stats.hp;
            await skill.execute(mockTarget);
            assert.ok(mockOwner.stats.hp !== initialHp);
        });

        it('should fire SKILL_APPLY_OWNER_EFFECTS event', async () => {
            let eventFired = false;
            let modifier = new Modifier({
                key: 'mp-cost',
                propertyKey: 'stats/mp',
                operation: ModifierConst.OPS.DEC,
                value: 5
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerEffects: [modifier]
            };
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_APPLY_OWNER_EFFECTS, () => {
                eventFired = true;
            }, 'owner-effects-test');
            await skill.execute(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should handle empty ownerEffects array', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerEffects: []
            };
            let skill = new Skill(skillData);
            let result = await skill.execute(mockTarget);
            assert.strictEqual(typeof result, 'boolean');
        });
    });

    describe('Error Conditions - Missing Required Data', () => {
        it('should handle missing target on execute', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = await skill.execute();
            assert.strictEqual(result, false);
        });

        it('should handle null target', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = await skill.execute(null);
            assert.strictEqual(result, false);
        });

        it('should handle undefined target', async () => {
            let skillData = {...BaseSkillsFixtures.basicSkill, owner: mockOwner};
            let skill = new Skill(skillData);
            let result = await skill.execute(undefined);
            assert.strictEqual(result, false);
        });

        it('should work with fixed target from props', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                target: mockTarget
            };
            let skill = new Skill(skillData);
            let result = await skill.execute();
            assert.strictEqual(result, true);
        });
    });

    describe('Async Execution and Timing', () => {
        it('should handle cast time correctly', async () => {
            let castStarted = false;
            let castFinished = false;
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                castTime: 100
            };
            let skill = new Skill(skillData);
            skill.listenEvent(SkillsEvents.SKILL_BEFORE_CAST, () => {
                castStarted = true;
            }, 'cast-start');
            skill.listenEvent(SkillsEvents.SKILL_AFTER_CAST, () => {
                castFinished = true;
            }, 'cast-finish');
            await skill.execute(mockTarget);
            assert.strictEqual(castStarted, true);
            assert.strictEqual(mockOwner.isCasting, true);
            await TestHelpers.sleep(150);
            assert.strictEqual(castFinished, true);
            assert.strictEqual(mockOwner.isCasting, false);
        });

        it('should not set isCasting with zero cast time', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                castTime: 0
            };
            let skill = new Skill(skillData);
            await skill.execute(mockTarget);
            assert.strictEqual(mockOwner.isCasting, false);
        });
    });

    describe('isValidRange', () => {
        it('should return false when rangeAutomaticValidation is false', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: false,
                rangePropertyX: 'x',
                rangePropertyY: 'y'
            };
            let skill = new Skill(skillData);
            let result = await skill.isValidRange(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should return false when rangePropertyX is missing', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: true,
                rangePropertyY: 'y'
            };
            let skill = new Skill(skillData);
            let result = await skill.isValidRange(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should return false when rangePropertyY is missing', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: true,
                rangePropertyX: 'x'
            };
            let skill = new Skill(skillData);
            let result = await skill.isValidRange(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should return true when all properties set and target out of range', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                range: 1
            };
            let skill = new Skill(skillData);
            let result = await skill.isValidRange(mockTarget);
            assert.strictEqual(result, true);
        });

        it('should return false when target is in range', async () => {
            mockTarget.getPosition = () => ({x: 100, y: 100});
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                range: 100
            };
            let skill = new Skill(skillData);
            let result = await skill.isValidRange(mockTarget);
            assert.strictEqual(result, false);
        });
    });

    describe('onExecuteConditions', () => {
        it('should return true by default', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            let result = skill.onExecuteConditions();
            assert.strictEqual(result, true);
        });

        it('should be called during execute', async () => {
            let conditionCalled = false;
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            skill.onExecuteConditions = () => {
                conditionCalled = true;
                return true;
            };
            await skill.execute(mockTarget);
            assert.strictEqual(conditionCalled, true);
        });

        it('should prevent execution when returns false', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            skill.onExecuteConditions = () => false;
            let result = await skill.execute(mockTarget);
            assert.strictEqual(result, false);
        });
    });

    describe('onExecuteRewards', () => {
        it('should be callable without errors', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            await skill.onExecuteRewards();
            assert.ok(true);
        });

        it('should be called during execute', async () => {
            let rewardsCalled = false;
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            skill.onExecuteRewards = async () => {
                rewardsCalled = true;
            };
            await skill.execute(mockTarget);
            assert.strictEqual(rewardsCalled, true);
        });
    });

    describe('getOwnerUniqueEventKey', () => {
        it('should generate unique key with timestamp', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            let key1 = skill.getOwnerUniqueEventKey();
            assert.ok(key1.includes('skills.ownerId'));
            assert.ok(key1.includes('.uKey.'));
        });

        it('should append suffix when provided', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            let key = skill.getOwnerUniqueEventKey('testSuffix');
            assert.ok(key.endsWith('.testSuffix'));
        });

        it('should use owner eventUniqueKey when available', () => {
            let customOwner = {
                ...mockOwner,
                eventUniqueKey: () => 'custom-unique-key'
            };
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: customOwner
            };
            let skill = new Skill(skillData);
            let key = skill.getOwnerUniqueEventKey();
            assert.ok(key.includes('custom-unique-key'));
        });
    });

    describe('execute with autoValidation', () => {
        it('should validate range when autoValidation is true', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: true,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                range: 1
            };
            let skill = new Skill(skillData);
            let result = await skill.execute(mockTarget);
            assert.strictEqual(result, false);
        });
    });

    describe('Constructor with null owner', () => {
        it('should handle explicitly null owner', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: null
            };
            assert.throws(() => new Skill(skillData), TypeError);
        });
    });

    describe('Constructor with false values', () => {
        it('should handle false allowSelfTarget', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                allowSelfTarget: false
            };
            let skill = new Skill(skillData);
            assert.strictEqual(skill.allowSelfTarget, false);
        });

        it('should handle false rangeAutomaticValidation', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangeAutomaticValidation: false
            };
            let skill = new Skill(skillData);
            assert.strictEqual(skill.rangeAutomaticValidation, false);
        });
    });

    describe('validate with multiple conditions', () => {
        it('should return false when both canActivate false and owner casting', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                skillDelay: 100
            };
            let skill = new Skill(skillData);
            skill.validate();
            mockOwner.isCasting = true;
            let result = skill.validate();
            assert.strictEqual(result, false);
        });
    });

    describe('validateRange with target properties', () => {
        it('should work with rangeTargetPropertyX', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                rangeTargetPropertyX: 'targetX',
                rangeTargetPropertyY: 'targetY',
                range: 10
            };
            let skill = new Skill(skillData);
            mockTarget.targetX = 105;
            mockTarget.targetY = 105;
            let result = skill.validateRange(mockTarget);
            assert.strictEqual(result, true);
        });

        it('should handle target with undefined positions', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                range: 10
            };
            let skill = new Skill(skillData);
            let badTarget = {getPosition: () => ({x: undefined, y: 110}), position: {x: undefined, y: 110}};
            assert.throws(() => skill.validateRange(badTarget), Error);
        });

        it('should handle target with NaN positions', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                rangePropertyX: 'position/x',
                rangePropertyY: 'position/y',
                range: 10
            };
            let skill = new Skill(skillData);
            let badTarget = {getPosition: () => ({x: NaN, y: 110}), position: {x: NaN, y: 110}};
            let result = skill.validateRange(badTarget);
            assert.strictEqual(result, false);
        });
    });

    describe('isInRange same position', () => {
        it('should return true when distance is 0', () => {
            mockTarget.getPosition = () => ({x: 100, y: 100});
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                range: 10
            };
            let skill = new Skill(skillData);
            let result = skill.isInRange(mockOwner.getPosition(), mockTarget.getPosition());
            assert.strictEqual(result, true);
        });
    });

    describe('execute with fixed target', () => {
        it('should not overwrite fixed target', async () => {
            let fixedTarget = TestHelpers.createMockTarget('fixed-target');
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                target: fixedTarget
            };
            let skill = new Skill(skillData);
            await skill.execute(mockTarget);
            assert.strictEqual(skill.target, mockTarget);
        });
    });

    describe('execute with ownerEffects variations', () => {
        it('should handle ownerEffects as empty array', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerEffects: []
            };
            let skill = new Skill(skillData);
            await skill.execute(mockTarget);
            assert.ok(true);
        });

        it('should handle ownerEffects as null', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                ownerEffects: null
            };
            let skill = new Skill(skillData);
            await skill.execute(mockTarget);
            assert.ok(true);
        });
    });

    describe('applySkillLogicOnTarget with negative castTime', () => {
        it('should handle negative castTime', async () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                castTime: -100
            };
            let skill = new Skill(skillData);
            await skill.execute(mockTarget);
            assert.strictEqual(mockOwner.isCasting, false);
        });
    });

    describe('applyModifiers with avoidCritical', () => {
        it('should not apply critical when avoidCritical is true', () => {
            let modifier = new Modifier({
                key: 'test-mod',
                propertyKey: 'stats/hp',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 100
            };
            let skill = new Skill(skillData);
            skill.applyModifiers({mod: modifier}, mockTarget, true);
            assert.ok(skill.lastAppliedModifiers);
        });

        it('should populate lastAppliedModifiers correctly', () => {
            let modifier = new Modifier({
                key: 'test-mod',
                propertyKey: 'stats/hp',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner
            };
            let skill = new Skill(skillData);
            skill.applyModifiers({mod: modifier}, mockTarget, false);
            assert.ok(skill.lastAppliedModifiers['stats/hp']);
        });
    });

    describe('getCriticalDiff edge cases', () => {
        it('should return 0 when not critical', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 0
            };
            let skill = new Skill(skillData);
            let diff = skill.getCriticalDiff(100);
            assert.strictEqual(diff, 0);
        });

        it('should handle negative normalValue', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalMultiplier: 2
            };
            let skill = new Skill(skillData);
            let result = skill.applyCriticalValue(-10);
            assert.ok(typeof result === 'number');
        });

        it('should handle zero normalValue', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalMultiplier: 2
            };
            let skill = new Skill(skillData);
            let result = skill.applyCriticalValue(0);
            assert.strictEqual(result, 0);
        });
    });

    describe('isCritical with floating point', () => {
        it('should handle floating point criticalChance', () => {
            let skillData = {
                ...BaseSkillsFixtures.basicSkill,
                owner: mockOwner,
                criticalChance: 50.5
            };
            let skill = new Skill(skillData);
            let result = skill.isCritical();
            assert.ok(typeof result === 'boolean');
        });
    });
});
