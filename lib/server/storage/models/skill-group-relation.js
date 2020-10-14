/**
 *
 * Reldens - Skills - SkillGroupRelationModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillGroupRelationModel extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_group_relation';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill');
        const { SkillsGroupsModel } = require('./skills-groups');
        return {
            skill_id: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            },
            group_id: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: SkillsGroupsModel,
                join: {
                    from: this.tableName+'.group_id',
                    to: SkillsGroupsModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.SkillGroupRelationModel = SkillGroupRelationModel;
