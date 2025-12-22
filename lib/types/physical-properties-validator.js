/**
 *
 * Reldens - Skills - PhysicalPropertiesValidator
 *
 */

const { Logger, sc } = require('@reldens/utils');

class PhysicalPropertiesValidator
{

    static validate(props)
    {
        if(!props.owner || typeof props.owner.executePhysicalSkill !== 'function'){
            Logger.error('Missing executePhysicalSkill required method.');
            return false;
        }
        if(!sc.hasOwn(props, 'magnitude')){
            Logger.error('Missing magnitude property.');
            return false;
        }
        if(!sc.hasOwn(props, 'objectWidth')){
            Logger.error('Missing objectWidth property.');
            return false;
        }
        if(!sc.hasOwn(props, 'objectHeight')){
            Logger.error('Missing objectHeight property.');
            return false;
        }
        return true;
    }

}

module.exports.PhysicalPropertiesValidator = PhysicalPropertiesValidator;
