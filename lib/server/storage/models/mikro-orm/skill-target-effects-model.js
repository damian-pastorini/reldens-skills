/**
 *
 * Reldens - Skills - SkillEffectModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillTargetEffectsModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(magnitude, skill_id, key, property_key, operation, value, minValue, maxValue, minProperty, maxProperty)
    {
        this.magnitude = magnitude;
        this.skill_id = skill_id;
        this.key = key;
        this.property_key = property_key;
        this.operation = operation;
        this.value = value;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.minProperty = minProperty;
        this.maxProperty = maxProperty;
    }

    static createByProps(props)
    {
        const {
            magnitude,
            skill_id,
            key,
            property_key,
            operation,
            value,
            minValue,
            maxValue,
            minProperty,
            maxProperty
        } = props;
        return new this(
            magnitude,
            skill_id,
            key,
            property_key,
            operation,
            value,
            minValue,
            maxValue,
            minProperty,
            maxProperty
        );
    }

    static relationMappings()
    {
        return {
            skill_id: {
                type: 'SkillModel',
                entityName: 'skill',
                reference: 'm:1',
                join: {
                    from: 'skill_id',
                    to: 'id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: SkillTargetEffectsModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        magnitude: {
            type: 'number'
        },
        skill_id: {
            type: 'SkillModel',
            reference: 'm:1',
            nullable: true
        },
        key: {
            type: 'string'
        },
        property_key: {
            type: 'string'
        },
        operation: {
            type: 'string'
        },
        value: {
            type: 'string'
        },
        minValue: {
            type: 'string'
        },
        maxValue: {
            type: 'string'
        },
        minProperty: {
            type: 'string'
        },
        maxProperty: {
            type: 'string'
        }
    }
});

module.exports = {
    SkillTargetEffectsModel,
    entity: SkillTargetEffectsModel,
    schema
};
