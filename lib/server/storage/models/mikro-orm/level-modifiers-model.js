/**
 *
 * Reldens - Skills - LevelModifiersModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class LevelModifiersModel
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
        return new LevelModifiersModel(
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
            level_owner: {
                type: 'LevelModel',
                entityName: 'level',
                reference: 'm:1',
                join: {
                    from: 'level_id',
                    to: 'id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: LevelModifiersModel,
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
    LevelModifiersModel,
    entity: LevelModifiersModel,
    schema
};
