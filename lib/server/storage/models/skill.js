/**
 *
 * Reldens - Skills - SkillModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class SkillModel extends ModelClass
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'skill';
    }

    static get relationMappings()
    {
        const { SkillOwnerConditionsModel } = require('./skill-owner-conditions');
        const { SkillOwnerEffectsModel } = require('./skill-owner-effects');
        const { SkillGroupRelationModel } = require('./skill-group-relation');
        const { ClassPathLevelSkillsModel } = require('./class-path-level-skills');
        const { SkillAttackModel } = require('./skill-attack');
        const { SkillPhysicalDataModel } = require('./skill-physical-data');
        return {
            skill_owner_conditions: {
                relation: ModelClass.HasManyRelation,
                modelClass: SkillOwnerConditionsModel,
                join: {
                    from: this.tableName+'.id',
                    to: SkillOwnerConditionsModel.tableName+'.skill_id'
                }
            },
            skill_owner_effects: {
                relation: ModelClass.HasManyRelation,
                modelClass: SkillOwnerEffectsModel,
                join: {
                    from: this.tableName+'.id',
                    to: SkillOwnerEffectsModel.tableName+'.skill_id'
                }
            },
            skill_group_relations: {
                relation: ModelClass.HasManyRelation,
                modelClass: SkillGroupRelationModel,
                join: {
                    from: this.tableName+'.id',
                    to: SkillGroupRelationModel.tableName+'.skill_id'
                }
            },
            class_path_level: {
                relation: ModelClass.HasManyRelation,
                modelClass: ClassPathLevelSkillsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ClassPathLevelSkillsModel.tableName+'.skill_id'
                }
            },
            skill_attack: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: SkillAttackModel,
                join: {
                    from: this.tableName+'.id',
                    to: SkillAttackModel.tableName+'.skill_id'
                }
            },
            skill_physical_data: {
                relation: ModelClass.BelongsToOneRelation,
                modelClass: SkillPhysicalDataModel,
                join: {
                    from: this.tableName+'.id',
                    to: SkillPhysicalDataModel.tableName+'.skill_id'
                }
            },
        };
    }

}

module.exports.SkillModel = SkillModel;
