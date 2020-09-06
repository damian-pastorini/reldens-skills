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
        return SkillsConst.MODELS_PREFIX+'skill_effect';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill');
        return {
            skill_id: {
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

module.exports.SkillTargetEffectsModel = SkillTargetEffectsModel;
