/**
 *
 * Reldens - Skills - LevelModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class LevelModel extends ModelClass
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
                relation: ModelClass.BelongsToOneRelation,
                modelClass: LevelsSetModel,
                join: {
                    from: this.tableName+'.level_set_id',
                    to: LevelsSetModel.tableName+'.id'
                }
            },
            level_modifiers: {
                relation: ModelClass.HasManyRelation,
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
