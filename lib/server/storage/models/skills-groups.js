/**
 *
 * Reldens - Skills - SkillsGroupsModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillsGroupsModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'groups';
    }

    static get relationMappings()
    {
        const { SkillGroupRelationModel } = require('./skill-group-relation');
        return {
            level_id: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: SkillGroupRelationModel,
                join: {
                    from: this.tableName+'.group_id',
                    to: SkillGroupRelationModel.tableName+'.id'
                }
            }
        };
    }

}

module.exports.SkillsGroupsModel = SkillsGroupsModel;
