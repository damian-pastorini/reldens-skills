/**
 *
 * Reldens - Skills - SkillGroupRelationModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');
const SkillsConst = require('../../../../constants');

class SkillGroupRelationModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill_group_relation';
    }

    static get relationMappings()
    {
        const { SkillModel } = require('./skill-model');
        const { SkillsGroupsModel } = require('./skills-groups-model');
        return {
            skill_id: {
                relation: this.BelongsToOneRelation,
                modelClass: SkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillModel.tableName+'.id'
                }
            },
            group_id: {
                relation: this.BelongsToOneRelation,
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
