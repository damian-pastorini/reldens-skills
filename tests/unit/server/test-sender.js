/**
 *
 * Reldens - Sender Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Sender = require('../../../lib/server/sender');
const ClassPath = require('../../../lib/class-path');
const Skill = require('../../../lib/skill');
const Level = require('../../../lib/level');
const SkillsConst = require('../../../lib/constants');
const SkillsEvents = require('../../../lib/skills-events');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');
const { MockTarget } = require('../../fixtures/mocks/mock-target');
const { BaseLevelsFixtures } = require('../../fixtures/levels/base-levels');
const { BaseSkillsFixtures } = require('../../fixtures/skills/base-skills');

describe('Sender', () => {
    let mockOwner;
    let mockClient;
    let classPath;

    beforeEach(() => {
        mockOwner = new MockOwner();
        mockClient = TestHelpers.createMockClient();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with classPath and client', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            assert.ok(sender);
            assert.strictEqual(sender.classPath, classPath);
            assert.strictEqual(sender.client, mockClient);
        });

        it('should initialize without client', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath);
            assert.ok(sender);
            assert.strictEqual(sender.client, false);
        });
    });

    describe('validateClient', () => {
        it('should return false when client is undefined', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath);
            assert.strictEqual(sender.validateClient(), false);
        });

        it('should return true when client is defined', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            assert.strictEqual(sender.validateClient(), true);
        });
    });

    describe('registerListeners', () => {
        it('should return early when client is invalid', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath);
            sender.registerListeners();
        });

        it('should register INIT_CLASS_PATH_END listener', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            sender.registerListeners();
            await sender.sendInitClassPathData(classPath);
            assert.strictEqual(mockClient.sentMessages.length, 1);
        });

        it('should register LEVEL_UP listener', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 1});
            let sender = new Sender(classPath, mockClient);
            sender.registerListeners();
            await sender.sendLevelUpData(classPath);
            assert.strictEqual(mockClient.sentMessages.length, 1);
        });

        it('should register LEVEL_EXPERIENCE_ADDED listener', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 1});
            classPath.currentExp = 50;
            let sender = new Sender(classPath, mockClient);
            sender.registerListeners();
            await sender.sendLevelExperienceAdded(classPath);
            assert.strictEqual(mockClient.sentMessages.length, 1);
        });

        it('should register SKILL_BEFORE_CAST listener', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            sender.registerListeners();
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let mockTarget = new MockTarget();
            await sender.sendSkillBeforeCastData(skill, mockTarget);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
        });

        it('should register SKILL_ATTACK_APPLY_DAMAGE listener', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            sender.registerListeners();
            let skill = new Skill({...BaseSkillsFixtures.attackSkill, owner: mockOwner});
            let mockTarget = new MockTarget();
            await sender.sendSkillAttackApplyDamage(skill, mockTarget, 10, 90);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
        });

        it('should register all 5 event listeners', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            sender.registerListeners();
        });
    });

    describe('sendInitClassPathData', () => {
        it('should send correct message structure', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 1, currentExp: 0});
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            assert.strictEqual(mockClient.sentMessages.length, 1);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.act, SkillsConst.ACTION_INIT_CLASS_PATH_END);
            assert.strictEqual(message.data.lvl, 1);
            assert.strictEqual(message.data.exp, 0);
        });

        it('should include next level experience when available', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 1});
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.ok(message.data.ne);
            assert.strictEqual(message.data.ne, 100);
        });

        it('should not send ne when next level experience is 0', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 0}),
                2: new Level({key: 2, requiredExperience: 0})
            };
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 1});
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.ne, undefined);
        });

        it('should not send ne when next level experience is negative', async () => {
            let levels = {
                5: new Level({key: 5, requiredExperience: 500})
            };
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 5});
            classPath.getNextLevelExperience = () => -1;
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.ne, undefined);
        });

        it('should include nl when labelsByLevel exists for current level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'test',
                levels: levels,
                currentLevel: 2,
                label: 'Base Warrior',
                labelsByLevel: {2: 'Advanced Warrior'}
            });
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.nl, 'Advanced Warrior');
        });

        it('should not include nl when labelsByLevel does not exist for current level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({
                key: 'test',
                levels: levels,
                currentLevel: 1,
                label: 'Warrior',
                labelsByLevel: {3: 'Master Warrior'}
            });
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.nl, undefined);
        });

        it('should include label', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, label: 'Warrior'});
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.lab, 'Warrior');
        });

        it('should include skill keys', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            classPath.currentSkills = {skill1: {key: 'skill1'}, skill2: {key: 'skill2'}};
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.ok(Array.isArray(message.data.skl));
            assert.strictEqual(message.data.skl.length, 2);
        });
    });

    describe('sendLevelUpData', () => {
        it('should send correct message structure', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 2});
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelUpData(classPath);
            assert.strictEqual(mockClient.sentMessages.length, 1);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.act, SkillsConst.ACTION_LEVEL_UP);
            assert.strictEqual(message.data.lvl, 2);
        });

        it('should include new skills when available', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 2});
            classPath.skillsByLevelKeys = {2: ['newSkill']};
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelUpData(classPath);
            let message = mockClient.sentMessages[0];
            assert.ok(message.data.skl);
            assert.deepStrictEqual(message.data.skl, ['newSkill']);
        });

        it('should not include skl when no skills at current level', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 2});
            classPath.skillsByLevelKeys = {1: ['oldSkill']};
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelUpData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.skl, undefined);
        });

        it('should include next level experience', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 2});
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelUpData(classPath);
            let message = mockClient.sentMessages[0];
            assert.ok(message.data.ne);
        });

        it('should not send ne when next level experience is 0', async () => {
            let levels = {
                1: new Level({key: 1, requiredExperience: 0}),
                2: new Level({key: 2, requiredExperience: 0})
            };
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 2});
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelUpData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.ne, undefined);
        });
    });

    describe('sendLevelExperienceAdded', () => {
        it('should send correct message structure', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            classPath.currentExp = 50;
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelExperienceAdded(classPath);
            assert.strictEqual(mockClient.sentMessages.length, 1);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.act, SkillsConst.ACTION_LEVEL_EXPERIENCE_ADDED);
            assert.strictEqual(message.data.exp, 50);
        });
    });

    describe('sendSkillBeforeCastData', () => {
        it('should send correct message structure with skill key and owner position', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let mockTarget = new MockTarget();
            await sender.sendSkillBeforeCastData(skill, mockTarget);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
            let message = mockClient.broadcastMessages[0];
            assert.strictEqual(message.act, SkillsConst.ACTION_SKILL_BEFORE_CAST);
            assert.strictEqual(message.data.skillKey, BaseSkillsFixtures.basicSkill.key);
            assert.strictEqual(message.data.x, mockOwner.getPosition().x);
            assert.strictEqual(message.data.y, mockOwner.getPosition().y);
        });

        it('should include extraData when owner.getSkillExtraData exists', async () => {
            let ownerWithExtraData = new MockOwner();
            ownerWithExtraData.getSkillExtraData = ({skill, target}) => {
                return {customData: 'test-data', targetId: target.id};
            };
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: ownerWithExtraData});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: ownerWithExtraData});
            let mockTarget = new MockTarget();
            await sender.sendSkillBeforeCastData(skill, mockTarget);
            let message = mockClient.broadcastMessages[0];
            assert.ok(message.data.extraData);
            assert.strictEqual(message.data.extraData.customData, 'test-data');
            assert.strictEqual(message.data.extraData.targetId, mockTarget.id);
        });

        it('should use BEHAVIOR_BROADCAST', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let skill = new Skill({...BaseSkillsFixtures.basicSkill, owner: mockOwner});
            let mockTarget = new MockTarget();
            await sender.sendSkillBeforeCastData(skill, mockTarget);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
            assert.strictEqual(mockClient.sentMessages.length, 0);
        });
    });

    describe('sendSkillAttackApplyDamage', () => {
        it('should send correct message structure with damage', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let skill = new Skill({...BaseSkillsFixtures.attackSkill, owner: mockOwner});
            let mockTarget = new MockTarget();
            let damage = 15;
            let newValue = 85;
            await sender.sendSkillAttackApplyDamage(skill, mockTarget, damage, newValue);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
            let message = mockClient.broadcastMessages[0];
            assert.strictEqual(message.act, SkillsConst.ACTION_SKILL_ATTACK_APPLY_DAMAGE);
            assert.strictEqual(message.data.d, damage);
        });

        it('should include extraData when owner.getSkillExtraData exists', async () => {
            let ownerWithExtraData = new MockOwner();
            ownerWithExtraData.getSkillExtraData = ({skill, target}) => {
                return {isCritical: true, targetHealth: 85};
            };
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: ownerWithExtraData});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let skill = new Skill({...BaseSkillsFixtures.attackSkill, owner: ownerWithExtraData});
            let mockTarget = new MockTarget();
            await sender.sendSkillAttackApplyDamage(skill, mockTarget, 15, 85);
            let message = mockClient.broadcastMessages[0];
            assert.ok(message.data.extraData);
            assert.strictEqual(message.data.extraData.isCritical, true);
            assert.strictEqual(message.data.extraData.targetHealth, 85);
        });

        it('should use BEHAVIOR_BROADCAST', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let skill = new Skill({...BaseSkillsFixtures.attackSkill, owner: mockOwner});
            let mockTarget = new MockTarget();
            await sender.sendSkillAttackApplyDamage(skill, mockTarget, 10, 90);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
            assert.strictEqual(mockClient.sentMessages.length, 0);
        });
    });

    describe('runBehaviors', () => {
        it('should broadcast when behavior is BROADCAST', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            await sender.runBehaviors(
                {test: 'data'},
                SkillsConst.ACTION_LEVEL_UP,
                SkillsConst.BEHAVIOR_BROADCAST,
                classPath.getOwnerId()
            );
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
            assert.strictEqual(mockClient.sentMessages.length, 0);
        });

        it('should send when behavior is SEND', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            await sender.runBehaviors(
                {test: 'data'},
                SkillsConst.ACTION_LEVEL_UP,
                SkillsConst.BEHAVIOR_SEND,
                classPath.getOwnerId()
            );
            assert.strictEqual(mockClient.sentMessages.length, 1);
            assert.strictEqual(mockClient.broadcastMessages.length, 0);
        });

        it('should both send and broadcast when behavior is BOTH', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            await sender.runBehaviors(
                {test: 'data'},
                SkillsConst.ACTION_LEVEL_UP,
                SkillsConst.BEHAVIOR_BOTH,
                classPath.getOwnerId()
            );
            assert.strictEqual(mockClient.sentMessages.length, 1);
            assert.strictEqual(mockClient.broadcastMessages.length, 1);
        });

        it('should return false when owner id mismatch', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let result = await sender.runBehaviors(
                {test: 'data'},
                SkillsConst.ACTION_LEVEL_UP,
                SkillsConst.BEHAVIOR_SEND,
                'different-owner-id'
            );
            assert.strictEqual(result, false);
            assert.strictEqual(mockClient.sentMessages.length, 0);
        });

        it('should include correct message structure', async () => {
            let levels = BaseLevelsFixtures.createLevelSet();
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            let testData = {level: 5, exp: 500};
            await sender.runBehaviors(
                testData,
                SkillsConst.ACTION_LEVEL_UP,
                SkillsConst.BEHAVIOR_SEND,
                classPath.getOwnerId()
            );
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.act, SkillsConst.ACTION_LEVEL_UP);
            assert.strictEqual(message.owner, classPath.getOwnerId());
            assert.deepStrictEqual(message.data, testData);
        });
    });

    describe('Edge Cases', () => {
        it('should handle classPath without skills', async () => {
            let levels = {1: new Level({key: 1, requiredExperience: 0})};
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels});
            let sender = new Sender(classPath, mockClient);
            await sender.sendInitClassPathData(classPath);
            let message = mockClient.sentMessages[0];
            assert.ok(Array.isArray(message.data.skl));
            assert.strictEqual(message.data.skl.length, 0);
        });

        it('should handle max level without next experience', async () => {
            let levels = {5: new Level({key: 5, requiredExperience: 500})};
            classPath = new ClassPath({owner: mockOwner});
            await classPath.init({key: 'test', levels: levels, currentLevel: 5});
            let sender = new Sender(classPath, mockClient);
            await sender.sendLevelUpData(classPath);
            let message = mockClient.sentMessages[0];
            assert.strictEqual(message.data.ne, 500);
        });
    });
});
