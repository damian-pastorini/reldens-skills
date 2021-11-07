/**
 *
 * Reldens - Skills - ClassPathModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class ClassPathModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'class_path';
    }

    static get relationMappings()
    {
        const { LevelsSetModel } = require('./levels-set');
        const { ClassPathLevelLabelsModel } = require('./class-path-level-labels');
        const { ClassPathLevelSkillsModel } = require('./class-path-level-skills');
        const { OwnersClassPathModel } = require('./owners-class-path');
        return {
            skills_levels_set: {
                relation: ModelClassDeprecated.HasOneRelation,
                modelClass: LevelsSetModel,
                join: {
                    from: this.tableName+'.levels_set_id',
                    to: LevelsSetModel.tableName+'.id'
                }
            },
            skills_class_path_level_labels: {
                relation: ModelClassDeprecated.HasManyRelation,
                modelClass: ClassPathLevelLabelsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ClassPathLevelLabelsModel.tableName+'.class_path_id'
                }
            },
            skills_class_path_level_skills: {
                relation: ModelClassDeprecated.HasManyRelation,
                modelClass: ClassPathLevelSkillsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ClassPathLevelSkillsModel.tableName+'.class_path_id'
                }
            },
            class_path_for_owner: {
                relation: ModelClassDeprecated.BelongsToOneRelation,
                modelClass: OwnersClassPathModel,
                join: {
                    from: this.tableName+'.id',
                    to: OwnersClassPathModel.tableName+'.class_path_id'
                }
            }
        };
    }

    static fullPathData()
    {
        return this.query()
            .withGraphFetched('['
                +'skills_levels_set.skills_levels_set_levels.[level_modifiers],'
                +'skills_class_path_level_labels.[label_level],'
                +'skills_class_path_level_skills.['
                    +'class_path_level_skill(orderByKey).['
                        +'skill_attack,'
                        +'skill_physical_data,'
                        +'skill_owner_conditions,'
                        +'skill_owner_effects,'
                        +'skill_target_effects'
                    +'],' +
                    'class_path_level]'
                +']')
            .modifiers({
                orderByKey(builder){
                    builder.orderBy('key');
                }
            });
    }

}

module.exports.ClassPathModel = ClassPathModel;
