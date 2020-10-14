/**
 *
 * Reldens - Skills - SkillOwnerConditionsModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillOwnerConditionsModel extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_owner_conditions';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill');
        return {
            level_id: {
                relation: ModelClass.BelongsToOneRelation,
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
