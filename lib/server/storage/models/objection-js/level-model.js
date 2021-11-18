/**
 *
 * Reldens - Skills - LevelModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class LevelModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'levels';
    }

    static get relationMappings()
    {
        const { LevelsSetModel } = require('./levels-set-model');
        const { LevelModifiersModels } = require('./level-modifiers-model');
        return {
            level_set_id: {
                relation: this.BelongsToOneRelation,
                modelClass: LevelsSetModel,
                join: {
                    from: this.tableName+'.level_set_id',
                    to: LevelsSetModel.tableName+'.id'
                }
            },
            level_modifiers: {
                relation: this.HasManyRelation,
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
