/**
 *
 * Reldens - Skills - SkillEffectModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class SkillTargetEffectsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_target_effects';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill-model');
        return {
            skill_id: {
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

module.exports.SkillTargetEffectsModel = SkillTargetEffectsModel;
