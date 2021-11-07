/**
 *
 * Reldens - Skills - ClassPathLevelLabelsModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class ClassPathLevelLabelsModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'class_path_level_labels';
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
                    from: this.tableName+'.class_path_id',
                    to: ClassPathModel.tableName+'.id'
                }
            },
            label_level: {
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

module.exports.ClassPathLevelLabelsModel = ClassPathLevelLabelsModel;
