/**
 *
 * Reldens - Skills - SkillGroupRelationModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillGroupRelationModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(skill_id, group_id)
    {
        this.skill_id = skill_id;
        this.group_id = group_id;
    }

    static createByProps(props)
    {
        const {skill_id, group_id} = props;
        return new this(skill_id, group_id);
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
            },
            group_id: {
                type: 'SkillsGroupsModel',
                entityName: 'skillGroups',
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
    class: SkillGroupRelationModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        skill_id: {
            reference: 'm:1',
            type: 'SkillModel',
            nullable: true
        },
        group_id: {
            reference: 'm:1',
            type: 'SkillsGroupsModel',
            nullable: true
        }
    }
});

module.exports = {
    SkillGroupRelationModel,
    entity: SkillGroupRelationModel,
    schema
};
