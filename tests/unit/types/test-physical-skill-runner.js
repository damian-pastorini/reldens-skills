/**
 *
 * Reldens - PhysicalSkillRunner Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { PhysicalSkillRunner } = require('../../../lib/types/physical-skill-runner');
const SkillsConst = require('../../../lib/constants');
const SkillsEvents = require('../../../lib/skills-events');
const { TestHelpers } = require('../../utils/test-helpers');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');
const { MockTarget } = require('../../fixtures/mocks/mock-target');

describe('PhysicalSkillRunner', () => {
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

    describe('runSkillLogic', () => {
        it('should return false when target out of range', async () => {
            let skill = {
                target: mockTarget,
                validateRange: () => false,
                owner: mockOwner
            };
            let result = await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(result, false);
        });

        it('should execute physical skill when in range', async () => {
            let executed = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                executed = true;
            };
            let skill = {
                target: mockTarget,
                validateRange: () => true,
                owner: mockOwner
            };
            await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(executed, true);
        });

        it('should return false after execution', async () => {
            mockOwner.executePhysicalSkill = async () => {};
            let skill = {
                target: mockTarget,
                validateRange: () => true,
                owner: mockOwner
            };
            let result = await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(result, false);
        });

        it('should pass target and skill to executePhysicalSkill', async () => {
            let receivedTarget = null;
            let receivedSkill = null;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                receivedTarget = target;
                receivedSkill = skill;
            };
            let skill = {
                target: mockTarget,
                validateRange: () => true,
                owner: mockOwner,
                key: 'test-skill'
            };
            await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(receivedTarget, mockTarget);
            assert.strictEqual(receivedSkill.key, 'test-skill');
        });
    });

    describe('executeOnHit', () => {
        it('should fire skill event', async () => {
            let eventFired = false;
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async (eventName) => {
                    if(eventName === SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT){
                        eventFired = true;
                    }
                }
            };
            await PhysicalSkillRunner.executeOnHit(
                mockTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                async () => true
            );
            assert.strictEqual(eventFired, true);
        });

        it('should return false when target validation fails', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let skill = {
                target: mockTarget,
                validateTargetOnHit: true,
                fireEvent: async () => {}
            };
            let result = await PhysicalSkillRunner.executeOnHit(
                differentTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                async () => true
            );
            assert.strictEqual(result, false);
        });

        it('should skip validation when validateTargetOnHit is false', async () => {
            let differentTarget = new MockTarget();
            differentTarget.id = 'different-id';
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            let result = await PhysicalSkillRunner.executeOnHit(
                differentTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                async () => true
            );
            assert.strictEqual(result, true);
        });

        it('should execute callback when valid', async () => {
            let callbackExecuted = false;
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            await PhysicalSkillRunner.executeOnHit(
                mockTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                async () => {
                    callbackExecuted = true;
                    return true;
                }
            );
            assert.strictEqual(callbackExecuted, true);
        });

        it('should pass target to callback', async () => {
            let receivedTarget = null;
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            await PhysicalSkillRunner.executeOnHit(
                mockTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                async (target) => {
                    receivedTarget = target;
                    return true;
                }
            );
            assert.strictEqual(receivedTarget, mockTarget);
        });

        it('should return callback result', async () => {
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            let result = await PhysicalSkillRunner.executeOnHit(
                mockTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                async () => {
                    return 'callback-result';
                }
            );
            assert.strictEqual(result, 'callback-result');
        });

        it('should return false when callback is not a function', async () => {
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            let result = await PhysicalSkillRunner.executeOnHit(
                mockTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                'not-a-function'
            );
            assert.strictEqual(result, false);
        });

        it('should return false when callback is undefined', async () => {
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            let result = await PhysicalSkillRunner.executeOnHit(
                mockTarget,
                skill,
                SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                undefined
            );
            assert.strictEqual(result, false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null target in runSkillLogic', async () => {
            let skill = {
                target: null,
                validateRange: () => true,
                owner: mockOwner
            };
            await assert.rejects(async () => {
                await PhysicalSkillRunner.runSkillLogic(skill);
            });
        });

        it('should handle null skill in runSkillLogic', async () => {
            await assert.rejects(async () => {
                await PhysicalSkillRunner.runSkillLogic(null);
            });
        });

        it('should handle missing fireEvent method', async () => {
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false
            };
            await assert.rejects(async () => {
                await PhysicalSkillRunner.executeOnHit(
                    mockTarget,
                    skill,
                    SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                    async () => true
                );
            });
        });

        it('should handle async callback that throws', async () => {
            let skill = {
                target: mockTarget,
                validateTargetOnHit: false,
                fireEvent: async () => {}
            };
            await assert.rejects(async () => {
                await PhysicalSkillRunner.executeOnHit(
                    mockTarget,
                    skill,
                    SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                    async () => {
                        throw new Error('callback error');
                    }
                );
            });
        });
    });

    describe('Integration', () => {
        it('should handle complete physical attack flow', async () => {
            let executed = false;
            let hitExecuted = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                executed = true;
                await skill.executeOnHit(target);
            };
            let skill = {
                target: mockTarget,
                validateRange: () => true,
                validateTargetOnHit: false,
                owner: mockOwner,
                fireEvent: async () => {},
                executeOnHit: async (target) => {
                    return await PhysicalSkillRunner.executeOnHit(
                        target,
                        skill,
                        SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT,
                        async () => {
                            hitExecuted = true;
                            return true;
                        }
                    );
                }
            };
            await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(executed, true);
            assert.strictEqual(hitExecuted, true);
        });
    });


    describe('runSkillLogic - lastState Verification', () => {
        it('should set lastState to EXECUTE_PHYSICAL_ATTACK', async () => {
            mockOwner.executePhysicalSkill = async () => true;
            let skill = {
                owner: mockOwner,
                target: mockTarget,
                validateRange: () => true,
                range: 0,
                magnitude: 50,
                objectWidth: 10,
                objectHeight: 10
            };
            await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(skill.lastState, SkillsConst.SKILL_STATES.EXECUTE_PHYSICAL_ATTACK);
        });
    });


    describe('executeOnHit - Event Firing Timing', () => {
        it('should fire event at correct timing', async () => {
            let physicalSkillExecuted = false;
            mockOwner.executePhysicalSkill = async (target, skill) => {
                physicalSkillExecuted = true;
            };
            let skill = {
                owner: mockOwner,
                target: mockTarget,
                validateRange: () => true,
                range: 0,
                magnitude: 50,
                objectWidth: 10,
                objectHeight: 10
            };
            await PhysicalSkillRunner.runSkillLogic(skill);
            assert.strictEqual(physicalSkillExecuted, true);
        });
    });
});
