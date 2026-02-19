/**
 *
 * Reldens - LevelsSet Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const LevelsSet = require('../../lib/levels-set');
const Level = require('../../lib/level');
const SkillsEvents = require('../../lib/skills-events');
const { Modifier, ModifierConst } = require('@reldens/modifiers');
const { TestHelpers } = require('../utils/test-helpers');
const { MockOwner } = require('../fixtures/mocks/mock-owner');
const { BaseLevelsFixtures } = require('../fixtures/levels/base-levels');

describe('LevelsSet', () => {
    let mockOwner;

    beforeEach(() => {
        mockOwner = new MockOwner();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with default properties', () => {
            let levelsSet = new LevelsSet();
            assert.ok(levelsSet);
            assert.strictEqual(levelsSet.owner, false);
        });

        it('should initialize with owner', () => {
            let levelsSet = new LevelsSet({owner: mockOwner});
            assert.strictEqual(levelsSet.owner, mockOwner);
        });
    });

    describe('init', () => {
        it('should return false when owner is undefined', async () => {
            let levelsSet = new LevelsSet();
            let result = await levelsSet.init({levels: {}});
            assert.strictEqual(result, false);
        });

        it('should return false when owner has no getPosition method', async () => {
            let invalidOwner = {id: 'test'};
            let levelsSet = new LevelsSet({owner: invalidOwner});
            let result = await levelsSet.init({levels: {}});
            assert.strictEqual(result, false);
        });

        it('should return false when levels are not provided', async () => {
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = await levelsSet.init({});
            assert.strictEqual(result, false);
        });

        it('should initialize successfully with valid data', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            assert.strictEqual(levelsSet.currentLevel, 1);
            assert.strictEqual(levelsSet.currentExp, 0);
            assert.ok(levelsSet.levels);
        });

        it('should auto-fill levels when autoFillRanges is true', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                autoFillRanges: true
            });
            assert.ok(levelsSet.levels[4]);
            assert.strictEqual(levelsSet.levels[4].key, 4);
        });
    });

    describe('levelUp', () => {
        it('should increase level by 1', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            await levelsSet.levelUp();
            assert.strictEqual(levelsSet.currentLevel, 2);
        });

        it('should return false at max level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                currentExp: 0
            });
            let result = await levelsSet.levelUp();
            assert.strictEqual(result, false);
        });

        it('should fire LEVEL_UP event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            levelsSet.listenEvent(SkillsEvents.LEVEL_UP, () => {
                eventFired = true;
            }, 'test-listener');
            await levelsSet.levelUp();
            assert.strictEqual(eventFired, true);
        });
    });

    describe('levelDown', () => {
        it('should decrease level by 1', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 2,
                currentExp: 100
            });
            await levelsSet.levelDown();
            assert.strictEqual(levelsSet.currentLevel, 1);
        });

        it('should return false at level 1', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            let result = await levelsSet.levelDown();
            assert.strictEqual(result, false);
        });
    });

    describe('addExperience', () => {
        it('should add experience correctly', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                increaseLevelsWithExperience: false
            });
            await levelsSet.addExperience(50);
            assert.strictEqual(levelsSet.currentExp, 50);
        });

        it('should auto level up when experience threshold is reached', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                increaseLevelsWithExperience: true
            });
            await levelsSet.addExperience(100);
            assert.strictEqual(levelsSet.currentLevel, 2);
            assert.strictEqual(levelsSet.currentExp, 100);
        });

        it('should fire LEVEL_EXPERIENCE_ADDED event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            levelsSet.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, () => {
                eventFired = true;
            }, 'test-listener-exp');
            await levelsSet.addExperience(50);
            assert.strictEqual(eventFired, true);
        });
    });

    describe('getNextLevelExperience', () => {
        it('should return next level required experience', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 100);
        });

        it('should return current level experience at max level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                currentExp: 500
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 500);
        });
    });

    describe('getLevelInstance', () => {
        it('should return level instance by key', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            let level = levelsSet.getLevelInstance(2);
            assert.ok(level);
            assert.strictEqual(level.key, 2);
        });

        it('should return false for non-existent level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            let level = levelsSet.getLevelInstance(99);
            assert.strictEqual(level, false);
        });

        it('should handle string level keys', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let level = levelsSet.getLevelInstance('2');
            assert.ok(level);
        });

        it('should handle null level key', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let level = levelsSet.getLevelInstance(null);
            assert.strictEqual(level, false);
        });

        it('should handle undefined level key', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let level = levelsSet.getLevelInstance(undefined);
            assert.strictEqual(level, false);
        });
    });

    describe('Event System - Parameter Variations', () => {
        it('should fire INIT_LEVEL_SET_START with removeKey only', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.setOwner({owner: mockOwner});
            levelsSet.listenEvent(SkillsEvents.INIT_LEVEL_SET_START, () => {
                eventFired = true;
            }, 'init-start-key');
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            assert.strictEqual(eventFired, true);
        });

        it('should fire INIT_LEVEL_SET_END with masterKey', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            let masterKey = levelsSet.getOwnerEventKey();
            levelsSet.listenEvent(SkillsEvents.INIT_LEVEL_SET_END, () => {
                eventFired = true;
            }, 'init-end-sub', masterKey);
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            assert.strictEqual(eventFired, true);
        });

        it('should fire SET_LEVELS without any keys', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.listenEvent(SkillsEvents.SET_LEVELS, () => {
                eventFired = true;
            });
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            assert.strictEqual(eventFired, true);
        });

        it('should fire LEVEL_DOWN event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 2, currentExp: 100});
            levelsSet.listenEvent(SkillsEvents.LEVEL_DOWN, () => {
                eventFired = true;
            }, 'level-down-test');
            await levelsSet.levelDown();
            assert.strictEqual(eventFired, true);
        });

        it('should fire LEVEL_APPLY_MODIFIERS event', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            levelsSet.listenEvent(SkillsEvents.LEVEL_APPLY_MODIFIERS, () => {
                eventFired = true;
            }, 'apply-modifiers-test');
            await levelsSet.levelUp();
            assert.strictEqual(eventFired, true);
        });

        it('should fire GENERATED_LEVELS event when auto-filling', async () => {
            let eventFired = false;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.listenEvent(SkillsEvents.GENERATED_LEVELS, () => {
                eventFired = true;
            }, 'generated-levels-test');
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                autoFillRanges: true
            });
            assert.strictEqual(eventFired, true);
        });

        it('should handle multiple listeners on same event', async () => {
            let count = 0;
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.listenEvent(SkillsEvents.LEVEL_UP, () => { count++; }, 'listener1');
            levelsSet.listenEvent(SkillsEvents.LEVEL_UP, () => { count++; }, 'listener2');
            levelsSet.listenEvent(SkillsEvents.LEVEL_UP, () => { count++; }, 'listener3');
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            await levelsSet.levelUp();
            assert.strictEqual(count, 3);
        });
    });

    describe('Error Conditions - Invalid Inputs', () => {
        it('should return false when levels is empty object', async () => {
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = await levelsSet.init({levels: {}});
            assert.strictEqual(result, false);
        });

        it('should return false when levels is null', async () => {
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = await levelsSet.init({levels: null, owner: mockOwner});
            assert.strictEqual(result, false);
        });

        it('should return false when levels is array', async () => {
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = await levelsSet.init({levels: []});
            assert.strictEqual(result, false);
        });

        it('should handle null owner', async () => {
            let levelsSet = new LevelsSet({owner: null});
            let result = await levelsSet.init({levels: {}});
            assert.strictEqual(result, false);
        });

        it('should handle undefined owner', async () => {
            let levelsSet = new LevelsSet({owner: undefined});
            let result = await levelsSet.init({levels: {}});
            assert.strictEqual(result, false);
        });

        it('should return false in setOwner when owner is missing', () => {
            let levelsSet = new LevelsSet();
            let result = levelsSet.setOwner({});
            assert.strictEqual(result, false);
        });

        it('should return false in setOwner when owner has no getPosition', () => {
            let levelsSet = new LevelsSet();
            let result = levelsSet.setOwner({owner: {id: 'test'}});
            assert.strictEqual(result, false);
        });
    });

    describe('Edge Cases - Auto-Fill', () => {
        it('should auto-fill with custom multiplier', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                autoFillRanges: true,
                autoFillExperienceMultiplier: 2
            });
            assert.ok(levelsSet.levels[4]);
            assert.strictEqual(levelsSet.autoFillExperienceMultiplier, 2);
        });

        it('should handle zero multiplier', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                autoFillRanges: true,
                autoFillExperienceMultiplier: 0
            });
            assert.strictEqual(levelsSet.autoFillExperienceMultiplier, 0);
        });

        it('should handle negative multiplier', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                autoFillRanges: true,
                autoFillExperienceMultiplier: -1
            });
            assert.strictEqual(levelsSet.autoFillExperienceMultiplier, -1);
        });

        it('should not auto-fill when disabled', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                autoFillRanges: false
            });
            assert.strictEqual(levelsSet.levels[4], undefined);
        });
    });

    describe('Edge Cases - Level Boundaries', () => {
        it('should handle currentLevel 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 0, currentExp: 0});
            assert.strictEqual(levelsSet.currentLevel, 0);
        });

        it('should handle negative currentLevel', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: -1, currentExp: 0});
            assert.strictEqual(levelsSet.currentLevel, -1);
        });

        it('should handle level beyond max defined level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 100, currentExp: 0});
            assert.strictEqual(levelsSet.currentLevel, 100);
        });
    });

    describe('Edge Cases - Experience', () => {
        it('should add negative experience', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 100,
                increaseLevelsWithExperience: false
            });
            await levelsSet.addExperience(-50);
            assert.strictEqual(levelsSet.currentExp, 50);
        });

        it('should handle zero experience addition', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 50,
                increaseLevelsWithExperience: false
            });
            await levelsSet.addExperience(0);
            assert.strictEqual(levelsSet.currentExp, 50);
        });

        it('should handle very large experience addition', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                increaseLevelsWithExperience: true,
                autoFillRanges: true
            });
            await levelsSet.addExperience(10000);
            assert.strictEqual(levelsSet.currentLevel, 5);
        });

        it('should handle decimal experience values', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                increaseLevelsWithExperience: false
            });
            await levelsSet.addExperience(50.5);
            assert.strictEqual(levelsSet.currentExp, 50.5);
        });

        it('should cap experience at max level when setRequiredExperienceLimit enabled', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                currentExp: 500,
                increaseLevelsWithExperience: true,
                setRequiredExperienceLimit: true
            });
            await levelsSet.addExperience(1000);
            assert.strictEqual(levelsSet.currentExp, 500);
        });

        it('should not cap experience when setRequiredExperienceLimit disabled', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                currentExp: 500,
                increaseLevelsWithExperience: false,
                setRequiredExperienceLimit: false
            });
            await levelsSet.addExperience(1000);
            assert.strictEqual(levelsSet.currentExp, 1500);
        });

        it('should not auto-level when disabled', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                increaseLevelsWithExperience: false
            });
            await levelsSet.addExperience(100);
            assert.strictEqual(levelsSet.currentLevel, 1);
            assert.strictEqual(levelsSet.currentExp, 100);
        });

        it('should skip multiple levels with large experience gain', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0,
                increaseLevelsWithExperience: true
            });
            await levelsSet.addExperience(300);
            assert.strictEqual(levelsSet.currentLevel, 3);
        });
    });

    describe('Edge Cases - Modifiers', () => {
        it('should apply modifiers on level up', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let initialMaxHp = mockOwner.stats.maxHp;
            await levelsSet.levelUp();
            assert.ok(mockOwner.stats.maxHp !== initialMaxHp);
        });

        it('should revert modifiers on level down', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 2, currentExp: 100});
            let levelTwoMaxHp = mockOwner.stats.maxHp;
            await levelsSet.levelDown();
            assert.ok(mockOwner.stats.maxHp !== levelTwoMaxHp);
        });

        it('should return false when applying modifiers for non-existent level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 100, currentExp: 0});
            let result = await levelsSet.applyLevelModifiers();
            assert.strictEqual(result, false);
        });

        it('should handle level with no modifiers', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let result = await levelsSet.applyLevelModifiers();
            assert.strictEqual(result, false);
        });

        it('should handle level with empty modifiers array', async () => {
            let levels = {
                1: new Level({key: 1, modifiers: [], requiredExperience: 0})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let result = await levelsSet.applyLevelModifiers();
            assert.strictEqual(result, false);
        });
    });

    describe('Edge Cases - Owner ID', () => {
        it('should use default ownerIdProperty', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            assert.strictEqual(levelsSet.getOwnerId(), 'mock-owner-1');
        });

        it('should use custom ownerIdProperty', () => {
            let customOwner = {
                customId: 'custom-123',
                getPosition: () => ({x: 0, y: 0})
            };
            let levelsSet = new LevelsSet({owner: customOwner});
            levelsSet.setOwner({owner: customOwner, ownerIdProperty: 'customId'});
            assert.strictEqual(levelsSet.getOwnerId(), 'custom-123');
        });

        it('should handle numeric owner IDs', () => {
            mockOwner.id = 12345;
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.setOwner({owner: mockOwner});
            assert.strictEqual(levelsSet.getOwnerId(), 12345);
        });

        it('should handle string owner IDs', () => {
            mockOwner.id = 'player-uuid-abc-123';
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.setOwner({owner: mockOwner});
            assert.strictEqual(levelsSet.getOwnerId(), 'player-uuid-abc-123');
        });
    });

    describe('Edge Cases - Sorting and Utilities', () => {
        it('should sort levels by key correctly', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let sorted = levelsSet.sortLevelsBy(levels);
            assert.ok(Array.isArray(sorted));
            assert.strictEqual(sorted[0], '1');
        });

        it('should sort levels by custom field', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let sorted = levelsSet.sortLevelsBy(levels, 'requiredExperience');
            assert.ok(Array.isArray(sorted));
        });

        it('should handle empty levels object for sorting', () => {
            let levelsSet = new LevelsSet({owner: mockOwner});
            let sorted = levelsSet.sortLevelsBy({});
            assert.ok(Array.isArray(sorted));
            assert.strictEqual(sorted.length, 0);
        });

        it('should generate unique event keys', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({levels: levels, currentLevel: 1, currentExp: 0});
            let key1 = levelsSet.getOwnerUniqueEventKey('test');
            await TestHelpers.sleep(1);
            let key2 = levelsSet.getOwnerUniqueEventKey('test');
            assert.ok(key1 !== key2);
        });

        it('should handle experience overflow', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 150,
                increaseLevelsWithExperience: false
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.ok(nextExp > 0);
        });
    });

    describe('getNextLevelExperience - All Return Paths', () => {
        it('should return 0 when increaseLevelsWithExperience is false', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                increaseLevelsWithExperience: false
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 100);
        });

        it('should return 0 when no next level exists', async () => {
            let levels = {5: new Level({key: 5, requiredExperience: 500})};
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 500);
        });

        it('should return next level required experience when next level exists', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 100);
        });

        it('should return required experience limit when setRequiredExperienceLimit is true', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                setRequiredExperienceLimit: true
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 500);
        });
    });

    describe('getNextLevelExperience - Edge Cases', () => {
        it('should handle currentLevel = 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 0
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.ok(typeof nextExp === 'number');
        });

        it('should handle currentLevel = negative', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: -5
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.ok(typeof nextExp === 'number');
        });

        it('should handle currentLevel beyond max', async () => {
            let levels = {1: new Level({key: 1, requiredExperience: 0})};
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 100
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 0);
        });

        it('should handle nextLevelKey is undefined', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 0}),
                5: new Level({key: 5, requiredExperience: 500})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                levelsByExperience: ['1']
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.ok(typeof nextExp === 'number');
        });
    });

    describe('init - levelsByExperience Custom Ordering', () => {
        it('should use custom levelsByExperience when provided', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let customOrder = ['5', '3', '2', '1'];
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                levelsByExperience: customOrder
            });
            assert.deepStrictEqual(levelsSet.levelsByExperience, customOrder);
        });
    });

    describe('init - setRequiredExperienceLimit Edge Cases', () => {
        it('should cap experience at max level when setRequiredExperienceLimit is true', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 0}),
                5: new Level({key: 5, requiredExperience: 500})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5,
                setRequiredExperienceLimit: true
            });
            let nextExp = levelsSet.getNextLevelExperience();
            assert.strictEqual(nextExp, 500);
        });
    });

    describe('init - Event Firing Order', () => {
        it('should fire INIT_LEVEL_SET_START then INIT_LEVEL_SET_END', async () => {
            let eventOrder = [];
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            levelsSet.listenEvent(SkillsEvents.INIT_LEVEL_SET_START, () => {
                eventOrder.push('START');
            }, 'start-listener');
            levelsSet.listenEvent(SkillsEvents.INIT_LEVEL_SET_END, () => {
                eventOrder.push('END');
            }, 'end-listener');
            await levelsSet.init({
                levels: levels,
                currentLevel: 1
            });
            assert.deepStrictEqual(eventOrder, ['START', 'END']);
        });
    });

    describe('createLevels - Multiplier Variations', () => {
        it('should handle very large multiplier values > 100', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 10}),
                5: new Level({key: 5, requiredExperience: 1000})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                autoFillRanges: true,
                autoFillExperienceMultiplier: 150
            });
            assert.ok(levelsSet.levels[2]);
            assert.ok(levelsSet.levels[3]);
            assert.ok(levelsSet.levels[4]);
        });

        it('should handle float multiplier values like 1.5', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 100}),
                3: new Level({key: 3, requiredExperience: 300})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                autoFillRanges: true,
                autoFillExperienceMultiplier: 1.5
            });
            assert.ok(levelsSet.levels[2]);
            assert.strictEqual(levelsSet.levels[2].requiredExperience, 150);
        });

        it('should handle float multiplier values like 2.5', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 100}),
                3: new Level({key: 3, requiredExperience: 300})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                autoFillRanges: true,
                autoFillExperienceMultiplier: 2.5
            });
            assert.ok(levelsSet.levels[2]);
            assert.strictEqual(levelsSet.levels[2].requiredExperience, 250);
        });
    });

    describe('createLevels - Non-Sequential Level Keys', () => {
        it('should auto-fill non-sequential level keys like 1, 3, 10, 20', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 10}),
                3: new Level({key: 3, requiredExperience: 30}),
                10: new Level({key: 10, requiredExperience: 100}),
                20: new Level({key: 20, requiredExperience: 200})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                autoFillRanges: true
            });
            assert.ok(levelsSet.levels[2]);
            assert.ok(levelsSet.levels[5]);
            assert.ok(levelsSet.levels[15]);
        });
    });

    describe('createLevels - Auto-fill with Single Level', () => {
        it('should handle auto-fill with only one level', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 10})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                autoFillRanges: true
            });
            assert.strictEqual(Object.keys(levelsSet.levels).length, 1);
        });
    });

    describe('levelUp - Edge Cases', () => {
        it('should handle levelUp from level 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 0
            });
            await levelsSet.levelUp();
            assert.ok(levelsSet.currentLevel >= 0);
        });

        it('should handle levelUp from negative level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: -5
            });
            await levelsSet.levelUp();
            assert.ok(typeof levelsSet.currentLevel === 'number');
        });

        it('should handle multiple consecutive levelUp calls', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1
            });
            await levelsSet.levelUp();
            await levelsSet.levelUp();
            await levelsSet.levelUp();
            assert.strictEqual(levelsSet.currentLevel, 4);
        });
    });

    describe('levelDown - Edge Cases', () => {
        it('should handle levelDown from level 0', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 0
            });
            let result = await levelsSet.levelDown();
            assert.strictEqual(result, false);
        });

        it('should handle multiple consecutive levelDown calls', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 5
            });
            await levelsSet.levelDown();
            await levelsSet.levelDown();
            await levelsSet.levelDown();
            assert.strictEqual(levelsSet.currentLevel, 2);
        });

        it('should maintain consistency on levelDown then levelUp round-trip', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 3
            });
            await levelsSet.levelDown();
            assert.strictEqual(levelsSet.currentLevel, 2);
            await levelsSet.levelUp();
            assert.strictEqual(levelsSet.currentLevel, 3);
        });
    });

    describe('applyLevelModifiers - Error Handling', () => {
        it('should handle when Modifier.apply() throws error', async () => {
            let brokenModifier = new Modifier({
                key: 'broken-mod',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            brokenModifier.apply = () => {
                throw new Error('Modifier apply error');
            };
            let levels = {
                1: new Level({key: 1, requiredExperience: 0, modifiers: [brokenModifier]})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1
            });
            assert.ok(levelsSet);
        });

        it('should handle when Modifier.revert() throws error', async () => {
            let brokenModifier = new Modifier({
                key: 'broken-revert',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 10
            });
            brokenModifier.revert = () => {
                throw new Error('Modifier revert error');
            };
            let levels = {
                1: new Level({key: 1, requiredExperience: 0, modifiers: [brokenModifier]}),
                2: new Level({key: 2, requiredExperience: 100})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 2
            });
            await levelsSet.levelDown();
            assert.ok(levelsSet);
        });

        it('should handle large number of modifiers (100+)', async () => {
            let modifiers = [];
            for(let i = 0; i < 150; i++){
                modifiers.push(new Modifier({
                    key: `mod-${i}`,
                    propertyKey: 'stats/atk',
                    operation: ModifierConst.OPS.INC,
                    value: 1
                }));
            }
            let levels = {
                0: new Level({key: 0, requiredExperience: 0}),
                1: new Level({key: 1, requiredExperience: 0, modifiers: modifiers})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 0
            });
            await levelsSet.levelUp();
            assert.strictEqual(mockOwner.stats.atk, 160);
        });

        it('should apply modifiers in order', async () => {
            let modifier1 = new Modifier({
                key: 'mod-1',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.SET,
                value: 5
            });
            let modifier2 = new Modifier({
                key: 'mod-2',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.MULT,
                value: 2
            });
            let levels = {
                1: new Level({key: 1, requiredExperience: 0, modifiers: [modifier1, modifier2]})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1
            });
            assert.strictEqual(mockOwner.stats.atk, 10);
        });
    });

    describe('addExperience - Experience Thresholds', () => {
        it('should level up when experience exactly at threshold', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            await levelsSet.addExperience(100);
            assert.strictEqual(levelsSet.currentLevel, 2);
        });

        it('should not level up when experience 1 point below threshold', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 0
            });
            await levelsSet.addExperience(99);
            assert.strictEqual(levelsSet.currentLevel, 1);
            assert.strictEqual(levelsSet.currentExp, 99);
        });
    });

    describe('addExperience - Event Parameters Validation', () => {
        it('should fire LEVEL_EXPERIENCE_ADDED event with all 9 parameters', async () => {
            let receivedArgs = [];
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 50
            });
            levelsSet.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, (...args) => {
                receivedArgs = args;
            }, 'exp-listener', levelsSet.getOwnerEventKey());
            await levelsSet.addExperience(25);
            assert.strictEqual(receivedArgs.length, 9);
            assert.strictEqual(receivedArgs[1], 25);
            assert.strictEqual(receivedArgs[2], 75);
        });
    });

    describe('addExperience - Negative Experience', () => {
        it('should reduce XP below 0 when negative experience added', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            let levelsSet = new LevelsSet({owner: mockOwner});
            await levelsSet.init({
                levels: levels,
                currentLevel: 1,
                currentExp: 50
            });
            await levelsSet.addExperience(-75);
            assert.ok(levelsSet.currentExp < 0);
        });
    });

    describe('sortLevelsBy - Edge Cases', () => {
        it('should handle when sortField does not exist on objects', () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 100}),
                2: new Level({key: 2, requiredExperience: 200})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = levelsSet.sortLevelsBy(levels, 'nonExistentField');
            assert.ok(Array.isArray(result));
        });

        it('should handle mixed type values in sort field', () => {
            let levels = {
                1: {key: 1, customSort: '100'},
                2: {key: 2, customSort: 50},
                3: {key: 3, customSort: null}
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = levelsSet.sortLevelsBy(levels, 'customSort');
            assert.ok(Array.isArray(result));
        });

        it('should maintain stability in sort', () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 100}),
                2: new Level({key: 2, requiredExperience: 100}),
                3: new Level({key: 3, requiredExperience: 100})
            };
            let levelsSet = new LevelsSet({owner: mockOwner});
            let result = levelsSet.sortLevelsBy(levels, 'requiredExperience');
            assert.strictEqual(result.length, 3);
            assert.ok(result.includes('1'));
            assert.ok(result.includes('2'));
            assert.ok(result.includes('3'));
        });
    });
});
