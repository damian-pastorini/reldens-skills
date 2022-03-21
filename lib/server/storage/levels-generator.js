/**
 *
 * Reldens - Skills - LevelsGenerator
 *
 */

const Level = require('../../level');
const { Modifier } = require('@reldens/modifiers');
const { sc } = require('@reldens/utils');

class LevelsGenerator
{
    
    static fromLevelsModels(levelsModels)
    {
        let levels = {};
        for(let levelData of levelsModels){
            levelData.modifiers = this.extractModifiers(levelData['level_modifiers']);
            let levelKey = parseInt(levelData['key']);
            levelData.key = levelKey;
            levels[levelKey] = new Level(levelData);
        }
        return levels;
    }

    static extractModifiers(modifiersModels)
    {
        if(!sc.isArray(modifiersModels) || 0 === modifiersModels.length){
            return [];
        }
        let levelModifiers = [];
        for(let modifierData of modifiersModels){
            let modifier = new Modifier(modifierData);
            levelModifiers.push(modifier);
        }
        return levelModifiers;
    }

}

module.exports.LevelsGenerator = LevelsGenerator;
