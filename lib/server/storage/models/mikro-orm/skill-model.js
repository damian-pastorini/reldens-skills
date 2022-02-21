/**
 *
 * Reldens - Skills - SkillModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(
        key,
        type,
        autoValidation,
        skillDelay,
        castTime,
        usesLimit,
        range,
        rangeAutomaticValidation,
        rangePropertyX,
        rangePropertyY,
        rangeTargetPropertyX,
        rangeTargetPropertyY,
        allowSelfTarget,
        criticalChance,
        criticalMultiplier,
        criticalFixedValue,
        customData
    ){
        this.key = key;
        this.type = type;
        this.autoValidation = autoValidation;
        this.skillDelay = skillDelay;
        this.castTime = castTime;
        this.usesLimit = usesLimit;
        this.range = range;
        this.rangeAutomaticValidation = rangeAutomaticValidation;
        this.rangePropertyX = rangePropertyX;
        this.rangePropertyY = rangePropertyY;
        this.rangeTargetPropertyX = rangeTargetPropertyX;
        this.rangeTargetPropertyY = rangeTargetPropertyY;
        this.allowSelfTarget = allowSelfTarget;
        this.criticalChance = criticalChance;
        this.criticalMultiplier = criticalMultiplier;
        this.criticalFixedValue = criticalFixedValue;
        this.customData = customData;
    }

    static createByProps(props)
    {
        const {
            key,
            type,
            autoValidation,
            skillDelay,
            castTime,
            usesLimit,
            range,
            rangeAutomaticValidation,
            rangePropertyX,
            rangePropertyY,
            rangeTargetPropertyX,
            rangeTargetPropertyY,
            allowSelfTarget,
            criticalChance,
            criticalMultiplier,
            criticalFixedValue,
            customData
        } = props;
        return new this(
            key,
            type,
            autoValidation,
            skillDelay,
            castTime,
            usesLimit,
            range,
            rangeAutomaticValidation,
            rangePropertyX,
            rangePropertyY,
            rangeTargetPropertyX,
            rangeTargetPropertyY,
            allowSelfTarget,
            criticalChance,
            criticalMultiplier,
            criticalFixedValue,
            customData
        );
    }

    static relationMappings()
    {
        return {
            skill_owner_conditions: {
                type: 'SkillOwnerConditionsModel',
                entityName: 'skillOwnerConditions',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
            skill_owner_effects: {
                type: 'SkillOwnerEffectsModel',
                entityName: 'skillOwnerEffects',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
            skill_target_effects: {
                type: 'SkillTargetEffectsModel',
                entityName: 'skillTargetEffects',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
            skill_group_relations: {
                type: 'SkillGroupRelationModel',
                entityName: 'skillGroupRelation',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
            class_path_level: {
                type: 'ClassPathLevelSkillsModel',
                entityName: 'classPathLevelSkills',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
            skill_attack: {
                type: 'SkillAttackModel',
                entityName: 'skillAttack',
                reference: 'm:1',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
            skill_physical_data: {
                type: 'SkillPhysicalDataModel',
                entityName: 'skillPhysicalData',
                reference: 'm:1',
                join: {
                    from: 'id',
                    to: 'skill_id'
                }
            },
        };
    }

}

const schema = new EntitySchema({
    class: SkillModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        key: {
            type: 'string'
        },
        type: {
            type: 'number'
        },
        autoValidation: {
            type: 'boolean'
        },
        skillDelay: {
            type: 'number'
        },
        castTime: {
            type: 'number'
        },
        usesLimit: {
            type: 'number'
        },
        range: {
            type: 'number'
        },
        rangeAutomaticValidation: {
            type: 'boolean'
        },
        rangePropertyX: {
            type: 'string'
        },
        rangePropertyY: {
            type: 'string'
        },
        rangeTargetPropertyX: {
            type: 'string'
        },
        rangeTargetPropertyY: {
            type: 'string'
        },
        allowSelfTarget: {
            type: 'boolean'
        },
        criticalChance: {
            type: 'number'
        },
        criticalMultiplier: {
            type: 'number'
        },
        criticalFixedValue: {
            type: 'number'
        },
        customData: {
            type: 'string'
        }
    }
});

module.exports = {
    SkillModel,
    entity: SkillModel,
    schema
};
