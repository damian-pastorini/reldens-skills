/**
 *
 * Reldens - Skills - SkillPhysicalDataModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillPhysicalDataModel extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_physical_data';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill');
        return {
            parent_skill: {
                relation: ModelClass.HasOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.SkillPhysicalDataModel = SkillPhysicalDataModel;
