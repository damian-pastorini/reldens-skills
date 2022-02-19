/**
 *
 * Reldens - Skills - SkillOwnerConditionsModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillOwnerConditionsModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(key, skill_id, property_key, conditional, value)
    {
        this.key = key;
        this.skill_id = skill_id;
        this.property_key = property_key;
        this.conditional = conditional;
        this.value = value;
    }

    static createByProps(props)
    {
        const {key, skill_id, property_key, conditional, value} = props;
        return new this(key, skill_id, property_key, conditional, value);
    }

    static relationMappings()
    {
        return {
            level_id: {
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
    class: SkillOwnerConditionsModel,
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
        skill_id: {
            type: 'SkillModel',
            reference: 'm:1',
            nullable: true
        },
        property_key: {
            type: 'string'
        },
        conditional: {
            type: 'string'
        },
        value: {
            type: 'string'
        },
    }
});

module.exports = {
    SkillOwnerConditionsModel,
    entity: SkillOwnerConditionsModel,
    schema
};
