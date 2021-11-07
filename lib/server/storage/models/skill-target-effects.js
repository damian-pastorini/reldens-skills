/**
 *
 * Reldens - Skills - SkillEffectModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillTargetEffectsModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_target_effects';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill');
        return {
            skill_id: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.SkillTargetEffectsModel = SkillTargetEffectsModel;
