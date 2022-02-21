/**
 *
 * Reldens - Skills - SkillPhysicalDataModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillPhysicalDataModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(skill_id, magnitude, objectWidth, objectHeight, validateTargetOnHit)
    {
        this.skill_id = skill_id;
        this.magnitude = magnitude;
        this.objectWidth = objectWidth;
        this.objectHeight = objectHeight;
        this.validateTargetOnHit = validateTargetOnHit;
    }

    static createByProps(props)
    {
        const {skill_id, magnitude, objectWidth, objectHeight, validateTargetOnHit} = props;
        return new this(skill_id, magnitude, objectWidth, objectHeight, validateTargetOnHit);
    }

    static relationMappings()
    {
        return {
            parent_skill: {
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
    class: SkillPhysicalDataModel,
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
            type: 'SkillModel',
            reference: 'm:1',
            nullable: true
        },
        magnitude: {
            type: 'number'
        },
        objectWidth: {
            type: 'number'
        },
        objectHeight: {
            type: 'number'
        },
        validateTargetOnHit: {
            type: 'boolean'
        }
    }
});

module.exports = {
    SkillPhysicalDataModel,
    entity: SkillPhysicalDataModel,
    schema
};
