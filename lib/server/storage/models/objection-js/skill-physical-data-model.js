/**
 *
 * Reldens - Skills - SkillPhysicalDataModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class SkillPhysicalDataModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_physical_data';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill-model');
        return {
            parent_skill: {
                relation: this.HasOneRelation,
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
