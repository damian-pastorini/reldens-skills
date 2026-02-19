/**
 *
 * Reldens - Attack Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Attack = require('../../../lib/types/attack');
const SkillsConst = require('../../../lib/constants');
const SkillsEvents = require('../../../lib/skills-events');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');
const { MockTarget } = require('../../fixtures/mocks/mock-target');
const { BaseSkillsFixtures } = require('../../fixtures/skills/base-skills');
const { ModifierConst } = require('@reldens/modifiers');

describe('Attack', () => {
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
        it('should initialize with attack type', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            assert.strictEqual(attack.type, SkillsConst.SKILL.TYPE.ATTACK);
        });

        it('should set isReady to false when affectedProperty is missing', () => {
            let attackData = {key: 'test-attack', owner: mockOwner};
            let attack = new Attack(attackData);
            assert.strictEqual(attack.isReady, false);
        });

        it('should initialize with damage properties', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            assert.strictEqual(attack.hitDamage, 10);
            assert.strictEqual(attack.affectedProperty, 'stats/hp');
            assert.ok(Array.isArray(attack.attackProperties));
            assert.ok(Array.isArray(attack.defenseProperties));
        });

        it('should initialize with aim and dodge properties', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            assert.ok(Array.isArray(attack.aimProperties));
            assert.ok(Array.isArray(attack.dodgeProperties));
            assert.strictEqual(attack.dodgeFullEnabled, true);
        });

        it('should initialize with default values', () => {
            let attackData = {
                key: 'test',
                owner: mockOwner,
                affectedProperty: 'stats/hp'
            };
            let attack = new Attack(attackData);
            assert.strictEqual(attack.hitDamage, 0);
            assert.strictEqual(attack.applyDirectDamage, false);
            assert.strictEqual(attack.allowEffectBelowZero, false);
        });
    });

    describe('applyDamageTo', () => {
        it('should return false when target is undefined', async () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(null);
            assert.strictEqual(result, false);
        });

        it('should apply direct damage when applyDirectDamage is true', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                applyDirectDamage: true,
                hitDamage: 20,
                range: 0,
                criticalChance: 0,
                criticalMultiplier: 1
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(mockTarget.stats.hp, initialHp - 20);
        });

        it('should return false when target dodge is higher than owner aim', async () => {
            let highDodgeTarget = new MockTarget();
            highDodgeTarget.stats.dodge = 100;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true,
                dodgeOverAimSuccess: 1
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(highDodgeTarget);
            assert.strictEqual(result, false);
            assert.strictEqual(attack.lastState, SkillsConst.SKILL_STATES.DODGED);
        });

        it('should calculate damage with attack and defense properties', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: 10,
                range: 0,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def'],
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            assert.ok(mockTarget.stats.hp < initialHp);
            assert.strictEqual(attack.lastState, SkillsConst.SKILL_STATES.APPLIED_DAMAGE);
        });

        it('should not reduce hp below 0 when allowEffectBelowZero is false', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: 1000,
                range: 0,
                applyDirectDamage: true,
                allowEffectBelowZero: false
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(mockTarget.stats.hp, 0);
        });

        it('should fire SKILL_ATTACK_APPLY_DAMAGE event', async () => {
            let eventFired = false;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0
            };
            let attack = new Attack(attackData);
            attack.listenEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, () => {
                eventFired = true;
            }, 'test-listener');
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(eventFired, true);
        });
    });

    describe('getPropertiesTotal', () => {
        it('should return 0 for empty properties array', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, []);
            assert.strictEqual(total, 0);
        });

        it('should sum property values correctly', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/atk']);
            assert.strictEqual(total, 10);
        });

        it('should sum multiple properties', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/atk', 'stats/def']);
            assert.strictEqual(total, 15);
        });

        it('should return false for invalid object', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(null, ['stats/atk']);
            assert.strictEqual(total, false);
        });
    });

    describe('getAffectedPropertyValue', () => {
        it('should get target property value', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let value = attack.getAffectedPropertyValue(mockTarget);
            assert.strictEqual(value, mockTarget.stats.hp);
        });
    });

    describe('setAffectedPropertyValue', () => {
        it('should set target property value', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            attack.setAffectedPropertyValue(mockTarget, 50);
            assert.strictEqual(mockTarget.stats.hp, 50);
        });
    });

    describe('calculateCriticalDamage', () => {
        it('should return critical value when not affected by dodge/aim', () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                criticalAffected: false
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            attack.criticalMultiplier = 2;
            let critDmg = attack.calculateCriticalDamage(100, 10, 15, 0);
            assert.strictEqual(critDmg, 100);
        });

        it('should return full critical when dodge is higher than aim', () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                criticalAffected: false
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            attack.criticalMultiplier = 2;
            let critDmg = attack.calculateCriticalDamage(100, 20, 10, 100);
            assert.strictEqual(critDmg, 100);
        });
    });

    describe('calculateProportionDamage', () => {
        it('should increase damage when attack is higher than defense', () => {
            mockOwner.stats.atk = 20;
            mockTarget.stats.def = 5;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let damage = attack.calculateProportionDamage(mockTarget, 10, 0, 1, 0);
            assert.ok(damage > 10);
        });

        it('should decrease damage when defense is higher than attack', () => {
            mockOwner.stats.atk = 5;
            mockTarget.stats.def = 20;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let damage = attack.calculateProportionDamage(mockTarget, 10, 0, 1, 0);
            assert.ok(damage < 10);
        });

        it('should handle zero attack stats', () => {
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let damage = attack.calculateProportionDamage(mockTarget, 10, 0, 1, 0);
            assert.ok(typeof damage === 'number');
        });

        it('should handle zero defense stats', () => {
            mockOwner.stats.atk = 10;
            mockTarget.stats.def = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let damage = attack.calculateProportionDamage(mockTarget, 10, 0, 1, 0);
            assert.ok(typeof damage === 'number');
        });

        it('should handle negative attack stats', () => {
            mockOwner.stats.atk = -10;
            mockTarget.stats.def = 5;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let damage = attack.calculateProportionDamage(mockTarget, 10, 0, 1, 0);
            assert.ok(typeof damage === 'number');
        });
    });

    describe('Error Conditions - Missing Parameters', () => {
        it('should handle null target in applyDamageTo', async () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(null);
            assert.strictEqual(result, false);
        });

        it('should handle undefined target in applyDamageTo', async () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(undefined);
            assert.strictEqual(result, false);
        });

        it('should handle target without affectedProperty', async () => {
            let invalidTarget = {getPosition: () => ({x: 0, y: 0})};
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner, range: 0};
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(invalidTarget);
            assert.strictEqual(typeof result, 'boolean');
        });
    });

    describe('Edge Cases - Damage Calculations', () => {
        it('should handle zero hitDamage', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: 0,
                range: 0,
                applyDirectDamage: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(mockTarget.stats.hp, initialHp);
        });

        it('should handle negative hitDamage', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: -20,
                range: 0,
                applyDirectDamage: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            assert.ok(mockTarget.stats.hp !== initialHp);
        });

        it('should handle decimal hitDamage', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: 10.5,
                range: 0,
                applyDirectDamage: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof mockTarget.stats.hp === 'number');
        });

        it('should handle very large damage values', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: 10000,
                range: 0,
                applyDirectDamage: true,
                criticalChance: 0,
                allowEffectBelowZero: false
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(mockTarget.stats.hp, 0);
        });

        it('should allow negative hp when allowEffectBelowZero is true', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                hitDamage: 1000,
                range: 0,
                applyDirectDamage: true,
                criticalChance: 0,
                allowEffectBelowZero: true
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(mockTarget.stats.hp < 0);
        });
    });

    describe('Edge Cases - Aim and Dodge', () => {
        it('should handle zero aim', async () => {
            mockOwner.stats.aim = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle zero dodge', async () => {
            mockTarget.stats.dodge = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle negative aim', async () => {
            mockOwner.stats.aim = -10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle negative dodge', async () => {
            mockTarget.stats.dodge = -10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle empty aim properties', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                aimProperties: [],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle empty dodge properties', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                aimProperties: ['stats/aim'],
                dodgeProperties: []
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });
    });

    describe('Edge Cases - Properties Total', () => {
        it('should handle empty properties array', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, []);
            assert.strictEqual(total, 0);
        });

        it('should handle null object', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(null, ['stats/atk']);
            assert.strictEqual(total, false);
        });

        it('should handle undefined object', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(undefined, ['stats/atk']);
            assert.strictEqual(total, false);
        });

        it('should handle non-existent properties', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/nonExistent']);
            assert.strictEqual(total, false);
        });

        it('should handle null in properties array', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, [null]);
            assert.strictEqual(total, false);
        });
    });

    describe('Edge Cases - dodgeOverAimSuccess', () => {
        it('should handle zero dodgeOverAimSuccess', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true,
                dodgeOverAimSuccess: 0
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle negative dodgeOverAimSuccess', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true,
                dodgeOverAimSuccess: -1
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });

        it('should handle very large dodgeOverAimSuccess', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true,
                dodgeOverAimSuccess: 1000
            };
            let attack = new Attack(attackData);
            await attack.applyDamageTo(mockTarget);
            assert.ok(typeof attack.lastState === 'string');
        });
    });

    describe('Event System', () => {
        it('should fire SKILL_ATTACK_APPLY_DAMAGE with all parameters', async () => {
            let eventFired = false;
            let receivedArgs = [];
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0
            };
            let attack = new Attack(attackData);
            attack.listenEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, (...args) => {
                eventFired = true;
                receivedArgs = args;
            }, 'damage-listener');
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(eventFired, true);
            assert.ok(receivedArgs.length > 0);
        });

        it('should fire event with masterKey parameter', async () => {
            let eventFired = false;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0
            };
            let attack = new Attack(attackData);
            let masterKey = attack.getOwnerEventKey();
            attack.listenEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, () => {
                eventFired = true;
            }, 'sub-key', masterKey);
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(eventFired, true);
        });

        it('should fire event without any keys', async () => {
            let eventFired = false;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0
            };
            let attack = new Attack(attackData);
            attack.listenEvent(SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE, () => {
                eventFired = true;
            });
            await attack.applyDamageTo(mockTarget);
            assert.strictEqual(eventFired, true);
        });
    });

    describe('getDiffProportion - Division by Zero Fix', () => {
        it('should return 0 when both aim and dodge are 0', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = attack.getDiffProportion(0, 0);
            assert.strictEqual(result, 0);
        });

        it('should return 100 when aim is 0 but dodge is greater than 0', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = attack.getDiffProportion(0, 10);
            assert.strictEqual(result, 100);
        });

        it('should calculate normally when aim is not 0', () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = attack.getDiffProportion(10, 5);
            assert.strictEqual(result, -50);
        });
    });

    describe('applyDamageTo - Return Value Consistency', () => {
        it('should return true on successful damage application', async () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                applyDirectDamage: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(mockTarget);
            assert.strictEqual(result, true);
        });

        it('should return false when target is null', async () => {
            let attackData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(null);
            assert.strictEqual(result, false);
        });

        it('should return false when attack is dodged', async () => {
            let highDodgeTarget = new MockTarget();
            highDodgeTarget.stats.dodge = 100;
            mockOwner.stats.aim = 10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                dodgeFullEnabled: true
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(highDodgeTarget);
            assert.strictEqual(result, false);
        });

        it('should return false when allowEffectBelowZero is false and hp is 0', async () => {
            mockTarget.stats.hp = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                allowEffectBelowZero: false
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(mockTarget);
            assert.strictEqual(result, false);
        });
    });

    describe('propertiesTotalOperators - Custom Operators', () => {
        it('should apply INC operator to property total', () => {
            mockOwner.stats.bonus = 5;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                propertiesTotalOperators: {
                    'stats/bonus': ModifierConst.OPS.INC
                }
            };
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/atk', 'stats/bonus']);
            assert.strictEqual(total, 15);
        });

        it('should apply DEC operator to property total', () => {
            mockOwner.stats.penalty = 3;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                propertiesTotalOperators: {
                    'stats/penalty': ModifierConst.OPS.DEC
                }
            };
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/atk', 'stats/penalty']);
            assert.strictEqual(total, 7);
        });

        it('should apply MULT operator to property total', () => {
            mockOwner.stats.multiplier = 2;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                propertiesTotalOperators: {
                    'stats/multiplier': ModifierConst.OPS.MUL
                }
            };
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/atk', 'stats/multiplier']);
            assert.strictEqual(total, 20);
        });

        it('should handle multiple custom operators in same calculation', () => {
            mockOwner.stats.bonus = 5;
            mockOwner.stats.multiplier = 2;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                propertiesTotalOperators: {
                    'stats/bonus': ModifierConst.OPS.INC,
                    'stats/multiplier': ModifierConst.OPS.MUL
                }
            };
            let attack = new Attack(attackData);
            let total = attack.getPropertiesTotal(mockOwner, ['stats/atk', 'stats/bonus', 'stats/multiplier']);
            assert.strictEqual(total, 30);
        });
    });

    describe('damageAffected - Damage Reduction Logic', () => {
        it('should reduce damage when damageAffected is true and dodge > aim', async () => {
            mockOwner.stats.aim = 10;
            mockTarget.stats.dodge = 20;
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                damageAffected: true,
                dodgeFullEnabled: false,
                criticalChance: 0,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge'],
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.ok(damageApplied < 100);
        });

        it('should not reduce damage when damageAffected is false even if dodge > aim', async () => {
            mockOwner.stats.aim = 10;
            mockTarget.stats.dodge = 20;
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 0;
            mockTarget.stats.hp = 150;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                damageAffected: false,
                dodgeFullEnabled: false,
                criticalChance: 0,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge'],
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 100);
        });

        it('should not reduce damage when damageAffected is true but dodge < aim', async () => {
            mockOwner.stats.aim = 20;
            mockTarget.stats.dodge = 10;
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 0;
            mockTarget.stats.hp = 150;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                damageAffected: true,
                dodgeFullEnabled: false,
                criticalChance: 0,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge'],
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 100);
        });
    });

    describe('criticalAffected - Dodge/Aim Formula', () => {
        it('should reduce critical damage when criticalAffected is true and dodge > aim', async () => {
            mockOwner.stats.aim = 10;
            mockTarget.stats.dodge = 20;
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 0;
            mockTarget.stats.hp = 250;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: true,
                dodgeFullEnabled: false,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge'],
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 100);
        });

        it('should not reduce critical when criticalAffected is false', async () => {
            mockOwner.stats.aim = 10;
            mockTarget.stats.dodge = 20;
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 0;
            mockTarget.stats.hp = 250;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: false,
                dodgeFullEnabled: false,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge'],
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 200);
        });

        it('should apply full critical when dodge < aim even if criticalAffected is true', async () => {
            mockOwner.stats.aim = 20;
            mockTarget.stats.dodge = 10;
            mockOwner.stats.atk = 0;
            mockTarget.stats.def = 0;
            mockTarget.stats.hp = 250;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: true,
                dodgeFullEnabled: false,
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge'],
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 200);
        });
    });

    describe('allowEffectBelowZero - Property at 0 or Negative', () => {
        it('should return false when hp is 0 and allowEffectBelowZero is false', async () => {
            mockTarget.stats.hp = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                allowEffectBelowZero: false
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should return false when hp is negative and allowEffectBelowZero is false', async () => {
            mockTarget.stats.hp = -10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                allowEffectBelowZero: false
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(mockTarget);
            assert.strictEqual(result, false);
        });

        it('should apply damage when hp is 0 and allowEffectBelowZero is true', async () => {
            mockTarget.stats.hp = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 50,
                applyDirectDamage: true,
                allowEffectBelowZero: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(mockTarget);
            assert.strictEqual(result, true);
            assert.strictEqual(mockTarget.stats.hp, -50);
        });

        it('should apply damage when hp is negative and allowEffectBelowZero is true', async () => {
            mockTarget.stats.hp = -20;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 30,
                applyDirectDamage: true,
                allowEffectBelowZero: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            let result = await attack.applyDamageTo(mockTarget);
            assert.strictEqual(result, true);
            assert.strictEqual(mockTarget.stats.hp, -50);
        });
    });

    describe('Attack/Defense - 99% Max Modifier Cap', () => {
        it('should cap damage increase at 99% when attack much higher than defense', async () => {
            mockOwner.stats.atk = 1000;
            mockTarget.stats.def = 10;
            mockOwner.stats.aim = 10;
            mockTarget.stats.dodge = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                criticalChance: 0,
                dodgeFullEnabled: false,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def'],
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.ok(damageApplied <= 199);
        });

        it('should cap damage reduction at 99% when defense much higher than attack', async () => {
            mockOwner.stats.atk = 10;
            mockTarget.stats.def = 1000;
            mockOwner.stats.aim = 10;
            mockTarget.stats.dodge = 0;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                criticalChance: 0,
                dodgeFullEnabled: false,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def'],
                aimProperties: ['stats/aim'],
                dodgeProperties: ['stats/dodge']
            };
            let attack = new Attack(attackData);
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.ok(damageApplied >= 1);
        });
    });

    describe('Direct Damage with Critical', () => {
        it('should apply critical to direct damage', async () => {
            mockTarget.stats.hp = 250;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                applyDirectDamage: true,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: false
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 200);
        });

        it('should apply direct damage without critical when not critical hit', async () => {
            mockTarget.stats.hp = 150;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                range: 0,
                hitDamage: 100,
                applyDirectDamage: true,
                criticalChance: 0
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => false;
            let initialHp = mockTarget.stats.hp;
            await attack.applyDamageTo(mockTarget);
            let damageApplied = initialHp - mockTarget.stats.hp;
            assert.strictEqual(damageApplied, 100);
        });
    });

    describe('calculateCriticalDamage - Formula Verification', () => {
        it('should calculate critical reduction correctly when criticalAffected', () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: true
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let damage = 100;
            let targetDodge = 20;
            let ownerAim = 10;
            let dodgeAimDiff = ((targetDodge - ownerAim) * 100) / ownerAim;
            let baseCritical = damage * (attack.criticalMultiplier - 1);
            let criticalReduction = Math.floor((baseCritical * dodgeAimDiff / 100));
            let expectedCritical = baseCritical - criticalReduction;
            let actualCritical = attack.calculateCriticalDamage(damage, targetDodge, ownerAim, dodgeAimDiff);
            assert.strictEqual(actualCritical, expectedCritical);
        });

        it('should return full critical value when dodge > aim but criticalAffected is false', () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: false
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let damage = 100;
            let baseCritical = damage * (attack.criticalMultiplier - 1);
            let actualCritical = attack.calculateCriticalDamage(damage, 20, 10, 100);
            assert.strictEqual(actualCritical, baseCritical);
        });

        it('should return full critical when dodge < aim regardless of criticalAffected', () => {
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                criticalChance: 100,
                criticalMultiplier: 2,
                criticalAffected: true
            };
            let attack = new Attack(attackData);
            attack.isCritical = () => true;
            let damage = 100;
            let baseCritical = damage * (attack.criticalMultiplier - 1);
            let actualCritical = attack.calculateCriticalDamage(damage, 10, 20, -50);
            assert.strictEqual(actualCritical, baseCritical);
        });
    });

    describe('calculateProportionDamage - Formula Verification', () => {
        it('should calculate damage increase formula correctly when attack > defense', () => {
            mockOwner.stats.atk = 20;
            mockTarget.stats.def = 10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let baseDamage = 100;
            let diff = 20 - 10;
            // The code caps percentage at 99% when diff >= targetDef
            let percentage = diff < 10 ? (diff * 100 / 10) : 99;
            percentage = percentage > 99 ? 99 : percentage;
            let additionalDamage = Math.ceil((percentage * baseDamage / 100));
            let expectedDamage = baseDamage + additionalDamage;
            let actualDamage = attack.calculateProportionDamage(mockTarget, baseDamage, 0, 10, 0);
            assert.strictEqual(actualDamage, expectedDamage);
        });

        it('should calculate damage reduction formula correctly when defense > attack', () => {
            mockOwner.stats.atk = 10;
            mockTarget.stats.def = 20;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let baseDamage = 100;
            let diff = 10 - 20;
            // The code caps percentage at 99% when -diff >= ownerAtk
            let percentage = -diff < 10 ? (-diff * 100 / 10) : 99;
            percentage = percentage > 99 ? 99 : percentage;
            let reducedDamage = Math.floor((percentage * baseDamage / 100));
            let expectedDamage = baseDamage - reducedDamage;
            let actualDamage = attack.calculateProportionDamage(mockTarget, baseDamage, 0, 10, 0);
            assert.strictEqual(actualDamage, expectedDamage);
        });

        it('should apply dodge proportion reduction when damageAffected and dodge > aim', () => {
            mockOwner.stats.atk = 10;
            mockTarget.stats.def = 10;
            let attackData = {
                ...BaseSkillsFixtures.attackSkill,
                owner: mockOwner,
                damageAffected: true,
                attackProperties: ['stats/atk'],
                defenseProperties: ['stats/def']
            };
            let attack = new Attack(attackData);
            let baseDamage = 100;
            let targetDodge = 20;
            let ownerAim = 10;
            let dodgeAimDiff = ((targetDodge - ownerAim) * 100) / ownerAim;
            let damageProportion = Math.floor((baseDamage * dodgeAimDiff / 100));
            let expectedDamage = baseDamage - damageProportion;
            let actualDamage = attack.calculateProportionDamage(mockTarget, baseDamage, targetDodge, ownerAim, dodgeAimDiff);
            assert.strictEqual(actualDamage, expectedDamage);
        });
    });
});
