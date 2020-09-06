/**
 *
 * Reldens - Skills - LevelsSetModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class LevelsSetModel extends ModelClass
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
                relation: ModelClass.BelongsToOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.id',
                    to: ClassPathModel.tableName+'.levels_set_id'
                }
            },
            skills_levels_set_levels: {
                relation: ModelClass.HasManyRelation,
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
