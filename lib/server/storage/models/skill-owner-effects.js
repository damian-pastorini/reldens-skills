/**
 *
 * Reldens - Skills - SkillOwnerEffectsModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillOwnerEffectsModel extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_owner_effects';
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

module.exports.SkillOwnerEffectsModel = SkillOwnerEffectsModel;
