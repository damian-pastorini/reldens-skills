/**
 *
 * Reldens - Skills - SkillAttackModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillAttackModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_attack';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill');
        return {
            parent_skill: {
                relation: ModelClassDeprecated.HasOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.SkillAttackModel = SkillAttackModel;
