/**
 *
 * Reldens - Skills - OwnersClassPathModel
 *
 */

const { ModelClassDeprecated } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class OwnersClassPathModel extends ModelClassDeprecated
{

    static get tableName()
    {
        return SkillsConst.MODELS_PREFIX+'owners_class_path';
    }

    static get relationMappings()
    {
        const { ClassPathModel } = require('./class-path');
        return {
            owner_full_class_path: {
                relation: ModelClassDeprecated.HasOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.class_path_id',
                    to: ClassPathModel.tableName+'.id'
                }
            }
        };
    }

    static async loadOwnerClassPath(ownerId)
    {
        return this.query()
            .where('owner_id', ownerId)
            .withGraphFetched('[owner_full_class_path]');
    }

    static async updateByOwner(ownerId, patchData)
    {
        return this.query()
            .patch(patchData)
            .where('owner_id', ownerId);
    }

}

module.exports.OwnersClassPathModel = OwnersClassPathModel;
