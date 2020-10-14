/**
 *
 * Reldens - Skills - SkillAttackModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillAttackModel extends ModelClass
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

module.exports.SkillAttackModel = SkillAttackModel;
