/**
 *
 * Reldens - Base Skills Fixtures
 *
 */

const { Modifier, ModifierConst } = require('@reldens/modifiers');

module.exports.BaseSkillsFixtures = {
    basicSkill: {
        key: 'test-basic-skill',
        skillDelay: 0,
        castTime: 0,
        range: 0,
        allowSelfTarget: false,
        criticalChance: 0,
        criticalMultiplier: 1,
        criticalFixedValue: 0,
        usesLimit: 0
    },
    attackSkill: {
        key: 'test-attack-skill',
        skillDelay: 1000,
        castTime: 0,
        range: 50,
        affectedProperty: 'stats/hp',
        hitDamage: 10,
        attackProperties: ['stats/atk'],
        defenseProperties: ['stats/def'],
        aimProperties: ['stats/aim'],
        dodgeProperties: ['stats/dodge'],
        criticalChance: 20,
        criticalMultiplier: 1.5
    },
    effectSkill: {
        key: 'test-effect-skill',
        skillDelay: 2000,
        castTime: 500,
        range: 30,
        targetEffects: []
    },
    physicalAttackSkill: {
        key: 'test-physical-attack',
        skillDelay: 800,
        range: 0,
        affectedProperty: 'stats/hp',
        hitDamage: 15,
        magnitude: 100,
        objectWidth: 10,
        objectHeight: 10,
        attackProperties: ['stats/atk'],
        defenseProperties: ['stats/def'],
        aimProperties: ['stats/aim'],
        dodgeProperties: ['stats/dodge']
    },
    rangedSkill: {
        key: 'test-ranged-skill',
        skillDelay: 1500,
        range: 100,
        rangeAutomaticValidation: true,
        rangePropertyX: 'position/x',
        rangePropertyY: 'position/y',
        affectedProperty: 'stats/hp',
        hitDamage: 8
    },
    buffSkill: {
        key: 'test-buff-skill',
        skillDelay: 3000,
        range: 0,
        allowSelfTarget: true,
        targetEffects: [
            new Modifier({
                key: 'atk-buff',
                propertyKey: 'stats/atk',
                operation: ModifierConst.OPS.INC,
                value: 5
            })
        ]
    }
};
