/**
 *
 * Reldens - Skills - SkillsGroupsModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillsGroupsModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(key, label, description, sort)
    {
        this.key = key;
        this.label = label;
        this.description = description;
        this.sort = sort;
    }

    static createByProps(props)
    {
        const {key, label, description, sort} = props;
        return new this(key, label, description, sort);
    }

    static relationMappings()
    {
        return {
            group_id: {
                type: 'SkillGroupRelationModel',
                entityName: 'skillGroupRelation',
                reference: 'm:1',
                join: {
                    from: 'group_id',
                    to: 'id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: SkillsGroupsModel,
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
        label: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        sort: {
            type: 'number'
        }
    }
});

module.exports = {
    SkillsGroupsModel,
    entity: SkillsGroupsModel,
    schema
};
