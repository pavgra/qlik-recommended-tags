define(
  [
    'qlik',
    'jquery',
    './node_modules/moment/moment'
  ],
  function (qlik, $, moment) {

    const EVENT_TYPE = {
      set: '$set',
      view: 'view',
      select: 'purchase',
    };

    const ENTITY_TYPE = {
      item: 'item',
      user: 'user',
    };

    function sendEvent(event) {
      const dfd = jQuery.Deferred();

      setTimeout(() => {
        dfd.resolve(event);
      }, 1000);

      return dfd.promise();
    }

    function queryRecommendations() {
      const RS_URL = 'http://54.159.100.138:9090/queries.json';

      const query = $.ajax({
        type: 'POST',
        url: RS_URL,
        data: {}
      });

      return query.promise();
    }

    function buildEvent({
      event,
      entityType,
      entityId,
      targetEntityType,
      targetEntityId,
      properties
    }) {
      let eventModel = {
        event,
        entityType,
        entityId,
        properties,
        eventTime: moment().format("YYYY-MM-DDTHH:mm:s.SSS") + 'Z',
      };

      if (targetEntityType && targetEntityId) {
        eventModel = Object.assign(
          {},
          eventModel,
          {
            targetEntityType,
            targetEntityId,
          }
        );
      }

      return eventModel;
    }

    /*
      Creates new item event.

      Sample output:
      {
         "event" : "$set",
         "entityType" : "item",
         "entityId" : "query_user_f1_f2_f5",
         "properties" : {
            "category": ["user"],
            "keywords": ["f1", "f2", "f5"]
         },
         "eventTime" : "2017-04-22T00:00:00.000Z"
      }
     */
    function buildNewItemEvent({
      properties
    }) {
      const itemId = 'filter_' + 123;

      return buildEvent({
        event: EVENT_TYPE.set,
        entityType: ENTITY_TYPE.item,
        entityId: itemId,
        properties,
      });
    }

    function buildViewEvent({
      userId,
      properties
    }) {
      const itemId = 'filter_' + 123;

      return buildEvent({
        event: EVENT_TYPE.view,
        entityType: ENTITY_TYPE.user,
        entityId: userId,
        targetEntityType: ENTITY_TYPE.item,
        targetEntityId: itemId,
      });      
    }

    return {
      EVENT_TYPE,
      ENTITY_TYPE,
      buildNewItemEvent,
      buildViewEvent,
      sendEvent,
      queryRecommendations,
    };

});
