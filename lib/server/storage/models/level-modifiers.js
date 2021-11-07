/**
 *
 * Reldens - Skills - LevelModifiersModels
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class LevelModifiersModels extends ModelClassDeprecated
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
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: LevelModel,
                join: {
                    from: this.tableName+'.level_id',
                    to: LevelModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.LevelModifiersModels = LevelModifiersModels;
