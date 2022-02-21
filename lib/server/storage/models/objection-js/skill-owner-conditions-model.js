/**
 *
 * Reldens - Skills - SkillOwnerConditionsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class SkillOwnerConditionsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_owner_conditions';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill-model');
        return {
            level_id: {
                relation: this.BelongsToOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.SkillOwnerConditionsModel = SkillOwnerConditionsModel;
