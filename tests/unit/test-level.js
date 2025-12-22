/**
 *
 * Reldens - Level Unit Tests
 *
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const Level = require('../../lib/level');
const { Modifier, ModifierConst } = require('@reldens/modifiers');

describe('Level', () => {
    describe('Constructor', () => {
        it('should initialize with key', () => {
            let level = new Level({key: 1});
            assert.strictEqual(level.key, 1);
        });

        it('should initialize with label', () => {
            let level = new Level({key: 1, label: 'Level 1'});
            assert.strictEqual(level.label, 'Level 1');
        });

        it('should initialize with default label as key', () => {
            let level = new Level({key: 1, modifiers: []});
            assert.strictEqual(level.label, 1);
        });

        it('should initialize with requiredExperience', () => {
            let level = new Level({key: 1, requiredExperience: 100});
            assert.strictEqual(level.requiredExperience, 100);
        });

        it('should initialize with default 0 requiredExperience', () => {
            let level = new Level({key: 1});
            assert.strictEqual(level.requiredExperience, 0);
        });

        it('should initialize with modifiers array', () => {
            let modifiers = [
                new Modifier({
                    key: 'test-mod',
                    propertyKey: 'hp',
                    operation: ModifierConst.OPS.INC,
                    value: 10
                })
            ];
            let level = new Level({key: 1, modifiers: modifiers});
            assert.strictEqual(level.modifiers.length, 1);
            assert.strictEqual(level.modifiers[0].key, 'test-mod');
        });

        it('should accept modifiers from props', () => {
            let level = new Level({key: 1, modifiers: []});
            assert.ok(Array.isArray(level.modifiers));
            assert.strictEqual(level.modifiers.length, 0);
        });

        it('should handle multiple modifiers', () => {
            let modifiers = [
                new Modifier({
                    key: 'hp-mod',
                    propertyKey: 'hp',
                    operation: ModifierConst.OPS.INC,
                    value: 10
                }),
                new Modifier({
                    key: 'atk-mod',
                    propertyKey: 'atk',
                    operation: ModifierConst.OPS.INC,
                    value: 5
                })
            ];
            let level = new Level({key: 1, modifiers: modifiers});
            assert.strictEqual(level.modifiers.length, 2);
        });
    });

    describe('Properties', () => {
        it('should maintain all properties correctly', () => {
            let modifiers = [new Modifier({
                key: 'test',
                propertyKey: 'hp',
                operation: ModifierConst.OPS.INC,
                value: 10
            })];
            let levelData = {
                key: 5,
                label: 'Expert',
                requiredExperience: 500,
                modifiers: modifiers
            };
            let level = new Level(levelData);
            assert.strictEqual(level.key, 5);
            assert.strictEqual(level.label, 'Expert');
            assert.strictEqual(level.requiredExperience, 500);
            assert.strictEqual(level.modifiers.length, 1);
        });
    });

    describe('Constructor - Missing Key Property', () => {
        it('should handle missing key property', () => {
            let level = new Level({requiredExperience: 100});
            assert.ok(level);
            assert.strictEqual(level.key, undefined);
        });
    });

    describe('Constructor - NaN Key', () => {
        it('should handle NaN key', () => {
            let level = new Level({key: NaN, requiredExperience: 100});
            assert.ok(level);
            assert.ok(isNaN(level.key));
        });
    });

    describe('Constructor - Non-Numeric Key', () => {
        it('should handle non-numeric key', () => {
            let level = new Level({key: 'string-key', requiredExperience: 100});
            assert.ok(level instanceof Level);
            assert.strictEqual(level.key, undefined);
        });
    });

    describe('Constructor - Empty Modifiers Array', () => {
        it('should handle empty modifiers array without warning', () => {
            let level = new Level({key: 1, requiredExperience: 100, modifiers: []});
            assert.ok(level);
            assert.strictEqual(level.modifiers.length, 0);
        });
    });

    describe('Constructor - Null/Undefined Modifiers', () => {
        it('should handle null modifiers', () => {
            assert.throws(
                () => new Level({key: 1, requiredExperience: 100, modifiers: null}),
                TypeError
            );
        });

        it('should handle undefined modifiers', () => {
            let level = new Level({key: 1, requiredExperience: 100});
            assert.ok(level);
        });
    });

    describe('Constructor - Required Experience Fallback', () => {
        it('should use 0 as fallback for missing requiredExperience', () => {
            let level = new Level({key: 1});
            assert.strictEqual(level.requiredExperience, 0);
        });
    });

    describe('Constructor - Invalid Modifiers Type', () => {
        it('should handle modifiers as non-array type', () => {
            let level = new Level({key: 1, requiredExperience: 100, modifiers: 'not-an-array'});
            assert.ok(level);
        });
    });

    describe('Constructor - Negative Key', () => {
        it('should handle negative key', () => {
            let level = new Level({key: -5, requiredExperience: 100});
            assert.ok(level);
            assert.strictEqual(level.key, -5);
        });
    });

    describe('Constructor - Float Key', () => {
        it('should handle float key without truncation', () => {
            let level = new Level({key: 1.5, requiredExperience: 100});
            assert.ok(level);
            assert.strictEqual(level.key, 1);
        });
    });
});
