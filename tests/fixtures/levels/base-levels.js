/**
 *
 * Reldens - Base Levels Fixtures
 *
 */

const Level = require('../../../lib/level');
const { Modifier, ModifierConst } = require('@reldens/modifiers');

module.exports.BaseLevelsFixtures = {
    createBasicLevel: (key = 1, requiredExperience = 0) => {
        return new Level({
            key: key,
            label: 'Level '+key,
            requiredExperience: requiredExperience,
            modifiers: []
        });
    },
    createLevelWithModifiers: (key = 1, requiredExperience = 0) => {
        return new Level({
            key: key,
            label: 'Level '+key,
            requiredExperience: requiredExperience,
            modifiers: [
                new Modifier({
                    key: 'hp-increase',
                    propertyKey: 'stats/maxHp',
                    operation: ModifierConst.OPS.INC,
                    value: 10
                }),
                new Modifier({
                    key: 'atk-increase',
                    propertyKey: 'stats/atk',
                    operation: ModifierConst.OPS.INC,
                    value: 2
                })
            ]
        });
    },
    createLevelSet: () => {
        return {
            1: new Level({
                key: 1,
                label: 'Level 1',
                requiredExperience: 0,
                modifiers: []
            }),
            2: new Level({
                key: 2,
                label: 'Level 2',
                requiredExperience: 100,
                modifiers: [
                    new Modifier({
                        key: 'hp-inc-lvl2',
                        propertyKey: 'stats/maxHp',
                        operation: ModifierConst.OPS.INC,
                        value: 10
                    })
                ]
            }),
            3: new Level({
                key: 3,
                label: 'Level 3',
                requiredExperience: 250,
                modifiers: [
                    new Modifier({
                        key: 'hp-inc-lvl3',
                        propertyKey: 'stats/maxHp',
                        operation: ModifierConst.OPS.INC,
                        value: 15
                    })
                ]
            }),
            5: new Level({
                key: 5,
                label: 'Level 5',
                requiredExperience: 500,
                modifiers: [
                    new Modifier({
                        key: 'hp-inc-lvl5',
                        propertyKey: 'stats/maxHp',
                        operation: ModifierConst.OPS.INC,
                        value: 25
                    })
                ]
            })
        };
    }
};
