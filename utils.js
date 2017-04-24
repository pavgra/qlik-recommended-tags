define(
  [
    'qlik',
    'jquery',
    './node_modules/moment/moment',
    './node_modules/object-hash/dist/object_hash',
  ],
  function (qlik, $, moment, objectHash) {

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    function debounce(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    };

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
      const EVENT_SERVER_URL = 'http://54.159.100.138:1010/events.json?accessKey=CT3TNcBbZ4gMMBC0NUEoHUGaqqSFwR95DSN7wOjVlg6kALWwiE31mCee9Zk_nYQu';

      const query = $.ajax({
        type: 'POST',
        url: EVENT_SERVER_URL,
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify(event)
      });

      return query.promise();
    }

    /*
      {
        "user": "1",
        "userBias": 2, // favor personal recommendations
        "num": 10,
        "fields": [
          {
            "name": "category"
            "values": ["user"],
            "bias": -1 // filter out all except mentioned category
          },{
            "name": "keywords",
            "values": ["f2"]
            "bias": 1.02 // boost/favor recommendations with the 'genre' = 'sci-fi' or 'detective'
          }
        ]
      }
     */    
    function queryRecommendations() {
      const RS_URL = 'http://54.159.100.138:9090/queries.json';

      const query = $.ajax({
        type: 'POST',
        url: RS_URL,
        dataType: 'json',
        data: {}
      });

      return query.promise();
    }

    function buildEventName(properties) {
      return objectHash.sha1(properties);
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
      const itemId = buildEventName(properties);

      return buildEvent({
        event: EVENT_TYPE.set,
        entityType: ENTITY_TYPE.item,
        entityId: itemId,
        properties,
      });
    }

    function buildViewEvent({
      userId,
      itemId
    }) {
      return buildEvent({
        event: EVENT_TYPE.view,
        entityType: ENTITY_TYPE.user,
        entityId: userId,
        targetEntityType: ENTITY_TYPE.item,
        targetEntityId: itemId,
      });
    }

    return {
      debounce,
      //
      EVENT_TYPE,
      ENTITY_TYPE,
      buildNewItemEvent,
      buildViewEvent,
      sendEvent,
      queryRecommendations,
    };

});
