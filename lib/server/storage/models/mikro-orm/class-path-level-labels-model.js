/**
 *
 * Reldens - Skills - ClassPathLevelLabelsModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class ClassPathLevelLabelsModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(class_path_id, level_id, label)
    {
        this.class_path_id = class_path_id;
        this.level_id = level_id;
        this.label = label;
    }

    static createByProps(props)
    {
        const {class_path_id, level_id, label} = props;
        return new this(class_path_id, level_id, label);
    }

    static relationMappings()
    {
        return {
            class_path: {
                type: 'ClassPathModel',
                entityName: 'classPath',
                reference: 'm:1',
                join: {
                    from: 'class_path_id',
                    to: 'id'
                }
            },
            label_level: {
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
    class: ClassPathLevelLabelsModel,
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
        level_id: {
            type: 'LevelModel',
            reference: 'm:1',
            nullable: true
        },
        label: {
            type: 'string'
        }
    }
});

module.exports = {
    ClassPathLevelLabelsModel,
    entity: ClassPathLevelLabelsModel,
    schema
};
