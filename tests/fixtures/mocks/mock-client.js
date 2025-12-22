/**
 *
 * Reldens - Mock Client
 *
 */

class MockClient
{

    constructor()
    {
        this.sentMessages = [];
        this.broadcastMessages = [];
    }

    send(message)
    {
        this.sentMessages.push(message);
    }

    broadcast(message)
    {
        this.broadcastMessages.push(message);
    }

    clearMessages()
    {
        this.sentMessages.length = 0;
        this.broadcastMessages.length = 0;
    }

    getLastSentMessage()
    {
        return this.sentMessages[this.sentMessages.length - 1];
    }

    getLastBroadcastMessage()
    {
        return this.broadcastMessages[this.broadcastMessages.length - 1];
    }

}

module.exports.MockClient = MockClient;
