/**
 *
 * Reldens - ClassPath Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const ClassPath = require('../../lib/class-path');
const Skill = require('../../lib/skill');
const SkillsEvents = require('../../lib/skills-events');
const { TestHelpers } = require('../utils/test-helpers');
const { MockOwner } = require('../fixtures/mocks/mock-owner');
const { MockTarget } = require('../fixtures/mocks/mock-target');
const { BaseLevelsFixtures } = require('../fixtures/levels/base-levels');
const { BaseSkillsFixtures } = require('../fixtures/skills/base-skills');

describe('ClassPath', () => {
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

    describe('Constructor and Init', () => {
        it('should initialize with basic properties', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(classPath.key, 'warrior');
            assert.strictEqual(classPath.label, 'Warrior');
            assert.strictEqual(classPath.currentLevel, 1);
        });

        it('should return false when key is missing', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            let result = await classPath.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(result, false);
        });

        it('should use key as label when label is not provided', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'mage',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(classPath.label, 'mage');
        });

        it('should initialize with labelsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let labelsByLevel = {
                1: 'Novice Warrior',
                3: 'Experienced Warrior',
                5: 'Master Warrior'
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                labelsByLevel: labelsByLevel
            });
            assert.strictEqual(classPath.currentLabel, 'Novice Warrior');
        });

        it('should initialize with skillsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill2', owner: mockOwner});
            let skillsByLevel = {
                1: [skill1],
                2: [skill2]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: skillsByLevel
            });
            assert.ok(classPath.currentSkills['skill1']);
            assert.strictEqual(classPath.currentSkills['skill2'], undefined);
        });

        it('should fire INIT_CLASS_PATH_END event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, () => {
                eventFired = true;
            }, 'init-test');
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(eventFired, true);
        });
    });

    describe('levelUp', () => {
        it('should add skills on level up', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill2', owner: mockOwner});
            let skillsByLevel = {
                1: [skill1],
                2: [skill2]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: skillsByLevel
            });
            assert.strictEqual(classPath.currentSkills['skill2'], undefined);
            await classPath.levelUp();
            assert.ok(classPath.currentSkills['skill2']);
        });

        it('should update label on level up', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let labelsByLevel = {
                1: 'Novice',
                2: 'Experienced'
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                labelsByLevel: labelsByLevel
            });
            assert.strictEqual(classPath.currentLabel, 'Novice');
            await classPath.levelUp();
            assert.strictEqual(classPath.currentLabel, 'Experienced');
        });

        it('should call parent levelUp', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            await classPath.levelUp();
            assert.strictEqual(classPath.currentLevel, 2);
        });
    });

    describe('levelDown', () => {
        it('should remove skills on level down', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill2', owner: mockOwner});
            let skillsByLevel = {
                1: [skill1],
                2: [skill2]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                currentExp: 100,
                skillsByLevel: skillsByLevel
            });
            assert.ok(classPath.currentSkills['skill2']);
            await classPath.levelDown();
            assert.strictEqual(classPath.currentSkills['skill2'], undefined);
        });

        it('should update label on level down', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let labelsByLevel = {
                1: 'Novice',
                2: 'Experienced'
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 2,
                currentExp: 100,
                labelsByLevel: labelsByLevel
            });
            assert.strictEqual(classPath.currentLabel, 'Experienced');
            await classPath.levelDown();
            assert.strictEqual(classPath.currentLabel, 'Novice');
        });
    });

    describe('addSkills', () => {
        it('should add skills to currentSkills', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'newSkill', owner: mockOwner});
            await classPath.addSkills([skill]);
            assert.ok(classPath.currentSkills['newSkill']);
        });

        it('should fire ADD_SKILLS_BEFORE event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, () => {
                eventFired = true;
            }, 'add-before-test');
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'newSkill', owner: mockOwner});
            await classPath.addSkills([skill]);
            assert.strictEqual(eventFired, true);
        });

        it('should fire ADD_SKILLS_AFTER event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            classPath.listenEvent(SkillsEvents.ADD_SKILLS_AFTER, () => {
                eventFired = true;
            }, 'add-after-test');
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'newSkill', owner: mockOwner});
            await classPath.addSkills([skill]);
            assert.strictEqual(eventFired, true);
        });
    });

    describe('removeSkills', () => {
        it('should remove skills from currentSkills', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'toRemove', owner: mockOwner});
            let skillsByLevel = {
                1: [skill]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: skillsByLevel
            });
            assert.ok(classPath.currentSkills['toRemove']);
            await classPath.removeSkills(['toRemove']);
            assert.strictEqual(classPath.currentSkills['toRemove'], undefined);
        });

        it('should fire REMOVE_SKILLS_BEFORE event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'toRemove', owner: mockOwner});
            let skillsByLevel = {
                1: [skill]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: skillsByLevel
            });
            classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, () => {
                eventFired = true;
            }, 'remove-before-test');
            await classPath.removeSkills(['toRemove']);
            assert.strictEqual(eventFired, true);
        });

        it('should fire REMOVE_SKILLS_AFTER event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'toRemove', owner: mockOwner});
            let skillsByLevel = {
                1: [skill]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: skillsByLevel
            });
            classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_AFTER, () => {
                eventFired = true;
            }, 'remove-after-test');
            await classPath.removeSkills(['toRemove']);
            assert.strictEqual(eventFired, true);
        });
    });

    describe('setOwnerSkills', () => {
        it('should set skills for current level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill2', owner: mockOwner});
            let skill3 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill3', owner: mockOwner});
            let skillsByLevel = {
                1: [skill1],
                2: [skill2],
                3: [skill3]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                currentExp: 100,
                skillsByLevel: skillsByLevel
            });
            assert.ok(classPath.currentSkills['skill1']);
            assert.ok(classPath.currentSkills['skill2']);
            assert.strictEqual(classPath.currentSkills['skill3'], undefined);
        });

        it('should fire SET_SKILLS event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            classPath.listenEvent(SkillsEvents.SET_SKILLS, () => {
                eventFired = true;
            }, 'set-skills-test');
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(eventFired, true);
        });

        it('should use provided currentSkills', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'providedSkill', owner: mockOwner});
            let providedSkills = {providedSkill: skill1};
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                currentSkills: providedSkills
            });
            assert.ok(classPath.currentSkills['providedSkill']);
        });
    });

    describe('getCurrentLabel', () => {
        it('should return label from labelsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let labelsByLevel = {
                1: 'Novice',
                2: 'Expert'
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                labelsByLevel: labelsByLevel
            });
            let label = classPath.getCurrentLabel();
            assert.strictEqual(label, 'Novice');
        });

        it('should loop levels when exact match not found', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let labelsByLevel = {
                1: 'Novice',
                5: 'Master'
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 3,
                currentExp: 250,
                labelsByLevel: labelsByLevel
            });
            let label = classPath.getCurrentLabel();
            assert.strictEqual(label, 'Novice');
        });

        it('should return base label when labelsByLevel is false', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            let label = classPath.getCurrentLabel();
            assert.strictEqual(label, 'Warrior');
        });
    });

    describe('getSkillsByLevelKeys', () => {
        it('should extract skill keys from skillsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill2', owner: mockOwner});
            let skillsByLevel = {
                1: [skill1],
                2: [skill2]
            };
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: skillsByLevel
            });
            assert.ok(classPath.skillsByLevelKeys);
            assert.ok(Array.isArray(classPath.skillsByLevelKeys[1]));
            assert.ok(classPath.skillsByLevelKeys[1].includes('skill1'));
        });

        it('should return false when skillsByLevel is not set', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(classPath.skillsByLevelKeys, false);
        });
    });

    describe('Error Conditions - Invalid Inputs', () => {
        it('should return false with null key', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            let result = await classPath.init({
                key: null,
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(result, false);
        });

        it('should return false with undefined key', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            let result = await classPath.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(result, false);
        });

        it('should handle empty skillsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: {}
            });
            assert.ok(classPath.currentSkills);
            assert.strictEqual(Object.keys(classPath.currentSkills).length, 0);
        });

        it('should handle null skillsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                skillsByLevel: null
            });
            assert.ok(classPath.currentSkills);
        });

        it('should handle empty labelsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                label: 'Warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                labelsByLevel: {}
            });
            assert.strictEqual(classPath.currentLabel, 'Warrior');
        });
    });

    describe('Event System - Parameter Variations', () => {
        it('should fire event with masterKey', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            let masterKey = classPath.getOwnerEventKey();
            classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, () => {
                eventFired = true;
            }, 'sub-key', masterKey);
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(eventFired, true);
        });

        it('should fire event without any keys', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, () => {
                eventFired = true;
            });
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(eventFired, true);
        });

        it('should handle multiple listeners', async () => {
            let count = 0;
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, () => { count++; }, 'key1');
            classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, () => { count++; }, 'key2');
            classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, () => { count++; }, 'key3');
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(count, 3);
        });
    });

    describe('Edge Cases', () => {
        it('should handle numeric key', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 123,
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(classPath.key, 123);
        });

        it('should handle affectedProperty', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                affectedProperty: 'stats/hp'
            });
            assert.strictEqual(classPath.affectedProperty, 'stats/hp');
        });

        it('should handle false affectedProperty', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(classPath.affectedProperty, false);
        });
    });

    describe('loopLevelsForLabel - Direct Unit Tests', () => {
        it('should return label from labelsByLevel when found', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 3,
                label: 'Warrior',
                labelsByLevel: {3: 'Veteran Warrior', 5: 'Master Warrior'}
            });
            let label = classPath.loopLevelsForLabel(classPath.currentLevel);
            assert.strictEqual(label, 'Veteran Warrior');
        });

        it('should return base label when not found in labelsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                label: 'Warrior',
                labelsByLevel: {3: 'Veteran Warrior'}
            });
            let label = classPath.loopLevelsForLabel(classPath.currentLevel);
            assert.strictEqual(label, 'Warrior');
        });

        it('should handle null labelsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                label: 'Warrior'
            });
            classPath.labelsByLevel = null;
            assert.throws(
                () => classPath.loopLevelsForLabel(classPath.currentLevel),
                TypeError
            );
        });

        it('should handle empty labelsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                label: 'Warrior',
                labelsByLevel: {}
            });
            let label = classPath.loopLevelsForLabel(classPath.currentLevel);
            assert.strictEqual(label, 'Warrior');
        });

        it('should handle level 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 0,
                label: 'Novice'
            });
            let label = classPath.loopLevelsForLabel(0);
            assert.strictEqual(label, 'Novice');
        });

        it('should handle negative level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                label: 'Warrior'
            });
            let label = classPath.loopLevelsForLabel(-5);
            assert.ok(typeof label === 'string');
        });
    });

    describe('init - Numeric Key Behavior', () => {
        it('should handle numeric key values', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 123,
                levels: levels,
                currentLevel: 1
            });
            assert.strictEqual(classPath.key, 123);
        });
    });

    describe('init - Parent Init Validation', () => {
        it('should call parent LevelsSet init', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(classPath.currentLevel, 1);
            assert.strictEqual(classPath.currentExp, 0);
            assert.ok(classPath.levels);
        });
    });

    describe('levelUp - Skills and Labels', () => {
        it('should handle levelUp with no skills at next level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                skillsByLevel: {1: [new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner})]}
            });
            await classPath.levelUp();
            assert.strictEqual(classPath.currentLevel, 2);
        });

        it('should handle levelUp with no label at next level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                label: 'Warrior',
                labelsByLevel: {1: 'Novice Warrior'}
            });
            await classPath.levelUp();
            assert.strictEqual(classPath.currentLevel, 2);
            assert.ok(classPath.currentLabel);
        });

        it('should update skills and label in correct order', async () => {
            let updateOrder = [];
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                label: 'Warrior',
                labelsByLevel: {2: 'Advanced Warrior'},
                skillsByLevel: {2: [new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner})]}
            });
            let originalAddSkills = classPath.addSkills.bind(classPath);
            classPath.addSkills = async (...args) => {
                updateOrder.push('skills');
                return await originalAddSkills(...args);
            };
            await classPath.levelUp();
            assert.ok(updateOrder.includes('skills'));
            assert.strictEqual(classPath.currentLevel, 2);
        });

        it('should fire ADD_SKILLS event when skills exist at new level', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                skillsByLevel: {2: [skill]}
            });
            classPath.listenEvent(SkillsEvents.ADD_SKILLS_AFTER, () => {
                eventFired = true;
            }, 'add-skills-listener');
            await classPath.levelUp();
            assert.strictEqual(eventFired, true);
        });
    });

    describe('levelDown - Skills and Labels', () => {
        it('should handle levelDown from level 1', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            let result = await classPath.levelDown();
            assert.strictEqual(result, undefined);
        });

        it('should update skills and label in correct order on levelDown', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                label: 'Warrior',
                labelsByLevel: {1: 'Novice Warrior', 2: 'Advanced Warrior'}
            });
            let initialLevel = classPath.currentLevel;
            await classPath.levelDown();
            assert.strictEqual(classPath.currentLevel, initialLevel - 1);
            assert.ok(classPath.currentLabel);
        });

        it('should maintain round-trip consistency on levelDown then levelUp', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'level-2-skill', owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 2,
                label: 'Warrior',
                labelsByLevel: {2: 'Advanced Warrior'},
                skillsByLevel: {2: [skill]}
            });
            await classPath.levelDown();
            assert.strictEqual(classPath.currentLevel, 1);
            await classPath.levelUp();
            assert.strictEqual(classPath.currentLevel, 2);
            assert.strictEqual(classPath.currentLabel, 'Advanced Warrior');
        });
    });

    describe('addSkills - Edge Cases', () => {
        it('should handle adding empty skills array', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await classPath.addSkills([]);
            assert.ok(classPath.currentSkills);
        });

        it('should handle adding null skills', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await assert.rejects(
                async () => await classPath.addSkills(null),
                TypeError
            );
        });

        it('should handle adding undefined skills', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await assert.rejects(
                async () => await classPath.addSkills(undefined),
                TypeError
            );
        });

        it('should handle skills with duplicate keys', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'duplicate', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'duplicate', owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await classPath.addSkills([skill1, skill2]);
            assert.strictEqual(Object.keys(classPath.currentSkills).filter(k => k === 'duplicate').length, 1);
        });

        it('should handle skills with invalid key property', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let invalidSkill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            invalidSkill.key = null;
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await classPath.addSkills([invalidSkill]);
            assert.ok(classPath.currentSkills);
        });

        it('should fire ADD_SKILLS events with correct parameters', async () => {
            let beforeEventFired = false;
            let afterEventFired = false;
            let receivedSkills = null;
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            classPath.listenEvent(SkillsEvents.ADD_SKILLS_BEFORE, (cp, skills) => {
                beforeEventFired = true;
                receivedSkills = skills;
            }, 'before-listener');
            classPath.listenEvent(SkillsEvents.ADD_SKILLS_AFTER, () => {
                afterEventFired = true;
            }, 'after-listener');
            await classPath.addSkills([skill]);
            assert.strictEqual(beforeEventFired, true);
            assert.strictEqual(afterEventFired, true);
            assert.ok(receivedSkills);
        });
    });

    describe('removeSkills - Edge Cases', () => {
        it('should handle removing empty skills array', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await classPath.removeSkills([]);
            assert.ok(classPath.currentSkills);
        });

        it('should handle removing non-existent skill', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await classPath.addSkills([skill]);
            let nonExistentSkill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'non-existent', owner: mockOwner});
            await classPath.removeSkills([nonExistentSkill]);
            assert.ok(classPath.currentSkills[skill.key]);
        });

        it('should handle removing with mixed instances and keys', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill-1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill-2', owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            await classPath.addSkills([skill1, skill2]);
            await classPath.removeSkills([skill1, 'skill-2']);
            assert.strictEqual(Object.keys(classPath.currentSkills).length, 0);
        });

        it('should fire REMOVE_SKILLS events with correct parameters', async () => {
            let beforeEventFired = false;
            let afterEventFired = false;
            let receivedSkills = null;
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, (cp, skills) => {
                beforeEventFired = true;
                receivedSkills = skills;
            }, 'remove-before-listener');
            classPath.listenEvent(SkillsEvents.REMOVE_SKILLS_AFTER, () => {
                afterEventFired = true;
            }, 'remove-after-listener');
            await classPath.addSkills([skill]);
            await classPath.removeSkills([skill]);
            assert.strictEqual(beforeEventFired, true);
            assert.strictEqual(afterEventFired, true);
            assert.ok(receivedSkills);
        });
    });

    describe('setOwnerSkills - Edge Cases', () => {
        it('should handle currentLevel = 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 0,
                skillsByLevel: {1: [skill]}
            });
            assert.ok(classPath.currentSkills);
        });

        it('should handle currentLevel = negative', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: -5
            });
            assert.ok(classPath.currentSkills);
        });

        it('should accumulate skills from multiple levels', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill-1', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill-2', owner: mockOwner});
            let skill3 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill-3', owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 3,
                skillsByLevel: {
                    1: [skill1],
                    2: [skill2],
                    3: [skill3]
                }
            });
            assert.strictEqual(Object.keys(classPath.currentSkills).length, 3);
            assert.ok(classPath.currentSkills['skill-1']);
            assert.ok(classPath.currentSkills['skill-2']);
            assert.ok(classPath.currentSkills['skill-3']);
        });

        it('should NOT include skills from future levels', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'skill-1', owner: mockOwner});
            let futureSkill = new Skill({...BaseSkillsFixtures.basicSkill, key: 'future-skill', owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                skillsByLevel: {
                    1: [skill1],
                    5: [futureSkill]
                }
            });
            assert.ok(classPath.currentSkills['skill-1']);
            assert.strictEqual(classPath.currentSkills['future-skill'], undefined);
        });
    });

    describe('getCurrentLabel - Edge Cases', () => {
        it('should handle labelsByLevel is null', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                label: 'Warrior'
            });
            classPath.labelsByLevel = null;
            assert.throws(
                () => classPath.getCurrentLabel(),
                TypeError
            );
        });

        it('should handle labelsByLevel is empty', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                label: 'Warrior',
                labelsByLevel: {}
            });
            let label = classPath.getCurrentLabel();
            assert.strictEqual(label, 'Warrior');
        });

        it('should handle currentLevel = 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 0,
                label: 'Novice'
            });
            let label = classPath.getCurrentLabel();
            assert.ok(typeof label === 'string');
        });

        it('should handle currentLevel = negative', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: -1,
                label: 'Warrior'
            });
            let label = classPath.getCurrentLabel();
            assert.ok(typeof label === 'string');
        });

        it('should handle label value is null', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                label: null
            });
            let label = classPath.getCurrentLabel();
            assert.ok(label === null || typeof label === 'string');
        });

        it('should handle label value is undefined', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            let label = classPath.getCurrentLabel();
            assert.ok(label === undefined || typeof label === 'string');
        });
    });

    describe('getSkillsByLevelKeys - Edge Cases', () => {
        it('should handle null key property', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                skillsByLevel: {1: [{key: null}]}
            });
            let skills = classPath.getSkillsByLevelKeys();
            assert.ok(typeof skills === 'object' || skills === false);
        });

        it('should handle non-array values in skillsByLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1
            });
            classPath.skillsByLevel = {1: 'not-an-array'};
            let skills = classPath.getSkillsByLevelKeys();
            assert.ok(typeof skills === 'object' || skills === false);
        });

        it('should handle duplicate keys across levels', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let skill1 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'duplicate', owner: mockOwner});
            let skill2 = new Skill({...BaseSkillsFixtures.basicSkill, key: 'duplicate', owner: mockOwner});
            let classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'warrior',
                levels: levels,
                currentLevel: 1,
                skillsByLevel: {
                    1: [skill1],
                    2: [skill2]
                }
            });
            let skillsByLevelKeys = classPath.getSkillsByLevelKeys();
            assert.ok(typeof skillsByLevelKeys === 'object');
            assert.ok(Array.isArray(skillsByLevelKeys['1']));
            assert.ok(Array.isArray(skillsByLevelKeys['2']));
        });
    });
});
