/**
 *
 * Reldens - Skills - LevelModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class LevelModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(key, label, required_experience, levels_set_id)
    {
        this.key = key;
        this.label = label;
        this.required_experience = required_experience;
        this.levels_set_id = levels_set_id;
    }

    static createByProps(props)
    {
        const {key, label, required_experience, levels_set_id} = props;
        return new this(key, label, required_experience, levels_set_id);
    }

    static relationMappings()
    {
        return {
            level_set: {
                type: 'LevelsSetModel',
                entityName: 'levelsSet',
                reference: 'm:1',
                join: {
                    from: 'level_set_id',
                    to: 'id'
                }
            },
            level_modifiers: {
                type: 'LevelModifiersModel',
                entityName: 'levelModifiers',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'level_id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: LevelModel,
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
        required_experience: {
            type: 'number'
        },
        levels_set_id: {
            type: 'LevelsSetModel',
            reference: 'm:1',
            nullable: true
        }
    }
});

module.exports = {
    LevelModel,
    entity: LevelModel,
    schema
};
