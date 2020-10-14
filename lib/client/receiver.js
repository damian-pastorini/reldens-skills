/**
 *
 * Reldens - Skills - Receiver
 *
 */

const SkillsConst = require('../constants');
const { ErrorManager, sc } = require('@reldens/utils');

class Receiver
{

    constructor(props)
    {
        if(!sc.hasOwn(props, 'owner')){
            ErrorManager.error('Undefined owner.');
        }
    }

    processMessage(message)
    {
        // don't validate the message if the action prefix is not present or at the beginning of the message action:
        if(message.act.indexOf(SkillsConst.ACTIONS_PREF) !== 0){
            return false;
        }
        if(message.act === SkillsConst.ACTION_LEVEL_UP){
             this.onLevelUp(message);
        }
    }

    onLevelUp(message)
    {
        // console.log('Level UP!', message);
    }

}

module.exports = Receiver;
