/**
 *
 * Reldens - Skills - OwnersClassPathModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class OwnersClassPathModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(class_path_id, owner_id, currentLevel, currentExp)
    {
        this.class_path_id = class_path_id;
        this.owner_id = owner_id;
        this.currentLevel = currentLevel;
        this.currentExp = currentExp;
    }

    static createByProps(props)
    {
        const {class_path_id, owner_id, currentLevel, currentExp} = props;
        return new this(class_path_id, owner_id, currentLevel, currentExp);
    }

    static relationMappings()
    {
        return {
            owner_full_class_path: {
                type: 'ClassPathModel',
                entityName: 'classPath',
                reference: 'm:1',
                join: {
                    from: 'class_path_id',
                    to: 'id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: OwnersClassPathModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        class_path_id: {
            type: 'ClassPathModel',
            reference: 'm:1',
            nullable: true
        },
        owner_id: {
            type: 'number'
        },
        currentLevel: {
            type: 'number'
        },
        currentExp: {
            type: 'number'
        }
    }
});

module.exports = {
    OwnersClassPathModel,
    entity: OwnersClassPathModel,
    schema
};