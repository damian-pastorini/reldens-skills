/**
 *
 * Reldens - Skills - LevelModifiersModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class LevelModifiersModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'levels_modifiers';
    }

    static get relationMappings()
    {
        const { LevelModel } = require('./level-model');
        return {
            level_owner: {
                relation: this.BelongsToOneRelation,
                modelClass: LevelModel,
                join: {
                    from: this.tableName+'.level_id',
                    to: LevelModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.LevelModifiersModel = LevelModifiersModel;
