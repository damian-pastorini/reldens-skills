/**
 *
 * Reldens - Skills - PhysicalPropertiesValidator
 *
 */

const { ErrorManager, sc } = require('@reldens/utils');

class PhysicalPropertiesValidator
{

    static validate(props)
    {
        if(typeof props.owner.executePhysicalSkill !== 'function'){
            ErrorManager.error('Missing executePhysicalSkill required method.');
        }
        if(!sc.hasOwn(props, 'magnitude')){
            ErrorManager.error('Missing magnitude property.');
        }
        if(!sc.hasOwn(props, 'objectWidth')){
            ErrorManager.error('Missing objectWidth property.');
        }
        if(!sc.hasOwn(props, 'objectHeight')){
            ErrorManager.error('Missing objectHeight property.');
        }
    }

}

module.exports.PhysicalPropertiesValidator = PhysicalPropertiesValidator;
