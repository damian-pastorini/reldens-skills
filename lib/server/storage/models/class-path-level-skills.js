/**
 *
 * Reldens - Skills - ClassPathLevelSkillsModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class ClassPathLevelSkillsModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'class_path_level_skills';
    }

    static get relationMappings()
    {
        const { ClassPathModel } = require('./class-path');
        const { LevelModel } = require('./level');
        const { SkillModel } = require('./skill');
        return {
            class_path_id: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.class_path_id',
                    to: ClassPathModel.tableName+'.id'
                }
            },
            class_path_level: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: LevelModel,
                join: {
                    from: this.tableName+'.level_id',
                    to: LevelModel.tableName+'.id'
                }
            },
            class_path_level_skill: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            },
        };
    }

}

module.exports.ClassPathLevelSkillsModel = ClassPathLevelSkillsModel;
