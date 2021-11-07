/**
 *
 * Reldens - Skills - LevelsSetModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class LevelsSetModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'levels_set';
    }

    static get relationMappings()
    {
        const { ClassPathModel } = require('./class-path');
        const { LevelModel } = require('./level');
        return {
            class_path_id: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.id',
                    to: ClassPathModel.tableName+'.levels_set_id'
                }
            },
            skills_levels_set_levels: {
                relation: ModelClassDeprecated.HasManyRelation,
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
