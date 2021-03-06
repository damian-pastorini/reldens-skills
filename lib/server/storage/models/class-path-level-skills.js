/**
 *
 * Reldens - Skills - ClassPathLevelSkillsModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class ClassPathLevelSkillsModel extends ModelClass
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
                relation: ModelClass.BelongsToOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.class_path_id',
                    to: ClassPathModel.tableName+'.id'
                }
            },
            class_path_level: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: LevelModel,
                join: {
                    from: this.tableName+'.level_id',
                    to: LevelModel.tableName+'.id'
                }
            },
            class_path_level_skill: {
                relation: ModelClass.BelongsToOneRelation,
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
