/**
 *
 * Reldens - Skills - LevelModifiersModels
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class LevelModifiersModels extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'levels_modifiers';
    }

    static get relationMappings()
    {
        const { LevelModel } = require('./level');
        return {
            level_owner: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: LevelModel,
                join: {
                    from: this.tableName+'.level_key',
                    to: LevelModel.tableName+'.key'
                }
            }
        };
    }

}

module.exports.LevelModifiersModels = LevelModifiersModels;
