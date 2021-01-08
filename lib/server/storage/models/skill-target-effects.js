/**
 *
 * Reldens - Skills - SkillEffectModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillTargetEffectsModel extends ModelClass
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

module.exports.SkillTargetEffectsModel = SkillTargetEffectsModel;
