/**
 *
 * Reldens - Skills - LevelsSetModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class LevelsSetModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'levels_set';
    }

    static get relationMappings()
    {
        const { ClassPathModel } = require('./class-path-model');
        const { LevelModel } = require('./level-model');
        return {
            class_path_id: {
                relation: this.BelongsToOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.id',
                    to: ClassPathModel.tableName+'.levels_set_id'
                }
            },
            skills_levels_set_levels: {
                relation: this.HasManyRelation,
                modelClass: LevelModel,
                join: {
                    from: this.tableName+'.id',
                    to: LevelModel.tableName+'.level_set_id'
                }
            }
        };
    }

}

module.exports.LevelsSetModel = LevelsSetModel;
