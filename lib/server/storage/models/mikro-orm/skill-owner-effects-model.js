/**
 *
 * Reldens - Skills - SkillOwnerEffectsModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillOwnerEffectsModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(level_id, key, property_key, operation, value, minValue, maxValue, minProperty, maxProperty)
    {
        this.level_id = level_id;
        this.key = key;
        this.property_key = property_key;
        this.operation = operation;
        this.value = value;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.minProperty = minProperty;
        this.maxProperty = maxProperty;
        this.type = type;
    }

    static createByProps(props)
    {
        const {
            level_id,
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
            level_id,
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
            level_id: {
                reference: 'm:1',
                type: 'SkillModel',
                join: {
                    from: 'skill_id',
                    to: 'id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: SkillOwnerEffectsModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        level_id: {
            reference: 'm:1',
            type: 'LevelModel',
            nullable: true
        },
        key: {
            type: 'string'
        },
        property_key: {
            type: 'string'
        },
        operation: {
            type: 'number'
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
    SkillOwnerEffectsModel,
    entity: SkillOwnerEffectsModel,
    schema
};
