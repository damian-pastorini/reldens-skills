/**
 *
 * Reldens - Skills - LevelsSetModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class LevelsSetModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(autoFillRanges, autoFillExperienceMultiplier)
    {
        this.autoFillRanges = autoFillRanges;
        this.autoFillExperienceMultiplier = autoFillExperienceMultiplier;
    }

    static createByProps(props)
    {
        const {autoFillRanges, autoFillExperienceMultiplier} = props;
        return new this(autoFillRanges, autoFillExperienceMultiplier);
    }

    static relationMappings()
    {
        return {
            class_path_id: {
                type: 'ClassPathModel',
                entityName: 'classPath',
                reference: 'm:1',
                join: {
                    from: 'id',
                    to: 'levels_set_id'
                }
            },
            skills_levels_set_levels: {
                type: 'LevelModel',
                entityName: 'level',
                reference: '1:m',
                join: {
                    from: 'id',
                    to: 'level_set_id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: LevelsSetModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        autoFillRanges: {
            type: 'boolean',
            isRequired: true
        },
        autoFillExperienceMultiplier: {
            type: 'number'
        }
    }
});

module.exports = {
    LevelsSetModel,
    entity: LevelsSetModel,
    schema
};
