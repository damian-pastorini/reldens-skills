/**
 *
 * Reldens - Skills - OwnersClassPathModel
 *
 */

const { ModelClass } = require('@reldens/storage');
const SkillsConst = require('../../../constants');

class OwnersClassPathModel extends ModelClass
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
                relation: ModelClass.HasOneRelation,
                modelClass: ClassPathModel,
                join: {
                    from: this.tableName+'.class_path_id',
                    to: ClassPathModel.tableName+'.id'
                }
            }
        };
    }

    static loadOwnerClassPath(ownerId)
    {
        return super.query()
            .where('owner_id', ownerId)
            .withGraphFetched('[owner_full_class_path]');
    }

    static update(ownerId, patchData)
    {
        return super.query()
            .patch(patchData)
            .where('owner_id', ownerId);
    }

}

module.exports.OwnersClassPathModel = OwnersClassPathModel;
