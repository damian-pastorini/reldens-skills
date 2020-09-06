/**
 *
 * Reldens - Skills - ClassPathLevelLabelsModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class ClassPathLevelLabelsModel extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'class_path_level_labels';
    }

    static get relationMappings()
    {
        const { ClassPathModel } = require('./class-path');
        return {
            class_path_id: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.class_path_id',
                    to: ClassPathModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.ClassPathLevelLabelsModel = ClassPathLevelLabelsModel;
