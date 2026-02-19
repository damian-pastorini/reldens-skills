/**
 *
 * Reldens - PhysicalPropertiesValidator Unit Tests
 *
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { PhysicalPropertiesValidator } = require('../../../lib/types/physical-properties-validator');
const { MockOwner } = require('../../fixtures/mocks/mock-owner');

describe('PhysicalPropertiesValidator', () => {

    describe('validate', () => {
        it('should return false when owner missing executePhysicalSkill method', () => {
            let mockOwner = new MockOwner();
            let props = {
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, false);
        });

        it('should return false when magnitude is missing', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                objectWidth: 10,
                objectHeight: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, false);
        });

        it('should return false when objectWidth is missing', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: 100,
                objectHeight: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, false);
        });

        it('should return false when objectHeight is missing', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, false);
        });

        it('should return true when all required properties present', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, true);
        });

        it('should accept zero values for numeric properties', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: 0,
                objectWidth: 0,
                objectHeight: 0
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, true);
        });

        it('should accept negative values for magnitude', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: -50,
                objectWidth: 10,
                objectHeight: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null props', () => {
            assert.throws(() => {
                PhysicalPropertiesValidator.validate(null);
            });
        });

        it('should handle undefined props', () => {
            assert.throws(() => {
                PhysicalPropertiesValidator.validate(undefined);
            });
        });

        it('should handle empty props object', () => {
            let result = PhysicalPropertiesValidator.validate({});
            assert.strictEqual(result, false);
        });

        it('should handle props with only owner', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let result = PhysicalPropertiesValidator.validate({owner: mockOwner});
            assert.strictEqual(result, false);
        });

        it('should handle non-function executePhysicalSkill', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = 'not-a-function';
            let props = {
                owner: mockOwner,
                magnitude: 100,
                objectWidth: 10,
                objectHeight: 10
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, false);
        });

        it('should handle very large numeric values', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: 999999999,
                objectWidth: 999999,
                objectHeight: 999999
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, true);
        });

        it('should handle decimal values', () => {
            let mockOwner = new MockOwner();
            mockOwner.executePhysicalSkill = () => {};
            let props = {
                owner: mockOwner,
                magnitude: 100.5,
                objectWidth: 10.25,
                objectHeight: 10.75
            };
            let result = PhysicalPropertiesValidator.validate(props);
            assert.strictEqual(result, true);
        });
    });

    describe('validate - Owner Null/Undefined with 0 Properties', () => {
        it('should handle null owner with zero required properties', () => {
            let result = PhysicalPropertiesValidator.validate({owner: null});
            assert.strictEqual(result, false);
        });

        it('should handle undefined owner with zero required properties', () => {
            let result = PhysicalPropertiesValidator.validate({});
            assert.strictEqual(result, false);
        });
    });

    describe('validate - sc.hasOwn Behavior Edge Cases', () => {
        it('should handle properties with undefined values', () => {
            let mockOwner = {executePhysicalSkill: () => {}};
            let result = PhysicalPropertiesValidator.validate({
                owner: mockOwner,
                magnitude: undefined,
                objectWidth: 10,
                objectHeight: 10
            });
            assert.ok(typeof result === 'boolean');
        });

        it('should handle properties with null values', () => {
            let mockOwner = {executePhysicalSkill: () => {}};
            let result = PhysicalPropertiesValidator.validate({
                owner: mockOwner,
                magnitude: null,
                objectWidth: 10,
                objectHeight: 10
            });
            assert.ok(typeof result === 'boolean');
        });
    });
});
