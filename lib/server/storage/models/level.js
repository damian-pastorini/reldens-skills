/**
 *
 * Reldens - Skills - LevelModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class LevelModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'levels';
    }

    static get relationMappings()
    {
        const { LevelsSetModel } = require('./levels-set');
        const { LevelModifiersModels } = require('./level-modifiers');
        return {
            level_set_id: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: LevelsSetModel,
                join: {
                    from: this.tableName+'.level_set_id',
                    to: LevelsSetModel.tableName+'.id'
                }
            },
            level_modifiers: {
                relation: ModelClassDeprecated.HasManyRelation,
                modelClass: LevelModifiersModels,
                join: {
                    from: this.tableName+'.id',
                    to: LevelModifiersModels.tableName+'.level_id'
                }
            },
        };
    }

}

module.exports.LevelModel = LevelModel;
