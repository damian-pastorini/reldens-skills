/**
 *
 * Reldens - Skills - ClassPathLevelSkillsModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class ClassPathLevelSkillsModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(class_path_id, level_id, skill_id)
    {
        this.class_path_id = class_path_id;
        this.level_id = level_id;
        this.skill_id = skill_id;
    }

    static createByProps(props)
    {
        const {class_path_id, level_id, skill_id} = props;
        return new this(class_path_id, level_id, skill_id);
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
            class_path_level: {
                type: 'LevelModel',
                entityName: 'level',
                reference: 'm:1',
                join: {
                    from: 'level_id',
                    to: 'id'
                }
            },
            class_path_level_skill: {
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
    class: ClassPathLevelSkillsModel,
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
        skill_id: {
            type: 'SkillModel',
            reference: 'm:1',
            nullable: true
        },
    }
});


module.exports = {
    ClassPathLevelSkillsModel,
    entity: ClassPathLevelSkillsModel,
    schema
};
