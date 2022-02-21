/**
 *
 * Reldens - Skills - ClassPathModel
 *
 */
const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class ClassPathModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(key, label, levels_set_id)
    {
        this.key = key;
        this.label = label;
        this.levels_set_id = levels_set_id;
    }

    static createByProps(props)
    {
        const {key, label, levels_set_id} = props;
        return new this(key, label, levels_set_id);
    }
    
    static relationMappings()
    {
        return {
            skills_levels_set: {
                type: 'LevelsSetModel',
                entityName: 'levelsSet',
                reference: 'm:1',
                join: {
                    from: 'levels_set_id',
                    to: 'id'
                }
            },
            skills_class_path_level_labels: {
                type: 'ClassPathLevelLabelsModel',
                entityName: 'classPathLevelLabels',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'class_path_id'
                }
            },
            skills_class_path_level_skills: {
                type: 'ClassPathLevelSkillsModel',
                entityName: 'classPathLevelSkills',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'class_path_id'
                }
            },
            class_path_for_owner: {
                type: 'OwnersClassPathModel',
                entityName: 'ownersClassPath',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'class_path_id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: ClassPathModel,
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
        levels_set_id: {
            type: 'LevelsSetModel',
            reference: 'm:1',
            nullable: true
        }
    }
});

module.exports = {
    ClassPathModel,
    entity: ClassPathModel,
    schema,
    fullPathData: async (options = {}, driver) => {
        // @TODO - BETA - Fix, this is un-tested, the fullPathData method will be removed.
        return await driver.loadAllWithRelations();
    }
};
